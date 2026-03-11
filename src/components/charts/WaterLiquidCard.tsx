import { useMemo } from "react";
import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface MonthlyData {
  month: number;
  value: number;
}

interface EntryData {
  materialName: string;
  agua: number;
  kgBrutos: number;
}

interface WaterLiquidCardProps {
  value: number;
  monthlyData: MonthlyData[];
  periodLabel: string;
  dashYear: number;
  confirmedEntries: EntryData[];
  lastUpdated: string | null;
}

const WaterLiquidCard = ({
  value,
  monthlyData,
  periodLabel,
  dashYear,
  confirmedEntries,
  lastUpdated,
}: WaterLiquidCardProps) => {
  const { displayValue, isPulsing } = useLoopAnimation({ targetValue: value });

  const variation = useMemo(() => {
    const active = monthlyData.filter(d => d.value > 0);
    if (active.length < 2) return null;
    const sorted = [...active].sort((a, b) => a.month - b.month);
    const last = sorted[sorted.length - 1].value;
    const prev = sorted[sorted.length - 2].value;
    if (prev === 0) return null;
    return ((last - prev) / prev) * 100;
  }, [monthlyData]);

  const showers = Math.round(value / 250);
  const peoplePerDay = Math.round(value / 1500);

  const totalCaptures = confirmedEntries.filter(e => e.agua > 0).length;
  const avgPerCapture = totalCaptures > 0 ? Math.round(value / totalCaptures) : 0;

  const topMaterial = useMemo(() => {
    const byMat: Record<string, number> = {};
    confirmedEntries.forEach(e => {
      if (e.agua > 0) byMat[e.materialName] = (byMat[e.materialName] || 0) + e.agua;
    });
    const entries = Object.entries(byMat);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }, [confirmedEntries]);

  const size = 150;
  const r = size / 2;
  const visualMax = Math.max(value * 1.2, 1);
  const fillPct = Math.min((displayValue / visualMax) * 100, 95);
  const fillY = size - (fillPct / 100) * size;
  const clipId = `water-clip-${dashYear}`;
  const gradId = `water-grad-${dashYear}`;

  const sparkPoints = useMemo(() => {
    const active = monthlyData.filter(d => d.value > 0);
    if (active.length === 0) return "";
    const sorted = [...active].sort((a, b) => a.month - b.month);
    const max = Math.max(...sorted.map(d => d.value), 1);
    const w = 200, h = 32;
    const step = sorted.length > 1 ? w / (sorted.length - 1) : w / 2;
    return sorted.map((d, i) => {
      const x = sorted.length === 1 ? w / 2 : i * step;
      const y = h - (d.value / max) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }, [monthlyData]);

  const sparkArea = useMemo(() => {
    if (!sparkPoints) return "";
    const active = monthlyData.filter(d => d.value > 0).sort((a, b) => a.month - b.month);
    if (active.length === 0) return "";
    const max = Math.max(...active.map(d => d.value), 1);
    const w = 200, h = 32;
    const step = active.length > 1 ? w / (active.length - 1) : w / 2;
    const lastX = active.length === 1 ? w / 2 : (active.length - 1) * step;
    const firstX = active.length === 1 ? w / 2 : 0;
    return `${sparkPoints} L${lastX.toFixed(1)},${h} L${firstX.toFixed(1)},${h} Z`;
  }, [sparkPoints, monthlyData]);

  return (
    <div className="win-card p-5 flex flex-col items-center hover:shadow-lg transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 w-full justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <span className="text-xs font-heading font-bold text-foreground">Agua Conservada</span>
        </div>
        {variation !== null ? (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: variation >= 0 ? "hsl(199 89% 48% / 0.15)" : "hsl(0 84% 60% / 0.15)",
              color: variation >= 0 ? "hsl(199 89% 48%)" : "hsl(0 84% 60%)",
            }}
          >
            {variation >= 0 ? "▲" : "▼"} {Math.abs(variation).toFixed(1)}%
          </span>
        ) : (
          <span className="text-[9px] px-2 py-0.5 rounded-full text-muted-foreground bg-muted">
            Sin comparativo
          </span>
        )}
      </div>
      <p className="text-[9px] text-muted-foreground mb-2 w-full">
        Volumen total de agua preservada por materiales recuperados
      </p>

      {/* Liquid Fill Indicator */}
      <div className="relative my-1" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <clipPath id={clipId}>
              <circle cx={r} cy={r} r={r - 4} />
            </clipPath>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(199 89% 48%)" stopOpacity={0.55} />
              <stop offset="100%" stopColor="hsl(201 96% 32%)" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <circle cx={r} cy={r} r={r - 4} fill="none" stroke="hsl(199 89% 48%)" strokeWidth="2" opacity={0.18} />
          <circle cx={r} cy={r} r={r - 2} fill="hsl(var(--card))" />
          <g clipPath={`url(#${clipId})`}>
            <rect x={0} y={fillY} width={size} height={size} fill={`url(#${gradId})`} />
            <path
              d={`M0 ${fillY} Q${size * 0.25} ${fillY - 8} ${size * 0.5} ${fillY} T${size} ${fillY} V${size} H0 Z`}
              fill="hsl(199 89% 48%)" opacity={0.3}
            >
              <animateTransform attributeName="transform" type="translate"
                values={`0,0; ${size * 0.1},0; 0,0`} dur="3s" repeatCount="indefinite" />
            </path>
            <path
              d={`M0 ${fillY + 3} Q${size * 0.3} ${fillY - 5} ${size * 0.6} ${fillY + 3} T${size} ${fillY + 3} V${size} H0 Z`}
              fill="hsl(201 96% 32%)" opacity={0.15}
            >
              <animateTransform attributeName="transform" type="translate"
                values={`0,0; -${size * 0.08},0; 0,0`} dur="2.5s" repeatCount="indefinite" />
            </path>
            <rect x={size * 0.28} y={fillY + 5} width={size * 0.12} height={size * 0.35}
              rx={8} fill="white" opacity={0.08} />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-heading text-[20px] font-bold tracking-tight leading-none"
            style={{
              color: fillPct > 50 ? "white" : "hsl(201 96% 32%)",
              textShadow: fillPct > 50 ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              transform: isPulsing ? "scale(1.03)" : "scale(1)",
              transition: "transform 0.2s ease-in-out",
            }}
          >
            {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[9px] mt-0.5"
            style={{ color: fillPct > 50 ? "rgba(255,255,255,0.8)" : "hsl(var(--muted-foreground))" }}>
            Litros
          </span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mb-2">{periodLabel}</p>

      {/* Sparkline trend */}
      {sparkPoints && (
        <div className="w-full mb-2">
          <svg viewBox="0 0 200 32" className="w-full h-8" preserveAspectRatio="none">
            <path d={sparkArea} fill="hsl(199 89% 48% / 0.12)" />
            <path d={sparkPoints} fill="none" stroke="hsl(199 89% 48%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Equivalence */}
      {value > 0 && (
        <div className="w-full rounded-lg p-2.5 mb-2" style={{ background: "hsl(199 89% 48% / 0.06)" }}>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">
            Equivalente hídrico
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-[11px] font-bold" style={{ color: "hsl(201 96% 32%)" }}>
                🚿 {showers.toLocaleString("es-MX")}
              </p>
              <p className="text-[8px] text-muted-foreground leading-tight">duchas domésticas</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold" style={{ color: "hsl(201 96% 32%)" }}>
                🧑 {peoplePerDay.toLocaleString("es-MX")}
              </p>
              <p className="text-[8px] text-muted-foreground leading-tight">personas / 1 día</p>
            </div>
          </div>
        </div>
      )}

      {/* Micro indicators */}
      <div className="w-full pt-2 border-t space-y-1.5" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Promedio por captura</span>
          <span className="font-semibold text-foreground">{avgPerCapture.toLocaleString("es-MX")} L</span>
        </div>
        {topMaterial && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Material líder</span>
            <span className="font-semibold text-foreground truncate ml-2 max-w-[120px]">{topMaterial}</span>
          </div>
        )}
        {lastUpdated && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Última sync</span>
            <span className="font-semibold text-foreground">
              {new Date(lastUpdated).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterLiquidCard;
