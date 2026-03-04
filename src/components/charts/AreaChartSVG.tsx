import { useState } from "react";
import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface DataPoint {
  label: string;
  value: number;
}

interface AreaChartSVGProps {
  title: string;
  emoji: string;
  data: DataPoint[];
  lineColor: string;
  areaColor: string;
  unit: string;
  trend?: number;
}

const AreaChartSVG = ({ title, emoji, data, lineColor, areaColor, unit, trend }: AreaChartSVGProps) => {
  const lastVal = data[data.length - 1]?.value ?? 0;
  const { displayValue, progress, isPulsing } = useLoopAnimation({ targetValue: lastVal });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; val: number; label: string } | null>(null);

  const w = 380;
  const h = 180;
  const px = 40;
  const py = 20;
  const chartW = w - px - 10;
  const chartH = h - py * 2;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: px + (i / Math.max(data.length - 1, 1)) * chartW,
    y: py + chartH - ((d.value - minVal) / range) * chartH,
    ...d,
  }));

  const buildPath = () => {
    if (points.length < 2) return "";
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const linePath = buildPath();
  const areaPath = linePath
    ? `${linePath} L${points[points.length - 1].x},${py + chartH} L${points[0].x},${py + chartH} Z`
    : "";

  // Clip width based on progress
  const clipWidth = progress * chartW;

  return (
    <div className="win-card p-5 min-h-[320px] hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-xs font-heading font-bold">{title}</span>
        </div>
        {trend !== undefined && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${lineColor}15`, color: lineColor }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="font-heading text-[24px] font-bold tracking-tight mb-2" style={{ color: lineColor }}>
        <span style={{ transform: isPulsing ? "scale(1.03)" : "scale(1)", display: "inline-block", transition: "transform 0.2s" }}>
          {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
        </span>{" "}
        <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </div>

      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible"
          onMouseLeave={() => setTooltip(null)}>
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = py + chartH - f * chartH;
            const val = minVal + f * range;
            return (
              <g key={f}>
                <line x1={px} y1={y} x2={px + chartW} y2={y} stroke="hsl(var(--muted))" strokeWidth="0.5" opacity={0.5} />
                <text x={px - 5} y={y + 3} textAnchor="end" fontSize="7" fill="hsl(var(--muted-foreground))">
                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={areaColor} stopOpacity={0.05} />
            </linearGradient>
            <clipPath id="areaClipLoop">
              <rect x={px} y={0} width={clipWidth} height={h} />
            </clipPath>
          </defs>

          <g clipPath="url(#areaClipLoop)">
            <path d={areaPath} fill="url(#areaGrad)" />
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinejoin="round" />
          </g>

          {points.map((p, i) => {
            const pointVisible = p.x <= px + clipWidth;
            return (
              <g key={i}
                onMouseEnter={() => setTooltip({ x: p.x, y: p.y, val: p.value, label: p.label })}
                className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3}
                  fill={lineColor} stroke="white" strokeWidth="1.5"
                  style={{ opacity: pointVisible ? 1 : 0 }} />
                <text x={p.x} y={py + chartH + 13} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{p.label}</text>
              </g>
            );
          })}

          {tooltip && (
            <g>
              <rect x={tooltip.x - 35} y={tooltip.y - 32} width={70} height={22} rx={6}
                fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth="0.5"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }} />
              <text x={tooltip.x} y={tooltip.y - 18} textAnchor="middle" fontSize="9" fontWeight="bold" fill="hsl(var(--popover-foreground))">
                {tooltip.val.toLocaleString("es-MX", { maximumFractionDigits: 1 })} {unit}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default AreaChartSVG;
