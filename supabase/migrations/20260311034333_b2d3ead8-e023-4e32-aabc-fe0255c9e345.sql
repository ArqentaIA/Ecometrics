
-- =====================================================
-- CAPA 1: CATÁLOGO MAESTRO DE MATERIALES
-- =====================================================
CREATE TABLE public.material_catalog (
  id serial PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  family text NOT NULL DEFAULT 'general',
  default_yield numeric NOT NULL DEFAULT 90,
  yield_min numeric NOT NULL DEFAULT 0,
  yield_max numeric NOT NULL DEFAULT 100,
  yield_loss_reason text NOT NULL DEFAULT '',
  factor_arboles numeric,
  factor_co2 numeric,
  factor_energia numeric,
  factor_agua numeric,
  uses_arboles boolean NOT NULL DEFAULT false,
  uses_co2 boolean NOT NULL DEFAULT true,
  uses_energia boolean NOT NULL DEFAULT true,
  uses_agua boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  yield_source text NOT NULL DEFAULT '',
  factors_source text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.material_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read the catalog
CREATE POLICY "Authenticated users can read catalog"
  ON public.material_catalog FOR SELECT TO authenticated
  USING (true);

-- Only admins can modify catalog
CREATE POLICY "Admins can manage catalog"
  ON public.material_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed catalog with current materials
INSERT INTO public.material_catalog (code, name, family, default_yield, yield_min, yield_max, yield_loss_reason, factor_arboles, factor_co2, factor_energia, factor_agua, uses_arboles, uses_co2, uses_energia, uses_agua, display_order, yield_source, factors_source) VALUES
('CARTON',         'CARTON',                       'fibra',    95, 90, 97, 'Humedad / mezcla de grados',      0.005, 0.82,  3.2,  10, true,  true, true, true,  1,  'Datos técnicos planta IRM', 'EPA WARM v16 — Corrugated Containers'),
('PET',            'ENVASES DE PET',               'plastico', 92, 88, 95, 'Etiquetas / tapas',               NULL,  1.00,  5.3,  17, false, true, true, true,  2,  'Datos técnicos planta IRM', 'EPA WARM v16 — PET Plastic'),
('PET VERDE',      'ENVASES PET VERDE',            'plastico', 90, 86, 94, 'Mezcla de colores',               NULL,  1.00,  5.3,  17, false, true, true, true,  3,  'Datos técnicos planta IRM', 'EPA WARM v16 — PET Plastic (proxy)'),
('HDPP',           'Polipropileno Alta Densidad',   'plastico', 88, 82, 93, 'Mezcla de polímeros',             NULL,  1.08,  6.1,  22, false, true, true, true,  4,  'Datos técnicos planta IRM', 'EPA WARM v16 — Polypropylene (PP)'),
('LECHERO',        'ENVASE CARTON LECHE',          'compuesto',82, 70, 90, 'Laminación multicapa',            0.004, 0.55,  2.1,  12, true,  true, true, true,  5,  'Datos técnicos planta IRM', 'EPA WARM v16 — proxy papel+plástico (Tetrapack)'),
('ARCHIVO BCO',    'PAPEL DE ARCHIVO',             'fibra',    96, 90, 98, 'Grapas / contaminación',          0.006, 1.10,  3.8,  28, true,  true, true, true,  6,  'Datos técnicos planta IRM', 'EPA WARM v16 — Office Paper'),
('COLOR',          'PAPEL ARCHIVO COLOR',          'fibra',    96, 90, 98, 'Pigmentos / contaminación',       0.006, 1.10,  3.8,  28, true,  true, true, true,  7,  'Datos técnicos planta IRM', 'EPA WARM v16 — Office Paper (proxy color)'),
('CAPLE',          'CARTON DELGADO',               'fibra',    82, 70, 90, 'Laminación',                      0.005, 0.82,  3.2,  10, true,  true, true, true,  8,  'Datos técnicos planta IRM', 'EPA WARM v16 — Corrugated Containers (proxy)'),
('A. MUERTO',      'ARCHIVO MUERTO',               'fibra',    93, 88, 96, 'Mezcla de tipos de papel',        0.005, 0.96,  3.5,  10, true,  true, true, true,  9,  'Datos técnicos planta IRM', 'EPA WARM v16 — Mixed Paper'),
('FIERRO',         'FIERRO VIEJO',                 'metal',    98, 95, 99, 'Tierra / suciedad',               NULL,  1.46,  4.3,  40, false, true, true, true,  10, 'Datos técnicos planta IRM', 'EPA WARM v16 — Steel Cans'),
('ALUM BOTE',      'ALUMINIO BOTE',                'metal',    96, 92, 98, 'Residuos internos',               NULL,  9.13,  47.0, 35, false, true, true, true,  11, 'Datos técnicos planta IRM', 'EPA WARM v16 — Aluminum Cans'),
('ALUM MACIZO',    'ALUMINIO MACIZO',              'metal',    98, 95, 99, 'Tierra / suciedad',               NULL,  9.13,  47.0, 35, false, true, true, true,  12, 'Datos técnicos planta IRM', 'EPA WARM v16 — Aluminum Ingot (proxy)'),
('VIDRIO',         'VIDRIO',                       'vidrio',   88, 80, 92, 'Cerámica / contaminación',        NULL,  0.30,  0.6,  2,  false, true, true, true,  13, 'Datos técnicos planta IRM', 'EPA WARM v16 — Glass'),
('SUERO',          'SUERO',                        'organico', 80, 70, 88, 'Contenido orgánico',              NULL,  0.19,  NULL, 5,  false, true, false,true,  14, 'Datos técnicos planta IRM', 'EPA WARM v16 — Food Waste (proxy lácteo)'),
('taprosca',       'TAPAROSCA',                    'plastico', 90, 85, 95, 'Otros plásticos',                 NULL,  1.08,  6.1,  22, false, true, true, true,  15, 'Datos técnicos planta IRM', 'EPA WARM v16 — PP (proxy tapas polipropileno)'),
('bolsa plastico', 'BOLSA DE PLASTICO',            'plastico', 90, 85, 95, 'Humedad',                         NULL,  0.92,  5.1,  17, false, true, true, true,  16, 'Datos técnicos planta IRM', 'EPA WARM v16 — HDPE (proxy bolsa plástico)');

-- Index for active materials
CREATE INDEX idx_catalog_active ON public.material_catalog (is_active, display_order);
