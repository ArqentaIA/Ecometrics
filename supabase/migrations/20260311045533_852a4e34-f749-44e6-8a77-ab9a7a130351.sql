
-- 2. TABLA: material_categories
CREATE TABLE IF NOT EXISTS public.material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial categories based on existing families
INSERT INTO public.material_categories (name, description, display_order) VALUES
  ('Papel y Cartón', 'Materiales fibrosos de papel y cartón', 1),
  ('Plásticos', 'Polímeros y derivados plásticos', 2),
  ('Metales', 'Metales ferrosos y no ferrosos', 3),
  ('Vidrio', 'Vidrio reciclable', 4),
  ('Orgánicos', 'Materiales orgánicos compostables', 5),
  ('Composites', 'Materiales compuestos', 6),
  ('Otros', 'Materiales no clasificados', 7)
ON CONFLICT (name) DO NOTHING;

-- 3. TABLA: audit_log (bitácora)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  event_type text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  user_id uuid NOT NULL,
  user_role text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- 4. TABLA: additional_material_requests (solicitudes de material adicional)
CREATE TABLE IF NOT EXISTS public.additional_material_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_name text NOT NULL,
  proposed_category text,
  description text,
  proposed_price_per_kg numeric DEFAULT 0,
  proposed_unit text DEFAULT 'kg',
  reason text,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'aprobado', 'rechazado', 'integrado_al_catalogo')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_comment text,
  converted_to_catalog boolean NOT NULL DEFAULT false,
  catalog_material_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. TABLA: temporary_materials (materiales adicionales aprobados para uso temporal)
CREATE TABLE IF NOT EXISTS public.temporary_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  price_per_kg numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.additional_material_requests(id),
  requires_review boolean NOT NULL DEFAULT true,
  approved_for_temp_use boolean NOT NULL DEFAULT false,
  valid_until timestamptz,
  -- Environmental factors (null = not validated yet)
  uses_arboles boolean NOT NULL DEFAULT false,
  uses_co2 boolean NOT NULL DEFAULT false,
  uses_energia boolean NOT NULL DEFAULT false,
  uses_agua boolean NOT NULL DEFAULT false,
  factor_arboles numeric,
  factor_co2 numeric,
  factor_energia numeric,
  factor_agua numeric,
  default_yield numeric NOT NULL DEFAULT 90,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. TABLA: system_parameters
CREATE TABLE IF NOT EXISTS public.system_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default parameters
INSERT INTO public.system_parameters (key, value, description) VALUES
  ('max_kg_per_capture', '99999', 'Máximo de kg permitido por captura individual'),
  ('decimals_allowed', '2', 'Decimales permitidos en campos numéricos'),
  ('allow_operator_confirm', 'false', 'Permitir que operadores confirmen capturas'),
  ('allow_additional_materials', 'true', 'Permitir captura de materiales adicionales'),
  ('require_approval_additional', 'true', 'Requerir aprobación para materiales adicionales')
ON CONFLICT (key) DO NOTHING;

-- 7. ADD columns to material_captures for additional material support
ALTER TABLE public.material_captures
  ADD COLUMN IF NOT EXISTS is_additional_material boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS temporary_material_id uuid REFERENCES public.temporary_materials(id),
  ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS capture_origin text DEFAULT 'manual';

-- 8. ADD category_id to material_catalog
ALTER TABLE public.material_catalog
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.material_categories(id),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
