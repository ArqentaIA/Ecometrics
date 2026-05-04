import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface MonthlyData {
  month: number;
  value: number;
}

interface TreesRingCardProps {
  value: number;
  target: number;
  monthlyData: MonthlyData[];
  allMonthsData: MonthlyData[];
  periodLabel: string;
  dashYear: number;
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLOR_LIGHT = "#86EFAC";
const COLOR_STD = "#22C55E";
const COLOR_INTENSE = "#16A34A";

const TreesRingCard = ({
  value,
  target,
  monthlyData,
  allMonthsData,
  periodLabel,
  dashYear,
}: TreesRingCardProps) => {
  const { displayValue, isPulsing } = useLoopAnimation({ targetValue: value });

  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const animatedPct = target > 0 ? Math.min((displayValue / target) * 100, 100) : 0;

  // Dynamic color based on progress
  const ringColor = pct < 25 ? COLOR_LIGHT : pct < 70 ? COLOR_STD : COLOR_INTENSE;

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

  // Ring geometry
  const size = 150;
  const outerStroke = 14;
  const innerStroke = 6;
  const outerR = (size - outerStroke) / 2;
  const innerR = outerR - outerStroke / 2 - innerStroke / 2 - 4;
  const outerCirc = 2 * Math.PI * outerR;
  const innerCirc = 2 * Math.PI * innerR;
  const outerOffset = outerCirc - (animatedPct / 100) * outerCirc;

  // Inner ring: potential (annual total as proportion of target)
  const annualTotal = allMonthsData.reduce((s, d) => s + d.value, 0);
  const potentialPct = target > 0 ? Math.min((annualTotal / target) * 100, 100) : 0;
  const innerOffset = innerCirc - (potentialPct / 100) * innerCirc;

  // CO2 equivalence (~24 kg CO2 absorbed per tree per year)
  const co2Absorbed = Math.round(value * 24);

  // Progress bar width
  const progressW = Math.min(pct, 100);

  return (
    <div className="win-card p-5 flex flex-col items-center hover:shadow-lg transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 w-full justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌳</span>
          <span className="text-xs font-heading font-bold">Árboles Preservados</span>
        </div>
        {variation !== null ? (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${COLOR_STD}15`, color: COLOR_INTENSE }}
          >
            {variation >= 0 ? "▲" : "▼"} {Math.abs(variation).toFixed(1)}%
          </span>
        ) : (
          <span className="text-[9px] px-2 py-0.5 rounded-full text-muted-foreground bg-muted">
            Sin comparativo
          </span>
        )}
      </div>

      {/* Double Ring */}
      <div className="relative my-2" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Outer ring background */}
          <circle
            cx={size / 2} cy={size / 2} r={outerR}
            fill="none" stroke="hsl(var(--muted))" strokeWidth={outerStroke}
            opacity={0.2}
          />
          {/* Outer ring progress */}
          <circle
            cx={size / 2} cy={size / 2} r={outerR}
            fill="none" stroke={ringColor} strokeWidth={outerStroke}
            strokeLinecap="round"
            strokeDasharray={outerCirc}
            strokeDashoffset={outerOffset}
            className="transition-all duration-700"
            style={{
              filter: pct >= 70 ? `drop-shadow(0 0 8px ${ringColor}60)` : `drop-shadow(0 0 4px ${ringColor}30)`,
            }}
          />
          {/* Inner ring background */}
          <circle
            cx={size / 2} cy={size / 2} r={innerR}
            fill="none" stroke="hsl(var(--muted))" strokeWidth={innerStroke}
            opacity={0.12}
            strokeDasharray="4 3"
          />
          {/* Inner ring (potential/annual) */}
          <circle
            cx={size / 2} cy={size / 2} r={innerR}
            fill="none" stroke={COLOR_LIGHT} strokeWidth={innerStroke}
            strokeLinecap="round"
            strokeDasharray={innerCirc}
            strokeDashoffset={innerOffset}
            opacity={0.4}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-heading text-[26px] font-bold tracking-tight leading-none"
            style={{
              color: ringColor,
              transform: isPulsing ? "scale(1.03)" : "scale(1)",
              transition: "transform 0.2s ease-in-out",
            }}
          >
            {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">equiv.</span>
        </div>
      </div>

      {/* Period */}
      <p className="text-[10px] text-muted-foreground mb-2">{periodLabel}</p>


      {/* Environmental equivalence */}
      {value > 0 && (
        <div className="w-full mt-3 pt-3 border-t group/impact rounded-md px-2 -mx-2 transition-all duration-200 hover:bg-emerald-50/60 hover:shadow-md hover:scale-[1.02] cursor-default" style={{ borderColor: "hsl(var(--border))" }}>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 group-hover/impact:text-emerald-700 transition-colors">
            Impacto ambiental equivalente
          </p>
          <p className="text-[10px] text-foreground group-hover/impact:text-[11px] transition-all">
            <span className="font-bold" style={{ color: COLOR_INTENSE }}>{Math.round(value)}</span> árboles preservados ≈{" "}
            <span className="font-bold" style={{ color: COLOR_INTENSE }}>{co2Absorbed.toLocaleString("es-MX")}</span> kg de CO₂ absorbido/año
          </p>
        </div>
      )}
    </div>
  );
};

export default TreesRingCard;
