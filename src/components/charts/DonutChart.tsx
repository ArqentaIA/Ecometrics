import { useEffect, useState } from "react";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  emoji: string;
  segments: Segment[];
  unit: string;
}

const DonutChart = ({ title, emoji, segments, unit }: DonutChartProps) => {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 200); }, []);

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const size = 160;
  const r = 58;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * r;

  let accumulated = 0;
  const arcs = segments.map((seg, i) => {
    const pct = total > 0 ? seg.value / total : 0;
    const offset = circumference * (1 - accumulated);
    const length = circumference * pct;
    accumulated += pct;
    return { ...seg, pct, offset: offset - circumference * 0.25, length, index: i };
  });

  return (
    <div className="win-card p-5 min-h-[320px] hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs font-heading font-bold">{title}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}
          onMouseLeave={() => setHoverIdx(null)}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {arcs.map((arc) => (
              <circle
                key={arc.index}
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth={hoverIdx === arc.index ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${show ? arc.length : 0} ${circumference}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="butt"
                onMouseEnter={() => setHoverIdx(arc.index)}
                className="cursor-pointer"
                style={{
                  transition: `stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1) ${arc.index * 0.1}s, stroke-width 0.2s`,
                  filter: hoverIdx === arc.index ? `drop-shadow(0 0 6px ${arc.color}60)` : "none",
                }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-[20px] font-bold tracking-tight leading-none text-foreground">
              {total.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[9px] text-muted-foreground">{unit}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {segments.map((seg, i) => (
            <div key={i}
              className="flex items-center gap-2 text-[11px] cursor-pointer rounded px-1.5 py-0.5 transition-colors"
              style={{ background: hoverIdx === i ? `${seg.color}15` : "transparent" }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}>
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
              <span className="truncate text-foreground font-medium">{seg.label}</span>
              <span className="text-muted-foreground ml-auto flex-shrink-0">
                {total > 0 ? ((seg.value / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip overlay */}
      {hoverIdx !== null && segments[hoverIdx] && (
        <div className="mt-3 text-center text-[11px] text-muted-foreground animate-fade-in">
          <span className="font-semibold text-foreground">{segments[hoverIdx].label}:</span>{" "}
          {segments[hoverIdx].value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} {unit}{" "}
          ({total > 0 ? ((segments[hoverIdx].value / total) * 100).toFixed(1) : 0}%)
        </div>
      )}
    </div>
  );
};

export default DonutChart;
