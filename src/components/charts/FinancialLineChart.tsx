import { useState } from "react";
import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface DataPoint {
  label: string;
  value: number;
}

interface FinancialLineChartProps {
  title: string;
  emoji: string;
  data: DataPoint[];
  color: string;
  unit: string;
  trend?: number;
}

const FinancialLineChart = ({ title, emoji, data, color, unit, trend }: FinancialLineChartProps) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; val: number; label: string } | null>(null);

  // Build cumulative data
  const cumulative = data.reduce<DataPoint[]>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].value : 0;
    acc.push({ label: d.label, value: prev + d.value });
    return acc;
  }, []);

  const lastVal = cumulative[cumulative.length - 1]?.value ?? 0;
  const { displayValue, progress, isPulsing } = useLoopAnimation({ targetValue: lastVal });

  const w = 380;
  const h = 180;
  const px = 48;
  const py = 20;
  const chartW = w - px - 10;
  const chartH = h - py * 2;

  const maxVal = Math.max(...cumulative.map(d => d.value), 1);

  const points = cumulative.map((d, i) => ({
    x: px + (i / Math.max(cumulative.length - 1, 1)) * chartW,
    y: py + chartH - (d.value / maxVal) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${py + chartH} L${points[0].x},${py + chartH} Z`;

  const clipWidth = progress * chartW;

  return (
    <div className="win-card p-5 min-h-[320px] hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-xs font-heading font-bold">{title}</span>
        </div>
        {trend !== undefined && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="font-heading text-[24px] font-bold tracking-tight mb-2" style={{ color }}>
        <span style={{ transform: isPulsing ? "scale(1.03)" : "scale(1)", display: "inline-block", transition: "transform 0.2s" }}>
          ${displayValue.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
        </span>{" "}
        <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </div>

      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible"
        onMouseLeave={() => setTooltip(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = py + chartH - f * chartH;
          const val = f * maxVal;
          return (
            <g key={f}>
              <line x1={px} y1={y} x2={px + chartW} y2={y} stroke="hsl(var(--muted))" strokeWidth="0.5" opacity={0.5} />
              <text x={px - 5} y={y + 3} textAnchor="end" fontSize="7" fill="hsl(var(--muted-foreground))">
                ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
          <clipPath id="finClipLoop">
            <rect x={px} y={0} width={clipWidth} height={h} />
          </clipPath>
        </defs>

        <g clipPath="url(#finClipLoop)">
          <path d={areaPath} fill="url(#finGrad)" />
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        </g>

        {points.map((p, i) => {
          const pointVisible = p.x <= px + clipWidth;
          return (
            <g key={i}
              onMouseEnter={() => setTooltip({ x: p.x, y: p.y, val: p.value, label: p.label })}
              className="cursor-pointer">
              <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
              <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3.5}
                fill={color} stroke="white" strokeWidth="2"
                style={{ opacity: pointVisible ? 1 : 0 }} />
              <text x={p.x} y={py + chartH + 13} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{p.label}</text>
            </g>
          );
        })}

        {tooltip && (
          <g>
            <rect x={tooltip.x - 38} y={tooltip.y - 32} width={76} height={22} rx={6}
              fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth="0.5"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }} />
            <text x={tooltip.x} y={tooltip.y - 18} textAnchor="middle" fontSize="9" fontWeight="bold" fill="hsl(var(--popover-foreground))">
              ${tooltip.val.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default FinancialLineChart;
