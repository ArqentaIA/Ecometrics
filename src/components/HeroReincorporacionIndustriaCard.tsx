import { useMemo, useState } from "react";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface MonthlyData {
  month: number;
  value: number;
}

interface MaterialEntry {
  material: { name: string; code: string; default_yield: number };
  kg: number;
  kpis: { kg_netos: number };
  isConfirmed: boolean;
}

interface Props {
  totalKgBrutos: number;
  totalKgNetos: number;
  confirmedEntries: MaterialEntry[];
  monthlyKgNetos: MonthlyData[];
  allMonthsKgNetos: MonthlyData[];
  lastUpdated: Date;
  periodLabel: string;
  dashYear: number;
}

const HeroReincorporacionIndustriaCard = ({
  totalKgBrutos,
  totalKgNetos,
  confirmedEntries,
  monthlyKgNetos,
  allMonthsKgNetos,
  lastUpdated,
  periodLabel,
  dashYear,
}: Props) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalReincorporado = totalKgNetos;
  const kgPerdida = totalKgBrutos - totalReincorporado;
  const eficiencia = totalKgBrutos > 0 ? (totalReincorporado / totalKgBrutos) * 100 : 0;

  // Monthly breakdown for chart (brutos by month needed for per-month efficiency)
  const monthlyBrutosByMonth = useMemo(() => {
    // We don't have monthly brutos directly, but we can approximate from allMonthsKgNetos ratio
    return null;
  }, []);

  // Build cumulative series from monthlyKgNetos
  const cumulativeSeries = useMemo(() => {
    let acc = 0;
    return monthlyKgNetos.map(d => {
      acc += d.value;
      return { month: d.month, value: d.value, cumulative: acc };
    });
  }, [monthlyKgNetos]);

  // Shadow cumulative (full year)
  const shadowCumulative = useMemo(() => {
    let acc = 0;
    return allMonthsKgNetos.map(d => {
      acc += d.value;
      return { month: d.month, cumulative: acc };
    });
  }, [allMonthsKgNetos]);

  // Material líder
  const materialLider = useMemo(() => {
    if (confirmedEntries.length === 0) return null;
    const sorted = [...confirmedEntries].sort((a, b) => b.kpis.kg_netos - a.kpis.kg_netos);
    const top = sorted[0];
    const pct = totalReincorporado > 0 ? (top.kpis.kg_netos / totalReincorporado) * 100 : 0;
    return { name: top.material.name, kg: top.kpis.kg_netos, pct };
  }, [confirmedEntries, totalReincorporado]);

  // Efficiency color
  const getEfColor = (v: number) => {
    if (v >= 95) return "#16A34A";
    if (v >= 85) return "#22C55E";
    if (v >= 70) return "#F59E0B";
    return "#EF4444";
  };
  const efColor = getEfColor(eficiencia);

  // SVG mountain chart
  const chartW = 480;
  const chartH = 140;
  const padL = 0;
  const padR = 0;
  const padT = 10;
  const padB = 20;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxCum = Math.max(...shadowCumulative.map(d => d.cumulative), ...cumulativeSeries.map(d => d.cumulative), 1);

  const xScale = (i: number, total: number) => padL + (total > 1 ? (i / (total - 1)) * plotW : plotW / 2);
  const yScale = (v: number) => padT + plotH - (v / maxCum) * plotH;

  // Build paths
  const buildPath = (data: { cumulative: number }[]) => {
    if (data.length === 0) return "";
    if (data.length === 1) return `M${xScale(0, 1)},${yScale(data[0].cumulative)}`;
    // Smooth curve using cubic bezier
    const points = data.map((d, i) => ({ x: xScale(i, data.length), y: yScale(d.cumulative) }));
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }
    return path;
  };

  const shadowPath = buildPath(shadowCumulative);
  const mainPath = buildPath(cumulativeSeries);

  const areaPath = mainPath
    ? `${mainPath} L${xScale(cumulativeSeries.length - 1, cumulativeSeries.length)},${padT + plotH} L${xScale(0, cumulativeSeries.length)},${padT + plotH} Z`
    : "";

  const shadowAreaPath = shadowPath
    ? `${shadowPath} L${xScale(shadowCumulative.length - 1, shadowCumulative.length)},${padT + plotH} L${xScale(0, shadowCumulative.length)},${padT + plotH} Z`
    : "";

  // Tooltip data
  const tooltipData = hoveredIdx !== null && cumulativeSeries[hoveredIdx]
    ? cumulativeSeries[hoveredIdx]
    : null;

  const formatTs = (d: Date) => {
    const day = d.getDate().toString().padStart(2, "0");
    const mon = d.toLocaleDateString("es-MX", { month: "short" });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    return `${day} ${mon} ${year} • ${time}`;
  };

  const noData = totalKgBrutos === 0;

  return (
    <div
      className="win-card rounded-xl bg-card"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}
    >
      {/* Main hero row */}
      <div className="flex flex-col lg:flex-row items-stretch">
        {/* LEFT ZONE — Title & value */}
        <div className="flex flex-col justify-center p-6 lg:p-8 lg:w-[280px] shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🏭</span>
            <h3 className="font-heading font-bold text-[15px] tracking-tight text-foreground uppercase leading-tight">
              Total de materias primas reincorporadas a la industria
            </h3>
          </div>
          <p className="text-[10px] text-muted-foreground mb-5 leading-relaxed">
            Kg netos estimados con yield por material sobre capturas confirmadas
          </p>

          <div className="mb-1">
            <span
              className="font-heading font-bold text-[42px] leading-none tracking-tight tabular-nums text-foreground"
            >
              {noData ? "0" : totalReincorporado.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-sm font-semibold text-muted-foreground ml-2">kg</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {periodLabel}
          </p>
        </div>

        {/* CENTER ZONE — Mountain chart */}
        <div className="flex-1 min-w-0 px-4 py-4 lg:py-6 relative">
          {noData ? (
            <div className="flex items-center justify-center h-full min-h-[160px]">
              <p className="text-sm text-muted-foreground italic">Sin datos en el periodo seleccionado</p>
            </div>
          ) : (
            <div className="relative">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-auto"
                style={{ maxHeight: 180 }}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <defs>
                  <linearGradient id="hero-mountain-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B3D91" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0B3D91" stopOpacity="0.03" />
                  </linearGradient>
                  <linearGradient id="hero-shadow-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map(f => (
                  <line
                    key={f}
                    x1={padL} y1={yScale(maxCum * f)}
                    x2={padL + plotW} y2={yScale(maxCum * f)}
                    stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4,4" opacity={0.5}
                  />
                ))}

                {/* Shadow area (full year) */}
                {shadowAreaPath && (
                  <path d={shadowAreaPath} fill="url(#hero-shadow-grad)" />
                )}
                {shadowPath && (
                  <path d={shadowPath} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity={0.2} />
                )}

                {/* Main area */}
                {areaPath && <path d={areaPath} fill="url(#hero-mountain-grad)" />}
                {mainPath && (
                  <path d={mainPath} fill="none" stroke="#0B3D91" strokeWidth="2.5" strokeLinecap="round" />
                )}

                {/* Data points */}
                {cumulativeSeries.map((d, i) => (
                  <circle
                    key={i}
                    cx={xScale(i, cumulativeSeries.length)}
                    cy={yScale(d.cumulative)}
                    r={hoveredIdx === i ? 5 : 3}
                    fill={hoveredIdx === i ? "#0B3D91" : "hsl(var(--card))"}
                    stroke="#0B3D91"
                    strokeWidth="2"
                    style={{ cursor: "pointer", transition: "r 0.15s" }}
                  />
                ))}

                {/* Hover zones */}
                {cumulativeSeries.map((_, i) => {
                  const w = plotW / Math.max(cumulativeSeries.length, 1);
                  return (
                    <rect
                      key={`hover-${i}`}
                      x={xScale(i, cumulativeSeries.length) - w / 2}
                      y={padT}
                      width={w}
                      height={plotH}
                      fill="transparent"
                      onMouseEnter={() => setHoveredIdx(i)}
                    />
                  );
                })}

                {/* Month labels */}
                {cumulativeSeries.map((d, i) => (
                  <text
                    key={`label-${i}`}
                    x={xScale(i, cumulativeSeries.length)}
                    y={chartH - 2}
                    textAnchor="middle"
                    className="text-[9px] fill-muted-foreground"
                  >
                    {MONTH_LABELS[d.month - 1]}
                  </text>
                ))}
              </svg>

              {/* Tooltip */}
              {tooltipData && hoveredIdx !== null && (
                <div
                  className="absolute z-20 bg-card border border-border rounded-lg shadow-lg px-3 py-2 pointer-events-none"
                  style={{
                    left: `${(xScale(hoveredIdx, cumulativeSeries.length) / chartW) * 100}%`,
                    top: 0,
                    transform: "translateX(-50%)",
                    minWidth: 180,
                  }}
                >
                  <p className="text-[11px] font-semibold text-foreground mb-1">
                    {MONTH_LABELS[tooltipData.month - 1]} {dashYear}
                  </p>
                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Kg reincorporados</span>
                      <span className="font-bold text-foreground">{tooltipData.value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Acumulado</span>
                      <span className="font-bold text-foreground">{tooltipData.cumulative.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT ZONE — Efficiency gauge */}
        <div className="flex flex-col items-center justify-center p-6 lg:p-8 lg:w-[200px] shrink-0 border-t lg:border-t-0 lg:border-l border-border/50">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Eficiencia del Sistema
          </p>

          {/* Circular gauge */}
          <div className="relative" style={{ width: 120, height: 120 }}>
            <svg width={120} height={120} className="transform -rotate-90">
              <circle cx={60} cy={60} r={50} fill="none" stroke="hsl(var(--muted))" strokeWidth={10} opacity={0.2} />
              <circle
                cx={60} cy={60} r={50}
                fill="none" stroke={efColor} strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - Math.min(eficiencia, 100) / 100)}
                style={{ filter: `drop-shadow(0 0 6px ${efColor}40)`, transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading font-bold text-[28px] tabular-nums leading-none" style={{ color: efColor }}>
                {eficiencia.toFixed(1)}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">%</span>
            </div>
          </div>

          <p className="text-[9px] text-muted-foreground text-center mt-2 leading-tight">
            kg reincorporados / kg capturados
          </p>
        </div>
      </div>

      {/* BOTTOM ROW — Micro indicators */}
      <div className="border-t border-border/50 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              icon: "📦",
              label: "Kg brutos capturados",
              value: totalKgBrutos.toLocaleString("es-MX", { maximumFractionDigits: 0 }) + " kg",
            },
            {
              icon: "🏭",
              label: "Materia prima reincorporada",
              value: totalReincorporado.toLocaleString("es-MX", { maximumFractionDigits: 0 }) + " kg",
            },
            {
              icon: "⚠️",
              label: "Pérdida estimada",
              value: kgPerdida.toLocaleString("es-MX", { maximumFractionDigits: 0 }) + " kg",
            },
            {
              icon: "⚡",
              label: "Eficiencia del sistema",
              value: eficiencia.toFixed(1) + " %",
              highlight: efColor,
            },
            {
              icon: "🏆",
              label: "Material líder",
              value: materialLider ? materialLider.name : "—",
              sub: materialLider ? `${materialLider.pct.toFixed(1)}% del total` : undefined,
            },
            {
              icon: "🕐",
              label: "Última actualización",
              value: formatTs(lastUpdated),
            },
          ].map(chip => (
            <div key={chip.label} className="flex flex-col rounded-lg bg-accent/40 px-3 py-2.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                <span>{chip.icon}</span> {chip.label}
              </span>
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ color: (chip as any).highlight ?? "hsl(var(--foreground))" }}
              >
                {chip.value}
              </span>
              {(chip as any).sub && (
                <span className="text-[9px] text-muted-foreground">{(chip as any).sub}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroReincorporacionIndustriaCard;
