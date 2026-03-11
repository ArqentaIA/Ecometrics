import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface MonthlyData {
  month: number;
  value: number;
}

interface EconomicImpactCardProps {
  total: number;
  monthlyData: MonthlyData[];
  periodLabel: string;
  color?: string;
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const EconomicImpactCard = ({ total, monthlyData, periodLabel, color = "#9333EA" }: EconomicImpactCardProps) => {
  const { displayValue, isPulsing } = useLoopAnimation({ targetValue: total });
  const activeMonths = monthlyData.filter(d => d.value > 0);
  const hasMultipleMonths = activeMonths.length > 1;

  // Variation: compare last active month vs previous
  const variation = (() => {
    if (activeMonths.length < 2) return null;
    const sorted = [...activeMonths].sort((a, b) => a.month - b.month);
    const last = sorted[sorted.length - 1].value;
    const prev = sorted[sorted.length - 2].value;
    if (prev === 0) return null;
    return ((last - prev) / prev) * 100;
  })();

  const maxVal = Math.max(...monthlyData.map(d => d.value), 1);
  const progressPct = total > 0 ? 100 : 0;

  return (
    <div className="win-card p-5 min-h-[320px] hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span className="text-xs font-heading font-bold">Impacto Económico en la Comunidad</span>
        </div>
        {variation !== null ? (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: `${color}15`, color }}
          >
            {variation >= 0 ? "▲" : "▼"} {Math.abs(variation).toFixed(1)}%
          </span>
        ) : (
          <span className="text-[9px] px-2 py-0.5 rounded-full text-muted-foreground bg-muted">
            Sin comparativo
          </span>
        )}
      </div>

      {/* Main Value */}
      <div className="font-heading text-[26px] font-bold tracking-tight" style={{ color }}>
        <span
          style={{
            transform: isPulsing ? "scale(1.03)" : "scale(1)",
            display: "inline-block",
            transition: "transform 0.2s",
          }}
        >
          ${displayValue.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
        </span>{" "}
        <span className="text-xs font-normal text-muted-foreground">MXN</span>
      </div>

      {/* Period Label */}
      <p className="text-[10px] text-muted-foreground mt-0.5 mb-4">{periodLabel}</p>

      {/* Visualization */}
      <div className="flex-1 flex flex-col justify-end">
        {hasMultipleMonths ? (
          /* Sparkline bars */
          <div className="flex items-end gap-1 h-[120px]">
            {monthlyData.map((d) => {
              const barH = d.value > 0 ? Math.max((d.value / maxVal) * 100, 4) : 2;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div
                      className="rounded-md px-2 py-1 text-[9px] whitespace-nowrap"
                      style={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        color: "hsl(var(--popover-foreground))",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      <span className="font-semibold">${d.value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                  <div
                    className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                    style={{
                      height: `${barH}%`,
                      background: d.value > 0
                        ? `linear-gradient(180deg, ${color}, ${color}99)`
                        : "hsl(var(--muted))",
                      minHeight: 2,
                    }}
                  />
                  <span className="text-[7px] text-muted-foreground leading-none">
                    {MONTH_LABELS[d.month - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single value: progress bar */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Valor recuperado</span>
              <span className="font-semibold text-foreground">
                ${total.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${color}99, ${color})`,
                }}
              />
            </div>
            {activeMonths.length === 1 && (
              <p className="text-[9px] text-muted-foreground text-center">
                {MONTH_LABELS[activeMonths[0].month - 1]} — valor único del periodo
              </p>
            )}
            {activeMonths.length === 0 && (
              <p className="text-[9px] text-muted-foreground text-center">
                Sin capturas confirmadas en el periodo
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EconomicImpactCard;
