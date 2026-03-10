export interface ImpactFormula {
  icono: string;
  label: string;
  expr: string;
  factor: number;
  unidad: string;
}

export const IMPACT_FORMULAS: Record<string, ImpactFormula[]> = {
  CARTON: [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.005", factor: 0.005, unidad: "árboles equiv." },
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.021", factor: 0.021, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 0.18", factor: 0.18, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 10", factor: 10, unidad: "litros" },
  ],
  PET: [
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.34", factor: 0.34, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 5.3", factor: 5.3, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 17", factor: 17, unidad: "litros" },
  ],
  "PET VERDE": [
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.34", factor: 0.34, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 5.3", factor: 5.3, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 17", factor: 17, unidad: "litros" },
  ],
  HDPP: [
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.45", factor: 0.45, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 6.1", factor: 6.1, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 22", factor: 22, unidad: "litros" },
  ],
  LECHERO: [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.004", factor: 0.004, unidad: "árboles equiv." },
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.038", factor: 0.038, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 0.9", factor: 0.9, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 12", factor: 12, unidad: "litros" },
  ],
  "ARCHIVO BCO": [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.006", factor: 0.006, unidad: "árboles equiv." },
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.019", factor: 0.019, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 0.17", factor: 0.17, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 28", factor: 28, unidad: "litros" },
  ],
  COLOR: [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.006", factor: 0.006, unidad: "árboles equiv." },
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.022", factor: 0.022, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 0.17", factor: 0.17, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 28", factor: 28, unidad: "litros" },
  ],
  CAPLE: [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.005", factor: 0.005, unidad: "árboles equiv." },
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.019", factor: 0.019, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 0.18", factor: 0.18, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 10", factor: 10, unidad: "litros" },
  ],
  "A. MUERTO": [
    { icono: "🌳", label: "Árboles Preservados", expr: "Peso × 0.005", factor: 0.005, unidad: "árboles equiv." },
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.021", factor: 0.021, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 0.18", factor: 0.18, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 10", factor: 10, unidad: "litros" },
  ],
  FIERRO: [
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.58", factor: 0.58, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 6.0", factor: 6.0, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 7", factor: 7, unidad: "litros" },
  ],
  "ALUM BOTE": [
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 9.0", factor: 9.0, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 14", factor: 14, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 9", factor: 9, unidad: "litros" },
  ],
  "ALUM MACIZO": [
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 9.0", factor: 9.0, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 14", factor: 14, unidad: "kWh" },
    { icono: "💧", label: "Agua Conservada", expr: "Peso × 9", factor: 9, unidad: "litros" },
  ],
  VIDRIO: [
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.18", factor: 0.18, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 0.15", factor: 0.15, unidad: "kWh" },
  ],
  SUERO: [
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.10", factor: 0.10, unidad: "kg CO₂e" },
  ],
  taprosca: [
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.45", factor: 0.45, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 6.1", factor: 6.1, unidad: "kWh" },
  ],
  "bolsa plastico": [
    { icono: "💨", label: "CO₂e Evitado", expr: "Peso × 0.45", factor: 0.45, unidad: "kg CO₂e" },
    { icono: "⚡", label: "Energía Ahorrada", expr: "Peso × 6.1", factor: 6.1, unidad: "kWh" },
  ],
};

export const IMPACT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "Árboles Preservados": { bg: "hsl(var(--kpi-trees) / 0.08)", border: "hsl(var(--kpi-trees) / 0.3)", text: "hsl(var(--kpi-trees))" },
  "CO₂e Evitado":        { bg: "hsl(var(--kpi-co2) / 0.08)",   border: "hsl(var(--kpi-co2) / 0.3)",   text: "hsl(var(--kpi-co2))" },
  "Energía Ahorrada":    { bg: "hsl(var(--kpi-energy) / 0.08)", border: "hsl(var(--kpi-energy) / 0.3)", text: "hsl(var(--kpi-energy))" },
  "Agua Conservada":     { bg: "hsl(var(--kpi-water) / 0.08)",  border: "hsl(var(--kpi-water) / 0.3)",  text: "hsl(var(--kpi-water))" },
};
