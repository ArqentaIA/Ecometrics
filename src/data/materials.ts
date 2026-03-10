export interface Material {
  id: number;
  description: string;
  code: string;
  mockKg: number;
  factorArboles: number | null;
  factorCo2: number | null;
  factorEnergia: number | null;
  aguaFactor: number | null;
  costoDisp: number;
  isPaper: boolean;
}

// EPA WARM v16 (Dec 2023) — lifecycle avoided emissions
// CO₂e: MTCO2E/short ton ÷ 0.907185 = kg CO₂e/kg
// Energía: MMBTU/short ton × 293.07 kWh/MMBTU / 907.185
// Agua: literatura especializada (L/kg)
// Árboles: solo fibra vegetal (papel/cartón)
export const MATERIALS: Material[] = [
  { id: 1,  description: "CARTON",                    code: "CARTON",         mockKg: 4821,  factorArboles: 0.005, factorCo2: 0.82,  factorEnergia: 3.2,  aguaFactor: 10,    costoDisp: 900,  isPaper: true },
  { id: 2,  description: "ENVASES DE PET",            code: "PET",            mockKg: 130,   factorArboles: null,  factorCo2: 1.00,  factorEnergia: 5.3,  aguaFactor: 17,    costoDisp: 1200, isPaper: false },
  { id: 3,  description: "ENVASES PET VERDE",         code: "PET VERDE",      mockKg: 6,     factorArboles: null,  factorCo2: 1.00,  factorEnergia: 5.3,  aguaFactor: 17,    costoDisp: 1200, isPaper: false },
  { id: 4,  description: "Polipropileno Alta Densidad",code: "HDPP",          mockKg: 331,   factorArboles: null,  factorCo2: 1.08,  factorEnergia: 6.1,  aguaFactor: 22,    costoDisp: 300,  isPaper: false },
  { id: 5,  description: "ENVASE CARTON LECHE",       code: "LECHERO",        mockKg: 540,   factorArboles: 0.004, factorCo2: 0.55,  factorEnergia: 2.1,  aguaFactor: 12,    costoDisp: 1200, isPaper: true },
  { id: 6,  description: "PAPEL DE ARCHIVO",          code: "ARCHIVO BCO",    mockKg: 2274,  factorArboles: 0.006, factorCo2: 1.10,  factorEnergia: 3.8,  aguaFactor: 28,    costoDisp: 900,  isPaper: true },
  { id: 7,  description: "PAPEL ARCHIVO COLOR",       code: "COLOR",          mockKg: 39,    factorArboles: 0.006, factorCo2: 1.10,  factorEnergia: 3.8,  aguaFactor: 28,    costoDisp: 900,  isPaper: true },
  { id: 8,  description: "CARTON DELGADO",            code: "CAPLE",          mockKg: 390,   factorArboles: 0.005, factorCo2: 0.82,  factorEnergia: 3.2,  aguaFactor: 10,    costoDisp: 900,  isPaper: true },
  { id: 9,  description: "ARCHIVO MUERTO",            code: "A. MUERTO",      mockKg: 960,   factorArboles: 0.005, factorCo2: 0.96,  factorEnergia: 3.5,  aguaFactor: 10,    costoDisp: 900,  isPaper: true },
  { id: 10, description: "FIERRO VIEJO",              code: "FIERRO",         mockKg: 166.5, factorArboles: null,  factorCo2: 1.46,  factorEnergia: 4.3,  aguaFactor: 40,    costoDisp: 1000, isPaper: false },
  { id: 11, description: "ALUMINIO BOTE",             code: "ALUM BOTE",      mockKg: 21.2,  factorArboles: null,  factorCo2: 9.13,  factorEnergia: 47.0, aguaFactor: 35,    costoDisp: 1000, isPaper: false },
  { id: 12, description: "ALUMINIO MACIZO",           code: "ALUM MACIZO",    mockKg: 55,    factorArboles: null,  factorCo2: 9.13,  factorEnergia: 47.0, aguaFactor: 35,    costoDisp: 1000, isPaper: false },
  { id: 13, description: "VIDRIO",                    code: "VIDRIO",         mockKg: 136,   factorArboles: null,  factorCo2: 0.30,  factorEnergia: 0.6,  aguaFactor: 2,     costoDisp: 800,  isPaper: false },
  { id: 14, description: "SUERO",                     code: "SUERO",          mockKg: 180,   factorArboles: null,  factorCo2: 0.19,  factorEnergia: null,  aguaFactor: 5,     costoDisp: 1200, isPaper: false },
  { id: 15, description: "TAPAROSCA",                 code: "taprosca",       mockKg: 280,   factorArboles: null,  factorCo2: 1.08,  factorEnergia: 6.1,  aguaFactor: 22,    costoDisp: 1200, isPaper: false },
  { id: 16, description: "BOLSA DE PLASTICO",         code: "bolsa plastico", mockKg: 46,    factorArboles: null,  factorCo2: 0.92,  factorEnergia: 5.1,  aguaFactor: 17,    costoDisp: 1200, isPaper: false },
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
  const arboles = material.factorArboles != null ? kg * material.factorArboles : 0;
  const co2 = material.factorCo2 != null ? kg * material.factorCo2 : 0;
  const energia = material.factorEnergia != null ? kg * material.factorEnergia : 0;
  const agua = material.aguaFactor != null ? kg * material.aguaFactor : 0;
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
