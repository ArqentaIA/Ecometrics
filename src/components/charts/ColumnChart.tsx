import { useState } from "react";
import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface DataPoint {
  label: string;
  value: number;
}

interface ColumnChartProps {
  title: string;
  emoji: string;
  data: DataPoint[];
  color: string;
  unit: string;
  trend?: number;
}

const ColumnChart = ({ title, emoji, data, color, unit, trend }: ColumnChartProps) => {
  const lastVal = data[data.length - 1]?.value ?? 0;
  const { displayValue, progress, isPulsing } = useLoopAnimation({ targetValue: lastVal });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const w = 380;
  const h = 180;
  const px = 40;
  const py = 20;
  const chartW = w - px - 10;
  const chartH = h - py * 2;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.min(chartW / data.length * 0.6, 24);
  const gap = chartW / data.length;

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
          {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
        </span>{" "}
        <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </div>

      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = py + chartH - f * chartH;
          const val = f * maxVal;
          return (
            <g key={f}>
              <line x1={px} y1={y} x2={px + chartW} y2={y} stroke="hsl(var(--muted))" strokeWidth="0.5" opacity={0.5} />
              <text x={px - 5} y={y + 3} textAnchor="end" fontSize="7" fill="hsl(var(--muted-foreground))">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const fullBarH = (d.value / maxVal) * chartH;
          const barH = fullBarH * progress;
          const x = px + i * gap + (gap - barWidth) / 2;
          const y = py + chartH - barH;
          const isHovered = hoverIdx === i;

          return (
            <g key={i}
              onMouseEnter={() => setHoverIdx(i)}
              className="cursor-pointer">
              <rect
                x={x} y={y}
                width={barWidth}
                height={barH}
                rx={4} ry={4}
                fill={color}
                opacity={isHovered ? 1 : 0.8}
                style={{ filter: isHovered ? `drop-shadow(0 2px 6px ${color}50)` : "none" }}
              />
              <text x={x + barWidth / 2} y={py + chartH + 13} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
                {d.label}
              </text>

              {isHovered && (
                <g>
                  <rect x={x + barWidth / 2 - 32} y={y - 26} width={64} height={20} rx={6}
                    fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth="0.5"
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }} />
                  <text x={x + barWidth / 2} y={y - 13} textAnchor="middle" fontSize="8" fontWeight="bold" fill="hsl(var(--popover-foreground))">
                    {d.value.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ColumnChart;
