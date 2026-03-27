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
  default_cost_per_kg: number;
  impacto_valido: boolean;
}

export interface VersionedFactor {
  id: string;
  material_code: string;
  factor_co2: number | null;
  factor_energia: number | null;
  factor_agua: number | null;
  factor_arboles: number | null;
  version: number;
  fecha_inicio: string;
  activo: boolean;
  fuente: string;
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
  factor_version: number | null;
  economic_impact: number;
  impacto_valido: boolean;
}

/**
 * Motor central de cálculo.
 * Recibe un material del catálogo y kg brutos capturados.
 * Devuelve todos los indicadores calculados.
 *
 * REGLA DE ORO:
 *   Base económica:  kg_brutos × precio_kg
 *   Base ambiental:  kg_netos × factor_versionado
 *   kg_netos = kg_brutos × (yield / 100)
 *
 * Si impacto_valido = false, todos los KPIs ambientales = 0.
 */
export function calculateIndicators(
  material: CatalogMaterial,
  kgBrutos: number,
  costPerKg?: number,
  versionedFactor?: VersionedFactor | null
): CalculatedKPIs {
  const appliedCost = costPerKg ?? material.default_cost_per_kg ?? 0;

  // BATERÍAS: special case — by piece, no yield, no env KPIs
  const isBattery = material.code === 'BATERIAS';

  const yieldApplied = isBattery ? 0 : material.default_yield;
  const kgNetos = isBattery ? 0 : kgBrutos * yieldApplied;

  // Use versioned factors (material_factors) as official source;
  // fall back to catalog factors only if no versioned factor exists
  const fCo2 = versionedFactor?.factor_co2 ?? material.factor_co2;
  const fEnergia = versionedFactor?.factor_energia ?? material.factor_energia;
  const fAgua = versionedFactor?.factor_agua ?? material.factor_agua;
  const fArboles = versionedFactor?.factor_arboles ?? material.factor_arboles;
  const factorVersion = versionedFactor?.version ?? null;

  // If impacto_valido is false, all environmental KPIs are zero
  const validImpact = material.impacto_valido !== false;

  // Batteries and materials without valid impact get no env KPIs
  const canCalcEnv = !isBattery && validImpact;

  return {
    kg_netos: kgNetos,
    yield_applied: yieldApplied,
    arboles: canCalcEnv && material.uses_arboles && fArboles != null
      ? kgNetos * fArboles : 0,
    co2: canCalcEnv && material.uses_co2 && fCo2 != null
      ? kgNetos * fCo2 : 0,
    energia: canCalcEnv && material.uses_energia && fEnergia != null
      ? kgNetos * fEnergia : 0,
    agua: canCalcEnv && material.uses_agua && fAgua != null
      ? kgNetos * fAgua : 0,
    uses_arboles: material.uses_arboles,
    uses_co2: material.uses_co2,
    uses_energia: material.uses_energia,
    uses_agua: material.uses_agua,
    factor_arboles: fArboles,
    factor_co2: fCo2,
    factor_energia: fEnergia,
    factor_agua: fAgua,
    factor_version: factorVersion,
    // REGLA: impacto económico = kg_brutos × precio (base bruta)
    economic_impact: kgBrutos * appliedCost,
    impacto_valido: validImpact,
  };
}

/**
 * Valida que un material del catálogo tiene la configuración
 * necesaria para ser capturado.
 */
export function validateMaterialForCapture(
  material: CatalogMaterial,
  versionedFactor?: VersionedFactor | null
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!material.is_active) errors.push("Material inactivo");
  if (material.default_yield <= 0 || material.default_yield > 1)
    errors.push("Yield no válido");

  // Only validate factors if the material has valid environmental impact
  if (material.impacto_valido !== false) {
    const factor = versionedFactor;
    if (material.uses_arboles && (factor?.factor_arboles ?? material.factor_arboles) == null)
      errors.push("Factor de árboles requerido pero no definido");
    if (material.uses_co2 && (factor?.factor_co2 ?? material.factor_co2) == null)
      errors.push("Factor de CO₂ requerido pero no definido");
    if (material.uses_energia && (factor?.factor_energia ?? material.factor_energia) == null)
      errors.push("Factor de energía requerido pero no definido");
    if (material.uses_agua && (factor?.factor_agua ?? material.factor_agua) == null)
      errors.push("Factor de agua requerido pero no definido");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Construye el objeto snapshot para guardar en material_captures.
 * Incluye factor_version para trazabilidad.
 */
export function buildCaptureSnapshot(
  material: CatalogMaterial,
  kgBrutos: number,
  userId: string,
  month: number,
  year: number,
  costPerKg?: number,
  versionedFactor?: VersionedFactor | null
) {
  const appliedCost = costPerKg ?? material.default_cost_per_kg ?? 0;
  const kpis = calculateIndicators(material, kgBrutos, appliedCost, versionedFactor);

  const impactoPendiente = !material.impacto_valido ||
    (material.uses_co2 && kpis.factor_co2 == null) ||
    (material.uses_energia && kpis.factor_energia == null) ||
    (material.uses_agua && kpis.factor_agua == null) ||
    (material.uses_arboles && kpis.factor_arboles == null);

  return {
    user_id: userId,
    material_code: material.code,
    material_name: material.name,
    family: material.family,
    kg_brutos: kgBrutos,
    yield_applied: kpis.yield_applied,
    kg_netos: kpis.kg_netos,
    factor_arboles_applied: kpis.factor_arboles,
    factor_co2_applied: kpis.factor_co2,
    factor_energia_applied: kpis.factor_energia,
    factor_agua_applied: kpis.factor_agua,
    factor_version: kpis.factor_version,
    uses_arboles: material.uses_arboles,
    uses_co2: material.uses_co2,
    uses_energia: material.uses_energia,
    uses_agua: material.uses_agua,
    result_arboles: kpis.arboles,
    result_co2: kpis.co2,
    result_energia: kpis.energia,
    result_agua: kpis.agua,
    cost_per_kg_applied: appliedCost,
    result_economic_impact: kpis.economic_impact,
    is_confirmed: true,
    status: 'validado',
    impacto_pendiente: impactoPendiente,
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
  economic_impact: { decimals: 2 },
  cost_per_kg: { decimals: 2 },
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
