import { useState } from "react";
import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface MonthlyData {
  month: number;
  value: number;
}

interface TopMaterial {
  name: string;
  value: number;
  color: string;
}

interface EconomicImpactCardProps {
  total: number;
  monthlyData: MonthlyData[];
  allMonthsData: MonthlyData[];
  periodLabel: string;
  color?: string;
  topMaterials?: TopMaterial[];
  dashYear: number;
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const EconomicImpactCard = ({
  total,
  monthlyData,
  allMonthsData,
  periodLabel,
  color = "#9333EA",
  topMaterials = [],
  dashYear,
}: EconomicImpactCardProps) => {
  const { displayValue, isPulsing } = useLoopAnimation({ targetValue: total });
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const activeMonths = monthlyData.filter(d => d.value > 0);

  // Variation: last active vs previous active
  const variation = (() => {
    if (activeMonths.length < 2) return null;
    const sorted = [...activeMonths].sort((a, b) => a.month - b.month);
    const last = sorted[sorted.length - 1].value;
    const prev = sorted[sorted.length - 2].value;
    if (prev === 0) return null;
    return ((last - prev) / prev) * 100;
  })();

  // Build active months set for highlighting
  const activeMonthSet = new Set(monthlyData.map(d => d.month));
  const activeWithValueSet = new Set(activeMonths.map(d => d.month));

  // Merge all 12 months data with active data
  const allMonthValues = allMonthsData.map(d => d.value);
  const maxVal = Math.max(...allMonthValues, 1);

  // Cumulative line data (from all captures, always 12 months)
  const cumulativeData = allMonthsData.reduce<{ month: number; cumulative: number }[]>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    acc.push({ month: d.month, cumulative: prev + d.value });
    return acc;
  }, []);
  const maxCumulative = Math.max(...cumulativeData.map(d => d.cumulative), 1);

  // Annual total for percentage calculations
  const annualTotal = allMonthsData.reduce((s, d) => s + d.value, 0);

  // Get value for a specific month from filtered data
  const getFilteredValue = (month: number) => {
    const found = monthlyData.find(d => d.month === month);
    return found?.value ?? 0;
  };

  // Chart dimensions
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

  const linePath = linePoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  // Hovered month tooltip data
  const hoveredData = hoveredMonth !== null ? {
    month: hoveredMonth,
    value: allMonthsData.find(d => d.month === hoveredMonth)?.value ?? 0,
    cumulative: cumulativeData.find(d => d.month === hoveredMonth)?.cumulative ?? 0,
    filteredValue: getFilteredValue(hoveredMonth),
  } : null;

  return (
    <div className="win-card p-5 hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span className="text-xs font-heading font-bold">Impacto Económico en la Comunidad</span>
        </div>
        {variation !== null ? (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
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
      <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">{periodLabel}</p>

      {/* Hybrid Chart */}
      <div className="flex-1 flex flex-col justify-end relative">
        <svg
          width="100%"
          viewBox={`0 0 ${chartW} ${chartH + 18}`}
          className="overflow-visible"
          onMouseLeave={() => setHoveredMonth(null)}
        >
          {/* Layer 1: Shadow bars (all 12 months, gray) */}
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

          {/* Layer 2: Active bars (filtered months with data) */}
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
                  fill={color}
                  opacity={isHovered ? 1 : 0.85}
                  className="transition-opacity duration-150"
                />
                {/* Highlight marker on top */}
                <rect
                  x={x + barW / 2 - 5}
                  y={chartH - barH - 4}
                  width={10}
                  height={2.5}
                  rx={1.25}
                  fill={color}
                  opacity={0.6}
                />
              </g>
            );
          })}

          {/* Layer 3: Cumulative line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.55}
          />
          {linePoints.map((p, i) => (
            <circle
              key={`node-${i}`}
              cx={p.x}
              cy={p.y}
              r={hoveredMonth === p.month ? 4 : 2}
              fill={color}
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
                fill={isActive ? color : "hsl(var(--muted-foreground))"}
                fontWeight={isActive ? "600" : "400"}
                opacity={isActive ? 1 : 0.5}
              >
                {MONTH_LABELS[d.month - 1]}
              </text>
            );
          })}

          {/* Hover zones (invisible rects for mouse interaction) */}
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
              minWidth: 160,
            }}
          >
            <p className="font-bold text-[11px] mb-1">{MONTH_LABELS[hoveredData.month - 1]} {dashYear}</p>
            <p>Impacto económico: <span className="font-semibold" style={{ color }}>${hoveredData.value.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN</span></p>
            <p>Acumulado anual: <span className="font-semibold">${hoveredData.cumulative.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN</span></p>
            {annualTotal > 0 && (
              <p>Participación anual: <span className="font-semibold">{((hoveredData.value / annualTotal) * 100).toFixed(1)}%</span></p>
            )}
          </div>
        )}
      </div>

      {/* Top Materials Breakdown */}
      {topMaterials.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Valor económico reincorporado a la industria
          </p>
          <div className="space-y-1.5">
            {topMaterials.slice(0, 3).map(mat => (
              <div key={mat.name} className="flex items-center justify-between rounded-md px-2 py-1 -mx-2 transition-all duration-200 hover:bg-purple-50/70 hover:shadow-md hover:scale-[1.02] cursor-default">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: mat.color }} />
                  <span className="text-[10px] font-medium truncate max-w-[120px]">{mat.name}</span>
                </div>
                <span className="text-[10px] font-bold" style={{ color }}>
                  ${mat.value.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EconomicImpactCard;
