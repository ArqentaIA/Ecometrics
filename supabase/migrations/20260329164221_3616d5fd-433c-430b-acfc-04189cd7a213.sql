-- Enable uses_agua for all 22 materials with valid water factors
ALTER TABLE material_catalog DISABLE TRIGGER USER;
ALTER TABLE material_captures DISABLE TRIGGER USER;

UPDATE material_catalog
SET uses_agua = true, updated_at = now()
WHERE code IN (
  'A. MUERTO','ACE-001','ALUM BOTE','ALUM MACIZO','ARCHIVO BCO',
  'bolsa plast','BRONCE','CAP-001','CARTON','COBRE','COLOR',
  'FIERRO','HDPP','LECHERO','PERIODICO','PET','PET VERDE',
  'PET-8020','PET-AZ-001','SUERO','taprosca','VIDRIO'
);

-- Recalculate confirmed captures with updated uses_agua
UPDATE material_captures mc
SET
  uses_agua = cat.uses_agua,
  result_agua = CASE WHEN cat.uses_agua AND mf.factor_agua IS NOT NULL AND cat.impacto_valido
                  THEN mc.kg_netos * mf.factor_agua ELSE 0 END,
  updated_at = now()
FROM material_catalog cat
JOIN material_factors mf ON mf.material_code = cat.code AND mf.activo = true
WHERE mc.material_code = cat.code
  AND mc.is_confirmed = true;

ALTER TABLE material_catalog ENABLE TRIGGER USER;
ALTER TABLE material_captures ENABLE TRIGGER USER;