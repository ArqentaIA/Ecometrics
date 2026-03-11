import { useState, useRef } from "react";
import { useLoopAnimation } from "@/hooks/useLoopAnimation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface HorizontalBar3DProps {
  title: string;
  emoji: string;
  segments: Segment[];
  unit: string;
}

const HorizontalBar3D = ({ title, emoji, segments, unit }: HorizontalBar3DProps) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const { displayValue, progress, isPulsing } = useLoopAnimation({ targetValue: total });
  const maxVal = Math.max(...segments.map(s => s.value), 1);

  const barH = 26;
  const depth = 6;

  return (
    <div className="win-card p-5 min-h-[320px] hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs font-heading font-bold">{title}</span>
      </div>
      <div className="flex items-center gap-1 mb-4">
        <span
          className="font-heading text-[22px] font-bold tracking-tight leading-none text-foreground"
          style={{ transform: isPulsing ? "scale(1.03)" : "scale(1)", transition: "transform 0.2s" }}
        >
          {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
        </span>
        <span className="text-[10px] text-muted-foreground ml-1">{unit}</span>
      </div>

      <div className="flex flex-col gap-[2px]">
        {segments.map((seg, i) => {
          const pct = total > 0 ? (seg.value / maxVal) * 100 * progress : 0;
          const isHovered = hoverIdx === i;
          const percentage = total > 0 ? ((seg.value / total) * 100).toFixed(1) : "0.0";

          return (
            <div
              key={i}
              className="flex items-center gap-2 cursor-pointer rounded px-1 py-[3px] transition-all duration-200"
              style={{ background: isHovered ? `${seg.color}12` : "transparent" }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {/* Label */}
              <span className="text-[10px] font-medium text-foreground w-[72px] truncate text-right">
                {seg.label}
              </span>

              {/* 3D Bar */}
              <div className="flex-1 relative" style={{ height: barH }}>
                {/* Background track */}
                <div
                  className="absolute inset-0 rounded-sm"
                  style={{ background: "hsl(var(--muted))", height: barH - depth }}
                />
                {/* Top face (main bar) */}
                <div
                  className="absolute left-0 top-0 rounded-sm transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 1)}%`,
                    height: barH - depth,
                    background: `linear-gradient(180deg, ${seg.color}ee, ${seg.color})`,
                    boxShadow: isHovered
                      ? `0 2px 12px ${seg.color}50, inset 0 1px 0 rgba(255,255,255,0.3)`
                      : `inset 0 1px 0 rgba(255,255,255,0.25)`,
                    transform: isHovered ? "scaleY(1.1)" : "scaleY(1)",
                    transformOrigin: "top",
                  }}
                />
                {/* Bottom face (3D depth) */}
                <div
                  className="absolute left-0 rounded-b-sm transition-all duration-500"
                  style={{
                    top: barH - depth,
                    width: `${Math.max(pct, 1)}%`,
                    height: depth,
                    background: `linear-gradient(180deg, ${seg.color}cc, ${seg.color}88)`,
                  }}
                />
                {/* Shine highlight */}
                <div
                  className="absolute left-0 top-0 rounded-sm transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 1)}%`,
                    height: (barH - depth) * 0.4,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.35), transparent)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Percentage */}
              <span
                className="text-[10px] font-semibold w-[32px] text-right transition-colors"
                style={{ color: isHovered ? seg.color : "hsl(var(--muted-foreground))" }}
              >
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>

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

export default HorizontalBar3D;
