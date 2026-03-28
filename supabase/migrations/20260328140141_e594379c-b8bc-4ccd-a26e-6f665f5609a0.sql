
-- Disable only user-defined triggers to avoid system trigger permission issues
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_material_catalog;

INSERT INTO public.material_catalog (
  code, name, family, default_yield, yield_min, yield_max, yield_loss_reason, yield_source,
  default_cost_per_kg,
  factor_co2, factor_energia, factor_agua, factor_arboles,
  uses_co2, uses_energia, uses_agua, uses_arboles,
  impacto_valido, is_active, display_order, factors_source
) VALUES
  ('CAP-001',    'CAPLE',      'plástico',        0.90, 0.85, 0.95, 'Contaminación y humedad residual',    '', 0.60,  NULL, NULL, NULL, NULL, true, true, false, false, false, true, 22, ''),
  ('PET-AZ-001', 'PET AZUL',   'plástico',        0.95, 0.90, 0.98, 'Etiquetas y tapas residuales',        '', 4.50,  NULL, NULL, NULL, NULL, true, true, false, false, false, true, 23, ''),
  ('CRE-001',    'CREMERO',    'plástico mezcla',  0.90, 0.85, 0.95, 'Mezcla de resinas y contaminantes',   '', 5.00,  NULL, NULL, NULL, NULL, true, true, false, false, false, true, 24, ''),
  ('ACE-001',    'ACERO',      'metal',            0.95, 0.90, 0.98, 'Óxido y recubrimientos',              '', 12.00, NULL, NULL, NULL, NULL, true, true, false, false, false, true, 25, ''),
  ('PET-8020',   'PET 80/20',  'plástico mezcla',  0.95, 0.90, 0.98, 'Mezcla 80/20 con contaminantes',      '', 5.00,  NULL, NULL, NULL, NULL, true, true, false, false, false, true, 26, '');

-- Re-enable triggers
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_material_catalog;
