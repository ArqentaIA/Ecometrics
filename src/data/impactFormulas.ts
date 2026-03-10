// ─────────────────────────────────────────────────────────────
// FACTORES EPA WARM v16 (Dic 2023) — convertidos a kg/kg
// Fuente: U.S. EPA Waste Reduction Model v16
// 1 short ton = 907.185 kg
// CO₂e:  MTCO2E/short ton × (1000 kg/MTCO2E) / 907.185
// Agua:  literatura especializada de reciclaje (L/kg)
// Energía: WARM energy factors (MMBTU/short ton) × 293.07 kWh/MMBTU / 907.185
// Árboles: estimación basada en consumo promedio de fibra virgen
// ─────────────────────────────────────────────────────────────

export interface ImpactFormula {
  icono: string;
  label: string;
  expr: string;
  factor: number;
  unidad: string;
  fuente: string;
}

export const IMPACT_FORMULAS: Record<string, ImpactFormula[]> = {
  CARTON: [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.005 árboles/kg", factor: 0.005, unidad: "árboles equiv.", fuente: "US Corrugated Packaging Alliance" },
    { icono: "💨", label: "CO₂e Evitado",        expr: "Peso × 0.82 kg CO₂e/kg",  factor: 0.82,  unidad: "kg CO₂e",       fuente: "EPA WARM v16 — Corrugated Containers" },
    { icono: "⚡", label: "Energía Ahorrada",    expr: "Peso × 3.2 kWh/kg",       factor: 3.2,   unidad: "kWh",           fuente: "EPA WARM v16 — Energy factor" },
    { icono: "💧", label: "Agua Conservada",     expr: "Peso × 10 L/kg",          factor: 10,    unidad: "litros",        fuente: "Literatura especializada reciclaje papel" },
  ],
  PET: [
    { icono: "💨", label: "CO₂e Evitado",     expr: "Peso × 1.00 kg CO₂e/kg", factor: 1.00, unidad: "kg CO₂e", fuente: "EPA WARM v16 — PET Plastic" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 5.3 kWh/kg",       factor: 5.3,  unidad: "kWh",     fuente: "EPA WARM v16 — Energy factor PET" },
    { icono: "💧", label: "Agua Conservada",  expr: "Peso × 17 L/kg",          factor: 17,   unidad: "litros",  fuente: "Literatura especializada reciclaje plástico" },
  ],
  "PET VERDE": [
    { icono: "💨", label: "CO₂e Evitado",     expr: "Peso × 1.00 kg CO₂e/kg", factor: 1.00, unidad: "kg CO₂e", fuente: "EPA WARM v16 — PET Plastic (proxy)" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 5.3 kWh/kg",       factor: 5.3,  unidad: "kWh",     fuente: "EPA WARM v16 — Energy factor PET" },
    { icono: "💧", label: "Agua Conservada",  expr: "Peso × 17 L/kg",          factor: 17,   unidad: "litros",  fuente: "Literatura especializada reciclaje plástico" },
  ],
  HDPP: [
    { icono: "💨", label: "CO₂e Evitado",     expr: "Peso × 1.08 kg CO₂e/kg", factor: 1.08, unidad: "kg CO₂e", fuente: "EPA WARM v16 — Polypropylene (PP)" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 6.1 kWh/kg",       factor: 6.1,  unidad: "kWh",     fuente: "EPA WARM v16 — Energy factor PP" },
    { icono: "💧", label: "Agua Conservada",  expr: "Peso × 22 L/kg",          factor: 22,   unidad: "litros",  fuente: "Literatura especializada reciclaje plástico" },
  ],
  LECHERO: [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.004 árboles/kg", factor: 0.004, unidad: "árboles equiv.", fuente: "Tetra Pak Sustainability Report 2023" },
    { icono: "💨", label: "CO₂e Evitado",        expr: "Peso × 0.55 kg CO₂e/kg",  factor: 0.55,  unidad: "kg CO₂e",       fuente: "EPA WARM v16 — proxy papel+plástico (Tetrapack)" },
    { icono: "⚡", label: "Energía Ahorrada",    expr: "Peso × 2.1 kWh/kg",       factor: 2.1,   unidad: "kWh",           fuente: "EPA WARM v16 — proxy compuesto" },
    { icono: "💧", label: "Agua Conservada",     expr: "Peso × 12 L/kg",          factor: 12,    unidad: "litros",        fuente: "Literatura especializada reciclaje compuesto" },
  ],
  "ARCHIVO BCO": [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.006 árboles/kg", factor: 0.006, unidad: "árboles equiv.", fuente: "American Forest & Paper Association" },
    { icono: "💨", label: "CO₂e Evitado",        expr: "Peso × 1.10 kg CO₂e/kg",  factor: 1.10,  unidad: "kg CO₂e",       fuente: "EPA WARM v16 — Office Paper" },
    { icono: "⚡", label: "Energía Ahorrada",    expr: "Peso × 3.8 kWh/kg",       factor: 3.8,   unidad: "kWh",           fuente: "EPA WARM v16 — Energy factor Office Paper" },
    { icono: "💧", label: "Agua Conservada",     expr: "Peso × 28 L/kg",          factor: 28,    unidad: "litros",        fuente: "Literatura especializada reciclaje papel blanco" },
  ],
  COLOR: [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.006 árboles/kg", factor: 0.006, unidad: "árboles equiv.", fuente: "American Forest & Paper Association" },
    { icono: "💨", label: "CO₂e Evitado",        expr: "Peso × 1.10 kg CO₂e/kg",  factor: 1.10,  unidad: "kg CO₂e",       fuente: "EPA WARM v16 — Office Paper (proxy color)" },
    { icono: "⚡", label: "Energía Ahorrada",    expr: "Peso × 3.8 kWh/kg",       factor: 3.8,   unidad: "kWh",           fuente: "EPA WARM v16 — Energy factor Office Paper" },
    { icono: "💧", label: "Agua Conservada",     expr: "Peso × 28 L/kg",          factor: 28,    unidad: "litros",        fuente: "Literatura especializada reciclaje papel" },
  ],
  CAPLE: [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.005 árboles/kg", factor: 0.005, unidad: "árboles equiv.", fuente: "US Corrugated Packaging Alliance" },
    { icono: "💨", label: "CO₂e Evitado",        expr: "Peso × 0.82 kg CO₂e/kg",  factor: 0.82,  unidad: "kg CO₂e",       fuente: "EPA WARM v16 — Corrugated Containers (proxy)" },
    { icono: "⚡", label: "Energía Ahorrada",    expr: "Peso × 3.2 kWh/kg",       factor: 3.2,   unidad: "kWh",           fuente: "EPA WARM v16 — Energy factor cartón" },
    { icono: "💧", label: "Agua Conservada",     expr: "Peso × 10 L/kg",          factor: 10,    unidad: "litros",        fuente: "Literatura especializada reciclaje cartón" },
  ],
  "A. MUERTO": [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.005 árboles/kg", factor: 0.005, unidad: "árboles equiv.", fuente: "American Forest & Paper Association" },
    { icono: "💨", label: "CO₂e Evitado",        expr: "Peso × 0.96 kg CO₂e/kg",  factor: 0.96,  unidad: "kg CO₂e",       fuente: "EPA WARM v16 — Mixed Paper" },
    { icono: "⚡", label: "Energía Ahorrada",    expr: "Peso × 3.5 kWh/kg",       factor: 3.5,   unidad: "kWh",           fuente: "EPA WARM v16 — Energy factor Mixed Paper" },
    { icono: "💧", label: "Agua Conservada",     expr: "Peso × 10 L/kg",          factor: 10,    unidad: "litros",        fuente: "Literatura especializada reciclaje papel" },
  ],
  FIERRO: [
    { icono: "💨", label: "CO₂e Evitado",     expr: "Peso × 1.46 kg CO₂e/kg", factor: 1.46, unidad: "kg CO₂e", fuente: "EPA WARM v16 — Steel Cans" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 4.3 kWh/kg",       factor: 4.3,  unidad: "kWh",     fuente: "EPA WARM v16 — Energy factor Steel" },
    { icono: "💧", label: "Agua Conservada",  expr: "Peso × 40 L/kg",          factor: 40,   unidad: "litros",  fuente: "World Steel Association" },
  ],
  "ALUM BOTE": [
    { icono: "💨", label: "CO₂e Evitado",     expr: "Peso × 9.13 kg CO₂e/kg", factor: 9.13, unidad: "kg CO₂e", fuente: "EPA WARM v16 — Aluminum Cans" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 47 kWh/kg",        factor: 47,   unidad: "kWh",     fuente: "EPA WARM v16 — Energy factor Aluminum" },
    { icono: "💧", label: "Agua Conservada",  expr: "Peso × 35 L/kg",          factor: 35,   unidad: "litros",  fuente: "The Aluminum Association" },
  ],
  "ALUM MACIZO": [
    { icono: "💨", label: "CO₂e Evitado",     expr: "Peso × 9.13 kg CO₂e/kg", factor: 9.13, unidad: "kg CO₂e", fuente: "EPA WARM v16 — Aluminum Ingot (proxy)" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 47 kWh/kg",        factor: 47,   unidad: "kWh",     fuente: "EPA WARM v16 — Energy factor Aluminum" },
    { icono: "💧", label: "Agua Conservada",  expr: "Peso × 35 L/kg",          factor: 35,   unidad: "litros",  fuente: "The Aluminum Association" },
  ],
  VIDRIO: [
    { icono: "💨", label: "CO₂e Evitado",     expr: "Peso × 0.30 kg CO₂e/kg", factor: 0.30, unidad: "kg CO₂e", fuente: "EPA WARM v16 — Glass" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 0.6 kWh/kg",       factor: 0.6,  unidad: "kWh",     fuente: "EPA WARM v16 — Energy factor Glass" },
    { icono: "💧", label: "Agua Conservada",  expr: "Peso × 2 L/kg",           factor: 2,    unidad: "litros",  fuente: "Glass Packaging Institute" },
  ],
  SUERO: [
    { icono: "💨", label: "CO₂e Evitado",     expr: "Peso × 0.19 kg CO₂e/kg", factor: 0.19, unidad: "kg CO₂e", fuente: "EPA WARM v16 — Food Waste (proxy lácteo)" },
    { icono: "💧", label: "Agua Conservada",  expr: "Peso × 5 L/kg",           factor: 5,    unidad: "litros",  fuente: "Literatura especializada residuos orgánicos" },
  ],
  taprosca: [
    { icono: "💨", label: "CO₂e Evitado",     expr: "Peso × 1.08 kg CO₂e/kg", factor: 1.08, unidad: "kg CO₂e", fuente: "EPA WARM v16 — PP (proxy tapas polipropileno)" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 6.1 kWh/kg",       factor: 6.1,  unidad: "kWh",     fuente: "EPA WARM v16 — Energy factor PP" },
    { icono: "💧", label: "Agua Conservada",  expr: "Peso × 22 L/kg",          factor: 22,   unidad: "litros",  fuente: "Literatura especializada reciclaje plástico" },
  ],
  "bolsa plastico": [
    { icono: "💨", label: "CO₂e Evitado",     expr: "Peso × 0.92 kg CO₂e/kg", factor: 0.92, unidad: "kg CO₂e", fuente: "EPA WARM v16 — HDPE (proxy bolsa plástico)" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 5.1 kWh/kg",       factor: 5.1,  unidad: "kWh",     fuente: "EPA WARM v16 — Energy factor HDPE" },
    { icono: "💧", label: "Agua Conservada",  expr: "Peso × 17 L/kg",          factor: 17,   unidad: "litros",  fuente: "Literatura especializada reciclaje plástico" },
  ],
};

export const IMPACT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "Árboles Preservados": { bg: "hsl(var(--kpi-trees) / 0.08)", border: "hsl(var(--kpi-trees) / 0.3)", text: "hsl(var(--kpi-trees))" },
  "CO₂e Evitado":        { bg: "hsl(var(--kpi-co2) / 0.08)",   border: "hsl(var(--kpi-co2) / 0.3)",   text: "hsl(var(--kpi-co2))" },
  "Energía Ahorrada":    { bg: "hsl(var(--kpi-energy) / 0.08)", border: "hsl(var(--kpi-energy) / 0.3)", text: "hsl(var(--kpi-energy))" },
  "Agua Conservada":     { bg: "hsl(var(--kpi-water) / 0.08)",  border: "hsl(var(--kpi-water) / 0.3)",  text: "hsl(var(--kpi-water))" },
};
