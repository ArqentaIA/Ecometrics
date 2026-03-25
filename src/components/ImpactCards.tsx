import { type CalculatedKPIs, formatKPI } from "@/lib/calculationEngine";

interface ImpactCardsProps {
  kpis: CalculatedKPIs;
  kgNetos: number;
}

const CARD_CONFIG = [
  { key: "arboles" as const, usesKey: "uses_arboles" as const, factorKey: "factor_arboles" as const, label: "Árboles Preservados", icon: "🌳", unit: "árboles equiv.", fmtKey: "arboles" as const, cssVar: "--kpi-trees" },
  { key: "co2" as const, usesKey: "uses_co2" as const, factorKey: "factor_co2" as const, label: "CO₂e Evitado", icon: "💨", unit: "kg CO₂e", fmtKey: "co2" as const, cssVar: "--kpi-co2" },
  { key: "energia" as const, usesKey: "uses_energia" as const, factorKey: "factor_energia" as const, label: "Energía Ahorrada", icon: "⚡", unit: "kWh", fmtKey: "energia" as const, cssVar: "--kpi-energy" },
  { key: "agua" as const, usesKey: "uses_agua" as const, factorKey: "factor_agua" as const, label: "Agua Conservada", icon: "💧", unit: "litros", fmtKey: "agua" as const, cssVar: "--kpi-water" },
] as const;

const ImpactCards = ({ kpis, kgNetos }: ImpactCardsProps) => {
  // Rule 14: If impacto_valido is false, show warning instead of KPI cards
  if (!kpis.impacto_valido) {
    return (
      <div className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-accent/50">
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
          ⚠️ Impacto ambiental no disponible por validación metodológica pendiente.
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Este material participa en volumen e impacto económico, pero no cuenta con factores ambientales validados.
        </p>
      </div>
    );
  }

  // Rule 15/25: Only show cards where the KPI is enabled AND has a valid factor
  const visibleCards = CARD_CONFIG.filter(c => 
    kpis[c.usesKey] && kpis[c.factorKey] != null
  );

  if (visibleCards.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))" }}>
        {visibleCards.map(c => {
          const value = kpis[c.key];
          // Rule 15: Don't show zero values when kg is 0
          if (value === 0 && kgNetos === 0) return null;

          return (
            <div
              key={c.key}
              className="rounded-lg border p-3 flex flex-col gap-1.5"
              style={{
                background: `hsl(var(${c.cssVar}) / 0.08)`,
                borderColor: `hsl(var(${c.cssVar}) / 0.3)`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{c.icon}</span>
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: `hsl(var(${c.cssVar}))` }}>
                  {c.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-extrabold leading-none" style={{ color: `hsl(var(${c.cssVar}))` }}>
                  {formatKPI(c.fmtKey, value)}
                </span>
                <span className="text-[11px] font-medium" style={{ color: `hsl(var(${c.cssVar}))` }}>
                  {c.unit}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
                Base: kg netos estimados
                {kpis.factor_version ? ` · Factor v${kpis.factor_version}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImpactCards;
