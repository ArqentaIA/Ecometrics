import { IMPACT_FORMULAS, IMPACT_COLORS } from "@/data/impactFormulas";

interface ImpactCardsProps {
  materialCode: string;
  kg: number;
  yieldPct: number; // 0-100
}

const formatByLabel = (label: string, value: number): string => {
  if (label.includes("Árboles")) return value.toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (label.includes("CO₂")) return value.toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  if (label.includes("Energía")) return value.toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (label.includes("Agua")) return value.toLocaleString("es-MX", { maximumFractionDigits: 0 });
  return value.toLocaleString("es-MX", { maximumFractionDigits: 2 });
};

const ImpactCards = ({ materialCode, kg, yieldPct }: ImpactCardsProps) => {
  const formulas = IMPACT_FORMULAS[materialCode];
  if (!formulas || formulas.length === 0) return null;

  const kgNetos = kg * (yieldPct / 100);

  return (
    <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))" }}>
      {formulas.map((f) => {
        const c = IMPACT_COLORS[f.label] ?? IMPACT_COLORS["CO₂e Evitado"];
        const res = formatByLabel(f.label, kgNetos * f.factor);

        return (
          <div
            key={f.label}
            className="rounded-lg border p-3 flex flex-col gap-1.5"
            style={{ background: c.bg, borderColor: c.border }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{f.icono}</span>
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: c.text }}>
                {f.label}
              </span>
            </div>
            <code
              className="text-[11px] rounded px-1.5 py-0.5 border bg-card"
              style={{ borderColor: c.border, color: c.text }}
            >
              {f.expr}
            </code>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-extrabold leading-none" style={{ color: c.text }}>
                {res}
              </span>
              <span className="text-[11px] font-medium" style={{ color: c.text }}>
                {f.unidad}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
              {f.fuente}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ImpactCards;
