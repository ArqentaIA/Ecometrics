import { useState } from "react";
import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface MonthlyData {
  month: number;
  value: number;
}

interface TopCO2Material {
  name: string;
  co2: number;
}

interface CO2ImpactCardProps {
  total: number;
  monthlyData: MonthlyData[];
  allMonthsData: MonthlyData[];
  periodLabel: string;
  dashYear: number;
  topMaterials?: TopCO2Material[];
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLOR = "#16A34A";
const COLOR_DARK = "#15803D";
const COLOR_LIGHT = "#22C55E";

const CO2ImpactCard = ({
  total,
  monthlyData,
  allMonthsData,
  periodLabel,
  dashYear,
  topMaterials = [],
}: CO2ImpactCardProps) => {
  const { displayValue, isPulsing } = useLoopAnimation({ targetValue: total });
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const activeMonths = monthlyData.filter(d => d.value > 0);

  // Variation
  const variation = (() => {
    if (activeMonths.length < 2) return null;
    const sorted = [...activeMonths].sort((a, b) => a.month - b.month);
    const last = sorted[sorted.length - 1].value;
    const prev = sorted[sorted.length - 2].value;
    if (prev === 0) return null;
    return ((last - prev) / prev) * 100;
  })();

  const activeMonthSet = new Set(monthlyData.map(d => d.month));
  const activeWithValueSet = new Set(activeMonths.map(d => d.month));

  const allMonthValues = allMonthsData.map(d => d.value);
  const maxVal = Math.max(...allMonthValues, 1);

  // Cumulative
  const cumulativeData = allMonthsData.reduce<{ month: number; cumulative: number }[]>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    acc.push({ month: d.month, cumulative: prev + d.value });
    return acc;
  }, []);
  const maxCumulative = Math.max(...cumulativeData.map(d => d.cumulative), 1);
  const annualTotal = allMonthsData.reduce((s, d) => s + d.value, 0);

  const getFilteredValue = (month: number) => {
    const found = monthlyData.find(d => d.month === month);
    return found?.value ?? 0;
  };

  // Chart dims
  const chartW = 400;
  const chartH = 100;
  const barW = 26;
  const gap = (chartW - barW * 12) / 11;

  // Cumulative line points
  const linePoints = cumulativeData.map((d, i) => ({
    x: i * (barW + gap) + barW / 2,
    y: chartH - (d.cumulative / maxCumulative) * (chartH - 10) - 4,
    cumulative: d.cumulative,
    month: d.month,
  }));

  const linePath = linePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = linePath
    ? `${linePath} L${linePoints[linePoints.length - 1].x},${chartH} L${linePoints[0].x},${chartH} Z`
    : "";

  // Top material
  const topMat = topMaterials.length > 0 ? topMaterials[0] : null;
  const topMatPct = topMat && annualTotal > 0 ? ((topMat.co2 / annualTotal) * 100).toFixed(1) : "0";

  // CO2 → cars equivalent (avg car ~4,600 kg CO2/year)
  const carsEquiv = Math.round(total / 4600);

  const hoveredData = hoveredMonth !== null ? {
    month: hoveredMonth,
    value: allMonthsData.find(d => d.month === hoveredMonth)?.value ?? 0,
    cumulative: cumulativeData.find(d => d.month === hoveredMonth)?.cumulative ?? 0,
  } : null;

  // Find dominant material for hovered month (not available per-month, show top overall)
  const dominantMaterialName = topMat?.name ?? "—";

  return (
    <div className="win-card p-5 hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">♻️</span>
          <span className="text-xs font-heading font-bold">CO₂e Evitado</span>
        </div>
        {variation !== null ? (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${COLOR}15`, color: COLOR }}
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
      <div className="font-heading text-[26px] font-bold tracking-tight" style={{ color: COLOR }}>
        <span
          style={{
            transform: isPulsing ? "scale(1.03)" : "scale(1)",
            display: "inline-block",
            transition: "transform 0.2s",
          }}
        >
          {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
        </span>{" "}
        <span className="text-xs font-normal text-muted-foreground">kg CO₂</span>
      </div>

      {/* Period */}
      <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">{periodLabel}</p>

      {/* Hybrid Chart */}
      <div className="flex-1 flex flex-col justify-end relative">
        <svg
          width="100%"
          viewBox={`0 0 ${chartW} ${chartH + 18}`}
          className="overflow-visible"
          onMouseLeave={() => setHoveredMonth(null)}
        >
          {/* Layer 1: Shadow bars */}
          {allMonthsData.map((d, i) => {
            const x = i * (barW + gap);
            const barH = d.value > 0 ? Math.max((d.value / maxVal) * (chartH - 10), 3) : 2;
            return (
              <rect
                key={`shadow-${d.month}`}
                x={x}
                y={chartH - barH}
                width={barW}
                height={barH}
                rx={3}
                fill="hsl(var(--muted-foreground))"
                opacity={0.12}
              />
            );
          })}

          {/* Layer 2: Active bars */}
          {allMonthsData.map((d, i) => {
            const x = i * (barW + gap);
            const isActive = activeMonthSet.has(d.month);
            const hasValue = activeWithValueSet.has(d.month);
            const filteredVal = getFilteredValue(d.month);
            const barH = filteredVal > 0 ? Math.max((filteredVal / maxVal) * (chartH - 10), 3) : 0;
            const isHovered = hoveredMonth === d.month;

            if (!isActive || !hasValue) return null;

            return (
              <g key={`active-${d.month}`}>
                <rect
                  x={x}
                  y={chartH - barH}
                  width={barW}
                  height={barH}
                  rx={3}
                  fill={COLOR_LIGHT}
                  opacity={isHovered ? 1 : 0.85}
                  className="transition-opacity duration-150"
                />
                {/* Glow marker */}
                <circle
                  cx={x + barW / 2}
                  cy={chartH - barH - 5}
                  r={3}
                  fill={COLOR}
                  opacity={0.5}
                />
                <circle
                  cx={x + barW / 2}
                  cy={chartH - barH - 5}
                  r={1.5}
                  fill={COLOR}
                />
              </g>
            );
          })}

          {/* Layer 3: Cumulative area fill */}
          <path
            d={areaPath}
            fill={COLOR_LIGHT}
            opacity={0.12}
          />

          {/* Layer 3: Cumulative line */}
          <path
            d={linePath}
            fill="none"
            stroke={COLOR_DARK}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.6}
          />
          {linePoints.map((p, i) => (
            <circle
              key={`node-${i}`}
              cx={p.x}
              cy={p.y}
              r={hoveredMonth === p.month ? 4 : 2}
              fill={COLOR_DARK}
              stroke="hsl(var(--card))"
              strokeWidth="1"
              opacity={allMonthsData[i].value > 0 ? 0.7 : 0.2}
              className="transition-all duration-150"
            />
          ))}

          {/* Month labels */}
          {allMonthsData.map((d, i) => {
            const x = i * (barW + gap) + barW / 2;
            const isActive = activeWithValueSet.has(d.month);
            return (
              <text
                key={`label-${d.month}`}
                x={x}
                y={chartH + 14}
                textAnchor="middle"
                fontSize="7.5"
                fill={isActive ? COLOR : "hsl(var(--muted-foreground))"}
                fontWeight={isActive ? "600" : "400"}
                opacity={isActive ? 1 : 0.5}
              >
                {MONTH_LABELS[d.month - 1]}
              </text>
            );
          })}

          {/* Hover zones */}
          {allMonthsData.map((d, i) => {
            const x = i * (barW + gap);
            return (
              <rect
                key={`hover-${d.month}`}
                x={x - gap / 2}
                y={0}
                width={barW + gap}
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
            <p>CO₂ evitado: <span className="font-semibold" style={{ color: COLOR }}>{hoveredData.value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} kg</span></p>
            <p>Acumulado anual: <span className="font-semibold">{hoveredData.cumulative.toLocaleString("es-MX", { maximumFractionDigits: 1 })} kg</span></p>
            {annualTotal > 0 && (
              <p>Participación: <span className="font-semibold">{((hoveredData.value / annualTotal) * 100).toFixed(1)}%</span></p>
            )}
            <p className="text-muted-foreground mt-0.5">Material dominante: {dominantMaterialName}</p>
          </div>
        )}
      </div>

      {/* Bottom micro-indicators */}
      {topMat && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded-md p-1.5 transition-all duration-200 hover:bg-emerald-50/60 hover:shadow-md hover:scale-105 cursor-default">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider leading-tight mb-0.5">Mayor mitigación</p>
              <p className="text-[10px] font-bold truncate" style={{ color: COLOR_DARK }}>{topMat.name}</p>
            </div>
            <div className="text-center rounded-md p-1.5 transition-all duration-200 hover:bg-emerald-50/60 hover:shadow-md hover:scale-105 cursor-default">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider leading-tight mb-0.5">Equivalente</p>
              <p className="text-[10px] font-bold" style={{ color: COLOR_DARK }}>= {carsEquiv} autos/año</p>
            </div>
            <div className="text-center rounded-md p-1.5 transition-all duration-200 hover:bg-emerald-50/60 hover:shadow-md hover:scale-105 cursor-default">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider leading-tight mb-0.5">Participación</p>
              <p className="text-[10px] font-bold" style={{ color: COLOR_DARK }}>{topMatPct}% del CO₂</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CO2ImpactCard;
