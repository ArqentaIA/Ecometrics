-- ═══════════════════════════════════════════════
-- FASE 1 — FUNDACIÓN DE CLIENTES (aditiva)
-- ═══════════════════════════════════════════════

-- Helper: rol administrativo global
CREATE OR REPLACE FUNCTION public.is_global_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'administrador'::app_role, 'direccion'::app_role)
  )
$$;

-- ── 1. clientes ────────────────────────────────
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  razon_social text,
  rfc text,
  direccion text,
  contacto text,
  correo text,
  telefono text,
  tipo text NOT NULL DEFAULT 'empresa',
  es_publico_general boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX clientes_nombre_uidx ON public.clientes (lower(nombre));
CREATE UNIQUE INDEX clientes_publico_general_uidx ON public.clientes (es_publico_general) WHERE es_publico_general;
CREATE INDEX clientes_activo_idx ON public.clientes (activo);
CREATE INDEX clientes_rfc_idx ON public.clientes (rfc);

GRANT SELECT, INSERT, UPDATE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- updated_at
CREATE OR REPLACE FUNCTION public.fn_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

-- Registro especial único
INSERT INTO public.clientes (nombre, razon_social, tipo, es_publico_general, notas)
VALUES ('Público en General', 'Público en General', 'publico_general', true,
        'Registro especial del sistema. Único e irrepetible. No eliminar.');

-- ── 2. usuario_clientes (N:M auth.users ↔ clientes) ──
CREATE TABLE public.usuario_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usuario_clientes_uniq UNIQUE (user_id, cliente_id)
);

CREATE INDEX usuario_clientes_user_idx ON public.usuario_clientes (user_id);
CREATE INDEX usuario_clientes_cliente_idx ON public.usuario_clientes (cliente_id);

GRANT SELECT ON public.usuario_clientes TO authenticated;
GRANT ALL ON public.usuario_clientes TO service_role;
ALTER TABLE public.usuario_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario lee sus asignaciones"
ON public.usuario_clientes FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_global_role(auth.uid()));

CREATE POLICY "Roles globales gestionan asignaciones"
ON public.usuario_clientes FOR ALL TO authenticated
USING (public.is_global_role(auth.uid()))
WITH CHECK (public.is_global_role(auth.uid()));

-- Helper: acceso de un usuario a un cliente
CREATE OR REPLACE FUNCTION public.user_can_access_cliente(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.is_global_role(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.usuario_clientes
      WHERE user_id = _user_id AND cliente_id = _cliente_id
    )
$$;

-- Políticas de clientes
CREATE POLICY "Lectura de clientes asignados o rol global"
ON public.clientes FOR SELECT TO authenticated
USING (public.user_can_access_cliente(auth.uid(), id));

CREATE POLICY "Roles globales crean clientes"
ON public.clientes FOR INSERT TO authenticated
WITH CHECK (public.is_global_role(auth.uid()));

CREATE POLICY "Roles globales editan clientes"
ON public.clientes FOR UPDATE TO authenticated
USING (public.is_global_role(auth.uid()))
WITH CHECK (public.is_global_role(auth.uid()));

-- ── 3. reporte_clientes (N:M report_audit_log ↔ clientes) ──
-- PK real de report_audit_log verificada: id (uuid); folio tiene UNIQUE.
CREATE TABLE public.reporte_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id uuid NOT NULL REFERENCES public.report_audit_log(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reporte_clientes_uniq UNIQUE (reporte_id, cliente_id)
);

CREATE INDEX reporte_clientes_reporte_idx ON public.reporte_clientes (reporte_id);
CREATE INDEX reporte_clientes_cliente_idx ON public.reporte_clientes (cliente_id);

GRANT SELECT, INSERT ON public.reporte_clientes TO authenticated;
GRANT ALL ON public.reporte_clientes TO service_role;
ALTER TABLE public.reporte_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles globales leen reporte_clientes"
ON public.reporte_clientes FOR SELECT TO authenticated
USING (public.is_global_role(auth.uid()));

CREATE POLICY "Roles globales registran reporte_clientes"
ON public.reporte_clientes FOR INSERT TO authenticated
WITH CHECK (public.is_global_role(auth.uid()));

-- ── 4. cliente_id en material_captures (NULL, sin backfill) ──
ALTER TABLE public.material_captures
  ADD COLUMN cliente_id uuid NULL REFERENCES public.clientes(id);

CREATE INDEX material_captures_cliente_idx ON public.material_captures (cliente_id);

-- ── 5. cliente_id opcional en public_tokens (NULL) ──
ALTER TABLE public.public_tokens
  ADD COLUMN cliente_id uuid NULL REFERENCES public.clientes(id);

CREATE INDEX public_tokens_cliente_idx ON public.public_tokens (cliente_id);