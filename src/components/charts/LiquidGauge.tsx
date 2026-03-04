import { useEffect, useState } from "react";

interface LiquidGaugeProps {
  value: number;
  target: number;
  label: string;
  unit: string;
  color: string;
  emoji: string;
  trend?: number;
}

const LiquidGauge = ({ value, target, label, unit, color, emoji, trend }: LiquidGaugeProps) => {
  const [animatedPct, setAnimatedPct] = useState(0);
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(pct), 150);
    return () => clearTimeout(timer);
  }, [pct]);

  const size = 160;
  const r = size / 2;
  const fillY = size - (animatedPct / 100) * size;

  const waveId = `wave-${label.replace(/\s/g, "")}`;
  const clipId = `clip-${label.replace(/\s/g, "")}`;

  return (
    <div className="win-card p-5 flex flex-col items-center justify-center min-h-[320px] hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs font-heading font-bold text-foreground">{label}</span>
      </div>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <clipPath id={clipId}>
              <circle cx={r} cy={r} r={r - 4} />
            </clipPath>
            <linearGradient id={`${waveId}-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.7} />
              <stop offset="100%" stopColor={color} stopOpacity={0.9} />
            </linearGradient>
          </defs>

          {/* Circle border */}
          <circle cx={r} cy={r} r={r - 4} fill="none" stroke={color} strokeWidth="2" opacity={0.2} />
          <circle cx={r} cy={r} r={r - 2} fill="hsl(var(--card))" />

          {/* Liquid fill with wave */}
          <g clipPath={`url(#${clipId})`}>
            {/* Static fill */}
            <rect x={0} y={fillY} width={size} height={size}
              fill={`url(#${waveId}-grad)`}
              style={{ transition: "y 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
            
            {/* Wave 1 */}
            <path
              d={`M0 ${fillY} Q${size * 0.25} ${fillY - 8} ${size * 0.5} ${fillY} T${size} ${fillY} V${size} H0 Z`}
              fill={color} opacity={0.3}
              style={{ transition: "d 1.2s" }}
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
              fill={color} opacity={0.2}
            >
              <animateTransform
                attributeName="transform" type="translate"
                values={`0,0; -${size * 0.08},0; 0,0`}
                dur="2.5s" repeatCount="indefinite"
              />
            </path>

            {/* Reflection */}
            <rect x={size * 0.3} y={fillY + 5} width={size * 0.15} height={size * 0.4}
              rx={8} fill="white" opacity={0.08}
              style={{ transition: "y 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
          </g>
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-[22px] font-bold tracking-tight leading-none"
            style={{ color: animatedPct > 55 ? "white" : color, transition: "color 0.5s", textShadow: animatedPct > 55 ? "0 1px 3px rgba(0,0,0,0.3)" : "none" }}>
            {value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[9px] mt-0.5"
            style={{ color: animatedPct > 55 ? "rgba(255,255,255,0.8)" : "hsl(var(--muted-foreground))", transition: "color 0.5s" }}>
            {unit}
          </span>
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

export default LiquidGauge;
