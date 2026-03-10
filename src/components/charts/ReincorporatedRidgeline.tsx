import { useLoopAnimation } from "@/hooks/useLoopAnimation";

const ReincorporatedRidgeline = () => {
  const totalRecuperado = 9776;
  const reincorporado = 8420;
  const enProceso = 2800;
  const pendiente = 1356;
  const pct = (reincorporado / totalRecuperado) * 100;

  const { displayValue, progress, isPulsing } = useLoopAnimation({ targetValue: reincorporado });

  const W = 340;
  const H = 200;
  const padT = 20;
  const padL = 0;
  const padB = 24;
  const chartH = H - padB - padT;

  // Normalize heights relative to max value
  const maxVal = reincorporado;
  const hReincorporado = (reincorporado / maxVal) * (chartH - 10);
  const hProceso = (enProceso / maxVal) * (chartH - 10);
  const hPendiente = (pendiente / maxVal) * (chartH - 10);

  // Mountain peak generator — smooth bell curve
  const mountainPath = (cx: number, baseW: number, peakH: number, baseY: number) => {
    const hw = baseW / 2;
    const x0 = cx - hw;
    const x1 = cx + hw;
    const cp1x = cx - hw * 0.4;
    const cp2x = cx + hw * 0.4;
    return `M ${x0} ${baseY} C ${cp1x} ${baseY}, ${cx - hw * 0.15} ${baseY - peakH}, ${cx} ${baseY - peakH} C ${cx + hw * 0.15} ${baseY - peakH}, ${cp2x} ${baseY}, ${x1} ${baseY} Z`;
  };

  const baseY = padT + chartH;
  const mw = W / 3.2;

  // Positions — slightly overlapping
  const cx1 = padL + mw * 0.55;
  const cx2 = padL + mw * 1.35;
  const cx3 = padL + mw * 2.15;

  const p = progress;

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75, 1].map(f => chartH - f * (chartH - 10));

  const categories = [
    { label: "Pendiente", value: pendiente, color: "hsl(var(--muted-foreground) / 0.25)", dotClass: "bg-muted-foreground/25" },
    { label: "En proceso", value: enProceso, color: "hsl(var(--muted-foreground) / 0.5)", dotClass: "bg-muted-foreground/50" },
    { label: "Reincorporado", value: reincorporado, color: "hsl(var(--kpi-trees))", dotClass: "" },
  ];

  return (
    <div className="win-card p-5 min-h-[320px] hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🏭</span>
        <span className="text-xs font-heading font-bold">Materiales Recuperados Reincorporados a la Industria</span>
      </div>

      {/* Main KPI */}
      <div className="flex items-baseline gap-2 mb-3 ml-7">
        <span
          className="font-heading text-[22px] font-bold tracking-tight leading-none"
          style={{ color: "hsl(var(--kpi-trees))", transform: isPulsing ? "scale(1.03)" : "scale(1)", transition: "transform 0.2s", display: "inline-block" }}
        >
          {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 0 })} kg
        </span>
        <span className="text-[11px] text-muted-foreground">reincorporados</span>
        <span className="ml-auto text-[12px] font-semibold" style={{ color: "hsl(var(--kpi-trees))" }}>
          {(pct * p).toFixed(0)}%
        </span>
      </div>

      {/* Ridgeline Chart */}
      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="grad-reincorporado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="grad-proceso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="grad-pendiente" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Subtle grid */}
          {gridLines.map((y, i) => (
            <line key={i} x1={0} x2={W} y1={y} y2={y} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.08} strokeWidth={0.5} />
          ))}
          <line x1={0} x2={W} y1={baseY} y2={baseY} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} strokeWidth={0.5} />

          {/* Mountains — back to front */}
          <path
            d={mountainPath(cx1, mw * 1.1, hPendiente * p, baseY)}
            fill="url(#grad-pendiente)"
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.15}
            strokeWidth={0.5}
            style={{ transition: "d 0.4s ease" }}
          />
          <path
            d={mountainPath(cx2, mw * 1.2, hProceso * p, baseY)}
            fill="url(#grad-proceso)"
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.2}
            strokeWidth={0.5}
            style={{ transition: "d 0.4s ease" }}
          />
          <path
            d={mountainPath(cx3, mw * 1.3, hReincorporado * p, baseY)}
            fill="url(#grad-reincorporado)"
            stroke="hsl(142 71% 45%)"
            strokeOpacity={0.4}
            strokeWidth={0.8}
            style={{ transition: "d 0.4s ease" }}
          />

          {/* Value labels on peaks */}
          {p > 0.5 && (
            <>
              <text x={cx1} y={baseY - hPendiente * p - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="9" fontWeight="600" opacity={p}>
                {pendiente.toLocaleString("es-MX")}
              </text>
              <text x={cx2} y={baseY - hProceso * p - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="9" fontWeight="600" opacity={p}>
                {enProceso.toLocaleString("es-MX")}
              </text>
              <text x={cx3} y={baseY - hReincorporado * p - 6} textAnchor="middle" fill="hsl(142 71% 45%)" fontSize="10" fontWeight="700" opacity={p}>
                {reincorporado.toLocaleString("es-MX")}
              </text>
            </>
          )}

          {/* Category labels */}
          <text x={cx1} y={H - 4} textAnchor="middle" className="fill-muted-foreground" fontSize="8">Pendiente</text>
          <text x={cx2} y={H - 4} textAnchor="middle" className="fill-muted-foreground" fontSize="8">En proceso</text>
          <text x={cx3} y={H - 4} textAnchor="middle" fill="hsl(142 71% 45%)" fontSize="8" fontWeight="600">Reincorporado</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        {categories.map(c => (
          <div key={c.label} className="flex items-center gap-1.5 text-[10px]">
            <div
              className={`w-2 h-2 rounded-sm flex-shrink-0 ${c.dotClass}`}
              style={c.label === "Reincorporado" ? { background: "hsl(var(--kpi-trees))" } : undefined}
            />
            <span className="text-muted-foreground">{c.label}</span>
            <span className="font-medium text-foreground">{c.value.toLocaleString("es-MX")} kg</span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground/60 text-center leading-relaxed">
        Indicador que refleja la proporción de materiales recuperados que han sido reintegrados a procesos productivos industriales.
      </p>
    </div>
  );
};

export default ReincorporatedRidgeline;
