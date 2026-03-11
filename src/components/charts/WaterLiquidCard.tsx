import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface MonthlyData {
  month: number;
  value: number;
}

interface WaterLiquidCardProps {
  value: number;
  target: number;
  monthlyData: MonthlyData[];
  periodLabel: string;
  dashYear: number;
}

const COLOR = "#38BDF8";
const COLOR_DARK = "#0284C7";

const WaterLiquidCard = ({
  value,
  target,
  monthlyData,
  periodLabel,
  dashYear,
}: WaterLiquidCardProps) => {
  const { displayValue, isPulsing } = useLoopAnimation({ targetValue: value });

  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const animatedPct = target > 0 ? Math.min((displayValue / target) * 100, 100) : 0;
  const exceeded = value > target && target > 0;

  // Variation
  const activeMonths = monthlyData.filter(d => d.value > 0);
  const variation = (() => {
    if (activeMonths.length < 2) return null;
    const sorted = [...activeMonths].sort((a, b) => a.month - b.month);
    const last = sorted[sorted.length - 1].value;
    const prev = sorted[sorted.length - 2].value;
    if (prev === 0) return null;
    return ((last - prev) / prev) * 100;
  })();

  // Liquid gauge dimensions
  const size = 140;
  const r = size / 2;
  const fillY = size - (animatedPct / 100) * size;
  const clipId = `water-clip-${dashYear}`;
  const gradId = `water-grad-${dashYear}`;

  // Equivalences
  const peoplePerDay = Math.round(value / 1500); // ~1500L per person per day (Mexico avg)
  const showers = Math.round(value / 250); // ~250L per shower

  return (
    <div className="win-card p-5 flex flex-col items-center hover:shadow-lg transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 w-full justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <span className="text-xs font-heading font-bold">Agua Conservada</span>
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

      {/* Liquid Indicator */}
      <div className="relative my-2" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <clipPath id={clipId}>
              <circle cx={r} cy={r} r={r - 4} />
            </clipPath>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR} stopOpacity={0.6} />
              <stop offset="100%" stopColor={COLOR_DARK} stopOpacity={0.85} />
            </linearGradient>
          </defs>

          {/* Container circle */}
          <circle cx={r} cy={r} r={r - 4} fill="none" stroke={COLOR} strokeWidth="2" opacity={0.2} />
          <circle cx={r} cy={r} r={r - 2} fill="hsl(var(--card))" />

          {/* Water fill */}
          <g clipPath={`url(#${clipId})`}>
            <rect x={0} y={fillY} width={size} height={size} fill={`url(#${gradId})`} />

            {/* Wave 1 */}
            <path
              d={`M0 ${fillY} Q${size * 0.25} ${fillY - 8} ${size * 0.5} ${fillY} T${size} ${fillY} V${size} H0 Z`}
              fill={COLOR} opacity={0.3}
            >
              <animateTransform
                attributeName="transform" type="translate"
                values={`0,0; ${size * 0.1},0; 0,0`}
                dur="3s" repeatCount="indefinite"
              />
            </path>

            {/* Wave 2 */}
            <path
              d={`M0 ${fillY + 3} Q${size * 0.3} ${fillY - 5} ${size * 0.6} ${fillY + 3} T${size} ${fillY + 3} V${size} H0 Z`}
              fill={COLOR_DARK} opacity={0.15}
            >
              <animateTransform
                attributeName="transform" type="translate"
                values={`0,0; -${size * 0.08},0; 0,0`}
                dur="2.5s" repeatCount="indefinite"
              />
            </path>

            {/* Light reflection */}
            <rect x={size * 0.28} y={fillY + 5} width={size * 0.12} height={size * 0.35}
              rx={8} fill="white" opacity={0.08} />
          </g>
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-heading text-[20px] font-bold tracking-tight leading-none"
            style={{
              color: animatedPct > 55 ? "white" : COLOR_DARK,
              textShadow: animatedPct > 55 ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              transform: isPulsing ? "scale(1.03)" : "scale(1)",
              transition: "transform 0.2s ease-in-out",
            }}
          >
            {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[9px] mt-0.5"
            style={{ color: animatedPct > 55 ? "rgba(255,255,255,0.8)" : "hsl(var(--muted-foreground))" }}>
            Litros
          </span>
        </div>
      </div>

      {/* Period */}
      <p className="text-[10px] text-muted-foreground mb-2">{periodLabel}</p>

      {/* Meta indicator */}
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Meta anual</span>
          <span className="font-semibold text-foreground">{target.toLocaleString("es-MX")} L</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: `linear-gradient(90deg, ${COLOR}, ${COLOR_DARK})`,
            }}
          />
        </div>
        <div className="flex items-center justify-center">
          {exceeded ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${COLOR}20`, color: COLOR_DARK }}>
              🎉 Meta superada — {((value / target) * 100).toFixed(0)}%
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: pct >= 70 ? "#22c55e20" : pct >= 25 ? "#facc1520" : "#ef444420",
                color: pct >= 70 ? "#16A34A" : pct >= 25 ? "#CA8A04" : "#ef4444",
              }}>
              {pct.toFixed(0)}% del objetivo
            </span>
          )}
        </div>
      </div>

      {/* Equivalences */}
      {value > 0 && (
        <div className="w-full mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Equivalente hídrico
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-[10px] font-bold" style={{ color: COLOR_DARK }}>🚿 {showers.toLocaleString("es-MX")}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">duchas domésticas</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold" style={{ color: COLOR_DARK }}>🧑 {peoplePerDay.toLocaleString("es-MX")}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">personas / 1 día</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterLiquidCard;
