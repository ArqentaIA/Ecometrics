
CREATE TABLE public.report_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE,
  hash_sha256 text NOT NULL,
  firma_digital text NOT NULL,
  dataset_id text NOT NULL,
  tipo_reporte text NOT NULL DEFAULT 'dashboard_export',
  usuario_id uuid NOT NULL,
  fecha_generacion timestamptz NOT NULL DEFAULT now(),
  parametros_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_registros integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports"
  ON public.report_audit_log FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can view own reports"
  ON public.report_audit_log FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Admins can view all reports"
  ON public.report_audit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'direccion'::app_role));

CREATE POLICY "Anon can read for verification"
  ON public.report_audit_log FOR SELECT TO anon
  USING (true);
