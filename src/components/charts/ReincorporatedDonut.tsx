import { useLoopAnimation } from "@/hooks/useLoopAnimation";

const ReincorporatedDonut = () => {
  const totalRecuperado = 9776;
  const reincorporado = 8420;
  const pendiente = 1356;
  const pct = (reincorporado / totalRecuperado) * 100;

  const { displayValue, progress, isPulsing } = useLoopAnimation({ targetValue: reincorporado });

  const size = 170;
  const r = 62;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * r;

  const greenLen = circumference * (pct / 100) * progress;
  const grayLen = circumference - greenLen;

  return (
    <div className="win-card p-5 min-h-[320px] hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏭</span>
        <span className="text-xs font-heading font-bold">Materiales Recuperados Reincorporados a la Industria</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background track */}
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              opacity={0.5}
            />
            {/* Green — reincorporado */}
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke="hsl(var(--kpi-trees))"
              strokeWidth={strokeWidth}
              strokeDasharray={`${greenLen} ${circumference}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.3s ease" }}
            />
            {/* Gray — pendiente */}
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke="hsl(var(--muted-foreground) / 0.25)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${grayLen} ${circumference}`}
              strokeDashoffset={circumference * 0.25 - greenLen}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.3s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
            <span
              className="font-heading text-[20px] font-bold tracking-tight leading-none text-foreground"
              style={{ transform: isPulsing ? "scale(1.03)" : "scale(1)", transition: "transform 0.2s" }}
            >
              {displayValue.toLocaleString("es-MX", { maximumFractionDigits: 0 })} kg
            </span>
            <span className="text-[8px] text-muted-foreground mt-0.5 leading-tight">
              Material reincorporado<br />a industria
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: "hsl(var(--kpi-trees))" }} />
            <span className="text-foreground font-medium">Reincorporado</span>
            <span className="text-muted-foreground ml-auto">{reincorporado.toLocaleString("es-MX")} kg</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0 bg-muted-foreground/25" />
            <span className="text-foreground font-medium">Pendiente</span>
            <span className="text-muted-foreground ml-auto">{pendiente.toLocaleString("es-MX")} kg</span>
          </div>
          <div className="mt-2 text-[12px] font-semibold text-foreground">
            <span style={{ color: "hsl(var(--kpi-trees))" }}>{pct.toFixed(0)}%</span>{" "}
            <span className="text-muted-foreground font-normal text-[11px]">
              del material recuperado ha sido reincorporado a procesos industriales
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground/60 text-center leading-relaxed">
        Indicador que refleja la proporción de materiales recuperados que han sido reintegrados a procesos productivos industriales.
      </p>
    </div>
  );
};

export default ReincorporatedDonut;
