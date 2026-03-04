export interface Material {
  id: number;
  description: string;
  code: string;
  mockKg: number;
  factorArboles: number | null;
  factorEnergia: number | null;
  aguaFactor: number | null;
  costoDisp: number;
  isPaper: boolean;
}

export const MATERIALS: Material[] = [
  { id: 1, description: "CARTON", code: "CARTON", mockKg: 4821, factorArboles: 3, factorEnergia: 4, aguaFactor: 26000, costoDisp: 900, isPaper: true },
  { id: 2, description: "ENVASES DE PET", code: "PET", mockKg: 130, factorArboles: 2.5, factorEnergia: 5, aguaFactor: 18000, costoDisp: 1200, isPaper: false },
  { id: 3, description: "ENVASES PET VERDE", code: "PET VERDE", mockKg: 6, factorArboles: null, factorEnergia: null, aguaFactor: null, costoDisp: 1200, isPaper: false },
  { id: 4, description: "Polipropileno Alta Densidad", code: "HDPP", mockKg: 331, factorArboles: 1.8, factorEnergia: 5, aguaFactor: 18000, costoDisp: 300, isPaper: false },
  { id: 5, description: "ENVASE CARTON LECHE", code: "LECHERO", mockKg: 540, factorArboles: 3, factorEnergia: 4, aguaFactor: 26000, costoDisp: 1200, isPaper: true },
  { id: 6, description: "PAPEL DE ARCHIVO", code: "ARCHIVO BCO", mockKg: 2274, factorArboles: 3.3, factorEnergia: 4, aguaFactor: 26000, costoDisp: 900, isPaper: true },
  { id: 7, description: "PAPEL ARCHIVO COLOR", code: "COLOR", mockKg: 39, factorArboles: 3.3, factorEnergia: 4, aguaFactor: 26000, costoDisp: 900, isPaper: true },
  { id: 8, description: "CARTON DELGADO", code: "CAPLE", mockKg: 390, factorArboles: 3, factorEnergia: 4, aguaFactor: 26000, costoDisp: 900, isPaper: true },
  { id: 9, description: "ARCHIVO MUERTO", code: "A. MUERTO", mockKg: 960, factorArboles: 3.3, factorEnergia: 4, aguaFactor: 26000, costoDisp: 900, isPaper: true },
  { id: 10, description: "FIERRO VIEJO", code: "FIERRO", mockKg: 166.5, factorArboles: 1.9, factorEnergia: 6, aguaFactor: 7000, costoDisp: 1000, isPaper: false },
  { id: 11, description: "ALUMINIO BOTE", code: "ALUM BOTE", mockKg: 21.2, factorArboles: 9, factorEnergia: 14, aguaFactor: 9000, costoDisp: 1000, isPaper: false },
  { id: 12, description: "ALUMINIO MACIZO", code: "ALUM MACIZO", mockKg: 55, factorArboles: 9, factorEnergia: 14, aguaFactor: 9000, costoDisp: 1000, isPaper: false },
  { id: 13, description: "VIDRIO", code: "VIDRIO", mockKg: 136, factorArboles: null, factorEnergia: null, aguaFactor: null, costoDisp: 800, isPaper: false },
  { id: 14, description: "SUERO", code: "SUERO", mockKg: 180, factorArboles: null, factorEnergia: null, aguaFactor: null, costoDisp: 1200, isPaper: false },
  { id: 15, description: "TAPAROSCA", code: "taprosca", mockKg: 280, factorArboles: null, factorEnergia: null, aguaFactor: null, costoDisp: 1200, isPaper: false },
  { id: 16, description: "BOLSA DE PLASTICO", code: "bolsa plastico", mockKg: 46, factorArboles: null, factorEnergia: null, aguaFactor: null, costoDisp: 1200, isPaper: false },
];

export interface MaterialKPIs {
  arboles: number;
  co2: number;
  energia: number;
  agua: number;
  costo: number;
  materiasPrimas: number;
}

export function calculateKPIs(material: Material, kg: number): MaterialKPIs {
  const arboles = material.isPaper
    ? kg * 0.017
    : material.factorArboles != null
      ? (kg / 1000) * material.factorArboles
      : 0;

  const co2 = material.factorEnergia != null ? (kg / 1000) * material.factorEnergia : 0;
  const energia = material.factorEnergia != null ? (kg / 1000) * material.factorEnergia : 0;
  const agua = material.aguaFactor != null ? (kg / 1000) * material.aguaFactor : 0;
  const costo = kg * (material.costoDisp / 1000);

  return { arboles, co2, energia, agua, costo, materiasPrimas: 0 };
}

export const KPI_TARGETS = {
  arboles: 800,
  co2: 29000,
  energia: 41000,
  agua: 230000,
  costo: 5608,
  materiasPrimas: 0,
};

export const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function generateMonthlyHistory(currentKgs: Record<string, number>) {
  const factors = [0.55, 0.58, 0.62, 0.65, 0.68, 0.72, 0.75, 0.78, 0.82, 0.88, 0.94, 1.0];
  return factors.map((f, i) => {
    let totalArboles = 0, totalCo2 = 0, totalEnergia = 0, totalAgua = 0, totalCosto = 0;
    MATERIALS.forEach(m => {
      const baseKg = currentKgs[m.code] ?? m.mockKg;
      const kg = baseKg * f * (0.92 + Math.random() * 0.16);
      const kpis = calculateKPIs(m, kg);
      totalArboles += kpis.arboles;
      totalCo2 += kpis.co2;
      totalEnergia += kpis.energia;
      totalAgua += kpis.agua;
      totalCosto += kpis.costo;
    });
    return {
      month: MONTHS[i],
      monthIndex: i,
      arboles: Math.round(totalArboles * 100) / 100,
      co2: Math.round(totalCo2 * 100) / 100,
      energia: Math.round(totalEnergia * 100) / 100,
      agua: Math.round(totalAgua * 100) / 100,
      costo: Math.round(totalCosto * 100) / 100,
    };
  });
}
