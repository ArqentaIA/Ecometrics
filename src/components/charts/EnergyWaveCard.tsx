import { useState } from "react";
import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface MonthlyData {
  month: number;
  value: number;
}

interface TopEnergyMaterial {
  name: string;
  energia: number;
}

interface EnergyWaveCardProps {
  total: number;
  monthlyData: MonthlyData[];
  allMonthsData: MonthlyData[];
  periodLabel: string;
  dashYear: number;
  topMaterials?: TopEnergyMaterial[];
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLOR = "#EAB308";
const COLOR_DARK = "#CA8A04";

const EnergyWaveCard = ({
  total,
  monthlyData,
  allMonthsData,
  periodLabel,
  dashYear,
  topMaterials = [],
}: EnergyWaveCardProps) => {
  const { displayValue, isPulsing } = useLoopAnimation({ targetValue: total });
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const activeMonths = monthlyData.filter(d => d.value > 0);

  const variation = (() => {
    if (activeMonths.length < 2) return null;
    const sorted = [...activeMonths].sort((a, b) => a.month - b.month);
    const last = sorted[sorted.length - 1].value;
    const prev = sorted[sorted.length - 2].value;
    if (prev === 0) return null;
    return ((last - prev) / prev) * 100;
  })();

  const activeWithValueSet = new Set(activeMonths.map(d => d.month));

  // Cumulative data from all captures
  const cumulativeData = allMonthsData.reduce<{ month: number; cumulative: number }[]>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    acc.push({ month: d.month, cumulative: prev + d.value });
    return acc;
  }, []);
  const maxCumulative = Math.max(...cumulativeData.map(d => d.cumulative), 1);
  const annualTotal = allMonthsData.reduce((s, d) => s + d.value, 0);

  // Chart dims
  const chartW = 400;
  const chartH = 110;
  const px = 8;
  const py = 8;
  const plotW = chartW - px * 2;
  const plotH = chartH - py * 2;

  // Points for cumulative wave
  const points = cumulativeData.map((d, i) => ({
    x: px + (i / 11) * plotW,
    y: py + plotH - (d.cumulative / maxCumulative) * (plotH - 6),
    cumulative: d.cumulative,
    month: d.month,
    monthValue: allMonthsData[i].value,
  }));

  // Shadow line (all months, very subtle)
  const shadowPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  // Active wave: cumulative only up to months with data, using filtered values
  const filteredCumulative = allMonthsData.reduce<{ month: number; cumulative: number }[]>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    const filteredVal = monthlyData.find(m => m.month === d.month)?.value ?? 0;
    acc.push({ month: d.month, cumulative: prev + filteredVal });
    return acc;
  }, []);
  const maxFilteredCum = Math.max(...filteredCumulative.map(d => d.cumulative), maxCumulative);

  const wavePoints = filteredCumulative.map((d, i) => ({
    x: px + (i / 11) * plotW,
    y: py + plotH - (d.cumulative / maxFilteredCum) * (plotH - 6),
    cumulative: d.cumulative,
    month: d.month,
  }));

  // Smooth curve builder (Catmull-Rom)
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return "";
    let path = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const smoothShadow = buildSmoothPath(points);
  const smoothWave = buildSmoothPath(wavePoints);

  const waveAreaPath = smoothWave
    ? `${smoothWave} L${wavePoints[wavePoints.length - 1].x},${py + plotH} L${wavePoints[0].x},${py + plotH} Z`
    : "";

  // Equivalences
  const homesEquiv = Math.round(total / 2854); // avg Mexican home ~2854 kWh/month
  const evsEquiv = Math.round(total / 60); // avg EV charge ~60 kWh

  const topMat = topMaterials.length > 0 ? topMaterials[0] : null;

  const hoveredData = hoveredMonth !== null ? {
    month: hoveredMonth,
    value: allMonthsData.find(d => d.month === hoveredMonth)?.value ?? 0,
    cumulative: cumulativeData.find(d => d.month === hoveredMonth)?.cumulative ?? 0,
  } : null;

  return (
    <div className="win-card p-5 hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-xs font-heading font-bold">Energía Ahorrada</span>
        </div>
        {variation !== null ? (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${COLOR}15`, color: COLOR_DARK }}
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
      <div className="font-heading text-[26px] font-bold tracking-tight" style={{ color: COLOR_DARK }}>
        <span
          style={{
            transform: isPulsing ? "scale(1.03)" : "scale(1)",
            display: "inline-block",
            transition: "transform 0.2s",
          }}
        >
          {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
        </span>{" "}
        <span className="text-xs font-normal text-muted-foreground">kWh</span>
      </div>

      {/* Period */}
      <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">{periodLabel}</p>

      {/* Energy Wave Chart */}
      <div className="flex-1 flex flex-col justify-end relative">
        <svg
          width="100%"
          viewBox={`0 0 ${chartW} ${chartH + 18}`}
          className="overflow-visible"
          onMouseLeave={() => setHoveredMonth(null)}
        >
          <defs>
            <linearGradient id="energyWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLOR} stopOpacity={0.03} />
            </linearGradient>
          </defs>

          {/* Layer 1: Shadow line (historical reference) */}
          <path
            d={smoothShadow}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1"
            opacity={0.15}
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle
              key={`shadow-dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={1.5}
              fill="hsl(var(--muted-foreground))"
              opacity={allMonthsData[i].value > 0 ? 0.2 : 0.08}
            />
          ))}

          {/* Layer 2: Energy wave area */}
          <path d={waveAreaPath} fill="url(#energyWaveGrad)" />

          {/* Layer 2: Energy wave line */}
          <path
            d={smoothWave}
            fill="none"
            stroke={COLOR}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.85}
          />

          {/* Nodes on active months */}
          {wavePoints.map((p, i) => {
            const isActive = activeWithValueSet.has(p.month);
            const isHovered = hoveredMonth === p.month;
            if (!isActive && !isHovered) {
              return (
                <circle
                  key={`wave-dot-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={1.5}
                  fill={COLOR}
                  opacity={0.3}
                />
              );
            }
            return (
              <g key={`wave-dot-${i}`}>
                {/* Halo */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 8 : 6}
                  fill={COLOR}
                  opacity={0.12}
                />
                {/* Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 4.5 : 3.5}
                  fill={COLOR}
                  stroke="hsl(var(--card))"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Month labels */}
          {allMonthsData.map((d, i) => {
            const x = px + (i / 11) * plotW;
            const isActive = activeWithValueSet.has(d.month);
            return (
              <text
                key={`label-${d.month}`}
                x={x}
                y={chartH + 14}
                textAnchor="middle"
                fontSize="7.5"
                fill={isActive ? COLOR_DARK : "hsl(var(--muted-foreground))"}
                fontWeight={isActive ? "600" : "400"}
                opacity={isActive ? 1 : 0.5}
              >
                {MONTH_LABELS[d.month - 1]}
              </text>
            );
          })}

          {/* Hover zones */}
          {allMonthsData.map((d, i) => {
            const x = px + (i / 11) * plotW;
            const zoneW = plotW / 12;
            return (
              <rect
                key={`hover-${d.month}`}
                x={x - zoneW / 2}
                y={0}
                width={zoneW}
                height={chartH + 18}
                fill="transparent"
                onMouseEnter={() => setHoveredMonth(d.month)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredData && hoveredData.value > 0 && (
          <div
            className="absolute z-20 pointer-events-none rounded-lg border px-3 py-2 text-[10px] shadow-md"
            style={{
              background: "hsl(var(--popover))",
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--popover-foreground))",
              left: `${((hoveredData.month - 1) / 11) * 80 + 5}%`,
              top: 0,
              transform: "translateX(-50%)",
              minWidth: 180,
            }}
          >
            <p className="font-bold text-[11px] mb-1">{MONTH_LABELS[hoveredData.month - 1]} {dashYear}</p>
            <p>Energía ahorrada: <span className="font-semibold" style={{ color: COLOR_DARK }}>{hoveredData.value.toLocaleString("es-MX", { maximumFractionDigits: 0 })} kWh</span></p>
            <p>Acumulado anual: <span className="font-semibold">{hoveredData.cumulative.toLocaleString("es-MX", { maximumFractionDigits: 0 })} kWh</span></p>
            {annualTotal > 0 && (
              <p>Participación: <span className="font-semibold">{((hoveredData.value / annualTotal) * 100).toFixed(1)}%</span></p>
            )}
            {topMat && <p className="text-muted-foreground mt-0.5">Material dominante: {topMat.name}</p>}
          </div>
        )}
      </div>

      {/* Energy equivalences */}
      {total > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Equivalente energético
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-[10px] font-bold" style={{ color: COLOR_DARK }}>🏠 {homesEquiv.toLocaleString("es-MX")}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">hogares / 1 mes</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold" style={{ color: COLOR_DARK }}>🔌 {evsEquiv.toLocaleString("es-MX")}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">cargas de VE</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyWaveCard;
