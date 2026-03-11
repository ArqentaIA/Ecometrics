import { useState, useMemo } from "react";
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
  /** Extra segments beyond the visible top N, to be grouped as "Otros" */
  extraSegments?: Segment[];
  unit: string;
}

const BAR_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"];

const HorizontalBar3D = ({ title, emoji, segments, extraSegments, unit }: HorizontalBar3DProps) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const othersValue = useMemo(() => (extraSegments ?? []).reduce((s, seg) => s + seg.value, 0), [extraSegments]);
  const displaySegments = useMemo(() => {
    if (othersValue > 0) {
      return [...segments, { label: "Otros materiales", value: othersValue, color: "#94A3B8" }];
    }
    return segments;
  }, [segments, othersValue]);

  const total = useMemo(() => displaySegments.reduce((s, seg) => s + seg.value, 0), [displaySegments]);
  const { displayValue, progress, isPulsing } = useLoopAnimation({ targetValue: total });
  const maxVal = Math.max(...displaySegments.map(s => s.value), 1);

  const leader = useMemo(() => {
    if (displaySegments.length === 0) return null;
    const sorted = [...displaySegments].sort((a, b) => b.value - a.value);
    return sorted[0];
  }, [displaySegments]);

  const barH = 26;
  const depth = 6;

  return (
    <div className="win-card p-5 min-h-[320px] hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs font-heading font-bold">{title}</span>
      </div>
      <div className="flex items-center gap-1 mb-1">
        <span
          className="font-heading text-[22px] font-bold tracking-tight leading-none text-foreground"
          style={{ transform: isPulsing ? "scale(1.03)" : "scale(1)", transition: "transform 0.2s" }}
        >
          {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
        </span>
        <span className="text-[10px] text-muted-foreground ml-1">{unit}</span>
      </div>
      <p className="text-[9px] text-muted-foreground/70 mb-3">Capturas confirmadas del periodo filtrado.</p>

      <div className="flex flex-col gap-[2px]">
        {displaySegments.map((seg, i) => {
          const pct = total > 0 ? (seg.value / maxVal) * 100 * progress : 0;
          const isHovered = hoverIdx === i;
          const percentage = total > 0 ? ((seg.value / total) * 100).toFixed(1) : "0.0";
          const isOthers = seg.label === "Otros materiales";

          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-2 cursor-pointer rounded px-1 py-[3px] transition-all duration-200"
                  style={{ background: isHovered ? `${seg.color}12` : "transparent" }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  <span className={`text-[10px] font-medium text-foreground w-[72px] truncate text-right ${isOthers ? "italic text-muted-foreground" : ""}`}>
                    {seg.label}
                  </span>

                  <div className="flex-1 relative" style={{ height: barH }}>
                    <div className="absolute inset-0 rounded-sm" style={{ background: "hsl(var(--muted))", height: barH - depth }} />
                    <div
                      className="absolute left-0 top-0 rounded-sm transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 1)}%`,
                        height: barH - depth,
                        background: isOthers
                          ? `linear-gradient(180deg, ${seg.color}aa, ${seg.color}88)`
                          : `linear-gradient(180deg, ${seg.color}ee, ${seg.color})`,
                        boxShadow: isHovered
                          ? `0 2px 12px ${seg.color}50, inset 0 1px 0 rgba(255,255,255,0.3)`
                          : `inset 0 1px 0 rgba(255,255,255,0.25)`,
                        transform: isHovered ? "scaleY(1.1)" : "scaleY(1)",
                        transformOrigin: "top",
                      }}
                    />
                    <div
                      className="absolute left-0 rounded-b-sm transition-all duration-500"
                      style={{
                        top: barH - depth,
                        width: `${Math.max(pct, 1)}%`,
                        height: depth,
                        background: `linear-gradient(180deg, ${seg.color}cc, ${seg.color}88)`,
                      }}
                    />
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

                  <span
                    className="text-[10px] font-semibold w-[38px] text-right transition-colors"
                    style={{ color: isHovered ? seg.color : "hsl(var(--muted-foreground))" }}
                  >
                    {percentage}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs leading-relaxed">
                <p className="font-bold">{seg.label}</p>
                <p>{seg.value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} kg recuperados</p>
                <p className="text-muted-foreground">Participación: {percentage}%</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Leader indicator */}
      {leader && leader.value > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground mb-1">Material líder</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: leader.color }} />
            <span className="text-[12px] font-heading font-bold text-foreground">{leader.label}</span>
            <span className="ml-auto text-[11px] font-semibold" style={{ color: leader.color }}>
              {total > 0 ? ((leader.value / total) * 100).toFixed(1) : 0}% del volumen total
            </span>
          </div>
        </div>
      )}

      {hoverIdx !== null && displaySegments[hoverIdx] && (
        <div className="mt-2 text-center text-[11px] text-muted-foreground animate-fade-in">
          <span className="font-semibold text-foreground">{displaySegments[hoverIdx].label}:</span>{" "}
          {displaySegments[hoverIdx].value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} {unit}{" "}
          ({total > 0 ? ((displaySegments[hoverIdx].value / total) * 100).toFixed(1) : 0}%)
        </div>
      )}
    </div>
  );
};

export default HorizontalBar3D;
