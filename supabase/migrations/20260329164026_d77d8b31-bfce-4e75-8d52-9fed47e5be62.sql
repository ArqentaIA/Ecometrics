-- Recalculate all confirmed captures with current active factors
-- Preserves: kg_brutos, kg_netos, yield_applied, cost_per_kg_applied, result_economic_impact, proveedor, status, dates

ALTER TABLE material_captures DISABLE TRIGGER USER;

UPDATE material_captures mc
SET
  factor_co2_applied    = mf.factor_co2,
  factor_energia_applied = mf.factor_energia,
  factor_agua_applied   = mf.factor_agua,
  factor_arboles_applied = mf.factor_arboles,
  factor_version        = mf.version,
  result_co2            = CASE WHEN cat.uses_co2 AND mf.factor_co2 IS NOT NULL AND cat.impacto_valido
                            THEN mc.kg_netos * mf.factor_co2 ELSE 0 END,
  result_energia        = CASE WHEN cat.uses_energia AND mf.factor_energia IS NOT NULL AND cat.impacto_valido
                            THEN mc.kg_netos * mf.factor_energia ELSE 0 END,
  result_agua           = CASE WHEN cat.uses_agua AND mf.factor_agua IS NOT NULL AND cat.impacto_valido
                            THEN mc.kg_netos * mf.factor_agua ELSE 0 END,
  result_arboles        = CASE WHEN cat.uses_arboles AND mf.factor_arboles IS NOT NULL AND cat.impacto_valido
                            THEN mc.kg_netos * mf.factor_arboles ELSE 0 END,
  impacto_pendiente     = NOT cat.impacto_valido
                          OR (cat.uses_co2 AND mf.factor_co2 IS NULL)
                          OR (cat.uses_energia AND mf.factor_energia IS NULL)
                          OR (cat.uses_agua AND mf.factor_agua IS NULL)
                          OR (cat.uses_arboles AND mf.factor_arboles IS NULL),
  updated_at            = now()
FROM material_catalog cat
JOIN material_factors mf ON mf.material_code = cat.code AND mf.activo = true
WHERE mc.material_code = cat.code
  AND mc.is_confirmed = true;

ALTER TABLE material_captures ENABLE TRIGGER USER;