
-- Disable only user-defined triggers
ALTER TABLE public.material_catalog DISABLE TRIGGER USER;

INSERT INTO public.material_catalog (code, name, family, default_yield, yield_min, yield_max, yield_loss_reason, 
  factor_arboles, factor_co2, factor_energia, factor_agua, 
  uses_arboles, uses_co2, uses_energia, uses_agua, 
  is_active, display_order, yield_source, factors_source, default_cost_per_kg, impacto_valido)
VALUES 
  ('PERIODICO', 'PERIÓDICO', 'celulosa', 90, 85, 95, 'Tinta / humedad',
   0.005, 0.96, 3.5, 10, true, true, true, true,
   true, 17, 'EPA WARM v16', 'EPA WARM v16 — Newspaper', 1.00, true),
  ('REVOLTURA', 'REVOLTURA', 'mezcla', 70, 50, 85, 'Mezcla heterogénea sin clasificar',
   NULL, NULL, NULL, NULL, false, false, false, false,
   true, 18, 'Estimación interna', 'No aplica — sin metodología validada', 0.50, false),
  ('BRONCE', 'BRONCE', 'metal', 97, 94, 99, 'Tierra / suciedad',
   NULL, 4.50, 12.0, NULL, false, true, true, false,
   true, 19, 'Estimación industria metalúrgica', 'International Copper Study Group (proxy)', 60.00, true),
  ('COBRE', 'COBRE', 'metal', 97, 94, 99, 'Tierra / suciedad',
   NULL, 3.70, 10.0, NULL, false, true, true, false,
   true, 20, 'Estimación industria metalúrgica', 'International Copper Study Group', 80.00, true),
  ('BATERIAS', 'BATERÍAS', 'residuo_especial', 95, 90, 98, 'Carcasa / plástico',
   NULL, NULL, NULL, NULL, false, false, false, false,
   true, 21, 'Estimación interna', 'No aplica — sin metodología validada', 12.00, false)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.material_catalog ENABLE TRIGGER USER;

-- Versioned factors
ALTER TABLE public.material_factors DISABLE TRIGGER USER;

INSERT INTO public.material_factors (material_code, factor_co2, factor_energia, factor_agua, factor_arboles, version, activo, fuente)
VALUES
  ('PERIODICO', 0.96, 3.5, 10, 0.005, 1, true, 'EPA WARM v16 — Newspaper'),
  ('BRONCE', 4.50, 12.0, NULL, NULL, 1, true, 'International Copper Study Group (proxy)'),
  ('COBRE', 3.70, 10.0, NULL, NULL, 1, true, 'International Copper Study Group')
ON CONFLICT (material_code, version) DO NOTHING;

ALTER TABLE public.material_factors ENABLE TRIGGER USER;
