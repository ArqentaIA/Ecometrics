// ─────────────────────────────────────────────────────────
// CAPA 3: MOTOR CENTRAL DE CÁLCULO
// Único punto de cálculo de indicadores ambientales.
// Todas las pantallas (captura, dashboard, export) deben
// consumir estos resultados — nunca calcular por su cuenta.
// ─────────────────────────────────────────────────────────

export interface CatalogMaterial {
  id: number;
  code: string;
  name: string;
  family: string;
  default_yield: number;
  yield_min: number;
  yield_max: number;
  yield_loss_reason: string;
  factor_arboles: number | null;
  factor_co2: number | null;
  factor_energia: number | null;
  factor_agua: number | null;
  uses_arboles: boolean;
  uses_co2: boolean;
  uses_energia: boolean;
  uses_agua: boolean;
  is_active: boolean;
  display_order: number;
  yield_source: string;
  factors_source: string;
}

export interface CalculatedKPIs {
  kg_netos: number;
  yield_applied: number;
  arboles: number;
  co2: number;
  energia: number;
  agua: number;
  uses_arboles: boolean;
  uses_co2: boolean;
  uses_energia: boolean;
  uses_agua: boolean;
  factor_arboles: number | null;
  factor_co2: number | null;
  factor_energia: number | null;
  factor_agua: number | null;
}

/**
 * Motor central de cálculo.
 * Recibe un material del catálogo y kg brutos capturados.
 * Devuelve todos los indicadores calculados sobre kg netos.
 *
 * REGLA UNIVERSAL: kg_netos = kg_brutos × (yield / 100)
 * Todos los indicadores se calculan sobre kg_netos.
 */
export function calculateIndicators(
  material: CatalogMaterial,
  kgBrutos: number
): CalculatedKPIs {
  const yieldApplied = material.default_yield;
  const kgNetos = kgBrutos * (yieldApplied / 100);

  return {
    kg_netos: kgNetos,
    yield_applied: yieldApplied,
    arboles: material.uses_arboles && material.factor_arboles != null
      ? kgNetos * material.factor_arboles : 0,
    co2: material.uses_co2 && material.factor_co2 != null
      ? kgNetos * material.factor_co2 : 0,
    energia: material.uses_energia && material.factor_energia != null
      ? kgNetos * material.factor_energia : 0,
    agua: material.uses_agua && material.factor_agua != null
      ? kgNetos * material.factor_agua : 0,
    uses_arboles: material.uses_arboles,
    uses_co2: material.uses_co2,
    uses_energia: material.uses_energia,
    uses_agua: material.uses_agua,
    factor_arboles: material.factor_arboles,
    factor_co2: material.factor_co2,
    factor_energia: material.factor_energia,
    factor_agua: material.factor_agua,
  };
}

/**
 * Valida que un material del catálogo tiene la configuración
 * necesaria para ser capturado.
 */
export function validateMaterialForCapture(material: CatalogMaterial): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!material.is_active) errors.push("Material inactivo");
  if (material.default_yield <= 0 || material.default_yield > 100)
    errors.push("Yield no válido");
  if (material.uses_arboles && material.factor_arboles == null)
    errors.push("Factor de árboles requerido pero no definido");
  if (material.uses_co2 && material.factor_co2 == null)
    errors.push("Factor de CO₂ requerido pero no definido");
  if (material.uses_energia && material.factor_energia == null)
    errors.push("Factor de energía requerido pero no definido");
  if (material.uses_agua && material.factor_agua == null)
    errors.push("Factor de agua requerido pero no definido");

  return { valid: errors.length === 0, errors };
}

/**
 * Construye el objeto snapshot para guardar en material_captures.
 */
export function buildCaptureSnapshot(
  material: CatalogMaterial,
  kgBrutos: number,
  userId: string,
  month: number,
  year: number
) {
  const kpis = calculateIndicators(material, kgBrutos);

  return {
    user_id: userId,
    material_code: material.code,
    material_name: material.name,
    family: material.family,
    kg_brutos: kgBrutos,
    yield_applied: kpis.yield_applied,
    kg_netos: kpis.kg_netos,
    factor_arboles_applied: material.factor_arboles,
    factor_co2_applied: material.factor_co2,
    factor_energia_applied: material.factor_energia,
    factor_agua_applied: material.factor_agua,
    uses_arboles: material.uses_arboles,
    uses_co2: material.uses_co2,
    uses_energia: material.uses_energia,
    uses_agua: material.uses_agua,
    result_arboles: kpis.arboles,
    result_co2: kpis.co2,
    result_energia: kpis.energia,
    result_agua: kpis.agua,
    is_confirmed: true,
    month,
    year,
    updated_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────
// REGLAS DE REDONDEO (solo para presentación)
// Los cálculos internos usan precisión completa.
// ─────────────────────────────────────────────────────────
export const DISPLAY_FORMATS = {
  kg_brutos: { decimals: 2 },
  yield: { decimals: 0, suffix: "%" },
  kg_netos: { decimals: 0 },
  arboles: { decimals: 1 },
  co2: { decimals: 2 },
  energia: { decimals: 1 },
  agua: { decimals: 0 },
} as const;

export function formatKPI(
  key: keyof typeof DISPLAY_FORMATS,
  value: number
): string {
  const fmt = DISPLAY_FORMATS[key];
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: fmt.decimals,
    maximumFractionDigits: fmt.decimals,
  });
}
