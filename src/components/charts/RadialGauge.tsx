import { useEffect, useState } from "react";

interface RadialGaugeProps {
  value: number;
  target: number;
  label: string;
  unit: string;
  color: string;
  emoji: string;
  trend?: number;
}

const RadialGauge = ({ value, target, label, unit, color, emoji, trend }: RadialGaugeProps) => {
  const [animatedPct, setAnimatedPct] = useState(0);
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;

  return (
    <div className="win-card p-5 flex flex-col items-center justify-center min-h-[320px] hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs font-heading font-bold text-foreground">{label}</span>
      </div>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth}
            opacity={0.3}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-[28px] font-bold tracking-tight leading-none" style={{ color }}>
            {value.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
          </span>
          <span className="text-[10px] text-muted-foreground mt-1">{unit}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 text-center">
        <div className="text-[11px] text-muted-foreground">
          Meta: {target.toLocaleString("es-MX")} {unit}
        </div>
        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{
            background: pct >= 80 ? "#22c55e20" : pct >= 60 ? "#facc1520" : "#ef444420",
            color: pct >= 80 ? "#22c55e" : pct >= 60 ? "#facc15" : "#ef4444",
          }}>
          {pct.toFixed(0)}% del objetivo
        </span>
        {trend !== undefined && (
          <div className="text-[10px] text-muted-foreground mt-1">
            <span style={{ color: trend >= 0 ? "#22c55e" : "#ef4444" }}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
            </span> vs mes anterior
          </div>
        )}
      </div>
    </div>
  );
};

export default RadialGauge;
