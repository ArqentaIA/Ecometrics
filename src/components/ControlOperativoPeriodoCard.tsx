import { useNavigate } from "react-router-dom";
import { MONTHS } from "@/data/materials";
import { useLoopAnimation } from "@/hooks/useLoopAnimation";

interface Props {
  totalKg: number;
  totalKgNetos?: number;
  totalPerdida?: number;
  materialesRegistrados: number;
  materialesTotales: number;
  capturasConfirmadas: number;
  lastUpdated: Date | null;
  currentMonth: number;
  currentYear: number;
  variant?: "sidebar" | "fullwidth";
}

const ControlOperativoPeriodoCard = ({
  totalKg, totalKgNetos = 0, totalPerdida = 0, materialesRegistrados, materialesTotales,
  capturasConfirmadas, lastUpdated, currentMonth, currentYear,
  variant = "sidebar",
}: Props) => {
  const navigate = useNavigate();
  const pct = materialesTotales > 0 ? Math.round((materialesRegistrados / materialesTotales) * 100) : 0;
  const pendientes = materialesTotales - materialesRegistrados;
  const isFullWidth = variant === "fullwidth";

  const { displayValue: animatedKg, progress: kgProgress, isPulsing } = useLoopAnimation({ targetValue: totalKg });
  const { progress: pctProgress } = useLoopAnimation({ targetValue: pct });

  const animatedPct = pctProgress * pct;

  const gaugeSize = isFullWidth ? 220 : 180;
  const strokeWidth = isFullWidth ? 16 : 14;
  const radius = (gaugeSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;

  const formatTs = (d: Date) => {
    const day = d.getDate().toString().padStart(2, "0");
    const mon = d.toLocaleDateString("es-MX", { month: "short" });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    return `${day} ${mon} ${year} • ${time}`;
  };

  return (
    <div
      className={`win-card rounded-xl bg-card ${isFullWidth ? "p-7" : "p-5"}`}
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className={`font-heading font-bold tracking-tight text-foreground ${isFullWidth ? "text-lg" : "text-[15px]"}`}>
          CONTROL OPERATIVO DEL PERIODO
        </h3>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(11,61,145,0.12)", color: "#0B3D91" }}>
          {MONTHS[currentMonth]} {currentYear}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-5">Estado en tiempo real</p>

      <div className={isFullWidth ? "flex gap-8 items-start" : ""}>
        {/* Left: Radial */}
        <div className={`flex flex-col items-center ${isFullWidth ? "shrink-0" : "mb-5"}`}>
          <div className="relative" style={{ width: gaugeSize, height: gaugeSize }}>
            <svg width={gaugeSize} height={gaugeSize} className="transform -rotate-90">
              <circle
                cx={gaugeSize / 2} cy={gaugeSize / 2} r={radius}
                fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth}
                opacity={0.25}
              />
              <circle
                cx={gaugeSize / 2} cy={gaugeSize / 2} r={radius}
                fill="none" stroke="#0B3D91" strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ filter: "drop-shadow(0 0 8px rgba(11,61,145,0.3))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`font-heading font-bold tracking-tight leading-none text-foreground tabular-nums ${
                  isFullWidth ? "text-[32px]" : "text-[26px]"
                }`}
                style={{
                  transform: isPulsing ? "scale(1.03)" : "scale(1)",
                  transition: "transform 0.2s ease-in-out",
                }}
              >
                {animatedKg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1">KG Totales Capturados</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            Materiales registrados: <span className="font-bold text-foreground">{materialesRegistrados} / {materialesTotales}</span>
          </div>

          {materialesRegistrados === 0 ? (
            <div className="mt-2 text-center">
              <p className="text-[11px] text-muted-foreground italic mb-1.5">Aún no hay materiales con registro</p>
              <button onClick={() => navigate("/capture")} className="text-[11px] text-primary font-semibold hover:underline">
                Ir a Captura →
              </button>
            </div>
          ) : materialesRegistrados === materialesTotales ? (
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: "#0B3D91", background: "rgba(11,61,145,0.12)" }}>
              ✓ Catálogo completo
            </span>
          ) : pendientes > 0 ? (
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
              Pendientes: {pendientes}
            </span>
          ) : null}
        </div>

        {/* Right: Details */}
        <div className={isFullWidth ? "flex-1 min-w-0" : ""}>
          {/* Progress bar */}
          <div className={isFullWidth ? "mb-6" : "mb-5 mt-0"}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-foreground">Registro del catálogo</span>
              <span className="text-[11px] text-muted-foreground">
                {materialesRegistrados} activos • {pendientes} pendientes
              </span>
            </div>
            <div className={`rounded-full bg-muted/40 overflow-hidden ${isFullWidth ? "h-3" : "h-2"}`}>
              <div
                className="h-full rounded-full"
                style={{ width: `${animatedPct}%`, background: "#0B3D91" }}
              />
            </div>
          </div>

          {/* Micro KPIs */}
          <div className={`gap-2 ${isFullWidth ? "grid grid-cols-3" : "grid grid-cols-1"}`}>
            {[
              { icon: "📦", label: "Materiales con registro", value: `${materialesRegistrados} / ${materialesTotales}` },
              { icon: "✅", label: "Capturas confirmadas", value: `${capturasConfirmadas} / ${materialesTotales}` },
              { icon: "🕐", label: "Última actualización", value: lastUpdated ? formatTs(lastUpdated) : "Sin datos" },
            ].map(chip => (
              <div key={chip.label} className={`flex items-center justify-between rounded-lg bg-accent/40 px-3 ${isFullWidth ? "py-3" : "py-2"}`}>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span>{chip.icon}</span> {chip.label}
                </span>
                <span className="text-[11px] font-bold text-foreground">{chip.value}</span>
              </div>
            ))}
          </div>

          {/* Pérdida Estimada por Proceso */}
          <div className="mt-4 rounded-lg px-4 py-3" style={{ background: "rgba(11,61,145,0.06)", border: "1px solid rgba(11,61,145,0.12)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <span>⚠️</span> Pérdida Estimada por Proceso
              </span>
              <span className="text-sm font-bold tabular-nums" style={{ color: "#0B3D91" }}>
                {totalPerdida.toLocaleString("es-MX", { maximumFractionDigits: 1 })} kg
              </span>
            </div>
            <div className="mt-1.5 text-[10px] text-muted-foreground">
              {totalKg.toLocaleString("es-MX", { maximumFractionDigits: 1 })} kg brutos − {totalKgNetos.toLocaleString("es-MX", { maximumFractionDigits: 1 })} kg netos = {totalPerdida.toLocaleString("es-MX", { maximumFractionDigits: 1 })} kg de pérdida estimada
            </div>
          </div>

          {!isFullWidth && (
            <button onClick={() => navigate("/dashboard")} className="win-btn-accent w-full h-9 text-[13px] font-semibold mt-5">
              📊 Ver Dashboard →
            </button>
          )}
          {isFullWidth && (
            <button onClick={() => navigate("/capture")} className="win-btn-accent h-9 text-[13px] font-semibold mt-5 px-6">
              📋 Ir a Captura de Datos →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlOperativoPeriodoCard;