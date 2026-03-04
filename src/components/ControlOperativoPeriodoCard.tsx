import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MONTHS } from "@/data/materials";

interface Props {
  totalKg: number;
  materialesRegistrados: number;
  materialesTotales: number;
  capturasConfirmadas: number;
  lastUpdated: Date | null;
  currentMonth: number;
  currentYear: number;
}

const useCountUp = (target: number, duration = 1000) => {
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  const raf = useRef<number>();

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = start + diff * eased;
      setValue(current);
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return value;
};

const ControlOperativoPeriodoCard = ({
  totalKg, materialesRegistrados, materialesTotales,
  capturasConfirmadas, lastUpdated, currentMonth, currentYear,
}: Props) => {
  const navigate = useNavigate();
  const [animatedPct, setAnimatedPct] = useState(0);
  const [pulse, setPulse] = useState(false);
  const prevKg = useRef(totalKg);
  const pct = materialesTotales > 0 ? Math.round((materialesRegistrados / materialesTotales) * 100) : 0;
  const animatedKg = useCountUp(totalKg, 1000);

  // Animate radial on mount / data change
  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  // Pulse on kg change
  useEffect(() => {
    if (prevKg.current !== totalKg && prevKg.current > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 700);
      prevKg.current = totalKg;
      return () => clearTimeout(t);
    }
    prevKg.current = totalKg;
  }, [totalKg]);

  // Radial gauge geometry
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;

  const pendientes = materialesTotales - materialesRegistrados;

  const formatTs = (d: Date) => {
    const day = d.getDate().toString().padStart(2, "0");
    const mon = d.toLocaleDateString("es-MX", { month: "short" });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    return `${day} ${mon} ${year} • ${time}`;
  };

  return (
    <div
      className="win-card rounded-xl p-5 bg-card"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-heading font-bold text-[15px] tracking-tight text-foreground">
          CONTROL OPERATIVO DEL PERIODO
        </h3>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          {MONTHS[currentMonth]} {currentYear}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-5">Estado en tiempo real</p>

      {/* Radial Progress */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth}
              opacity={0.25}
            />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="hsl(var(--primary))" strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
                filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.3))",
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-heading text-[26px] font-bold tracking-tight leading-none text-foreground tabular-nums ${
                pulse ? "animate-pulse" : ""
              }`}
            >
              {animatedKg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">KG Totales Capturados</span>
          </div>
        </div>

        {/* Materials registered text */}
        <div className="text-xs text-muted-foreground mt-2">
          Materiales registrados: <span className="font-bold text-foreground">{materialesRegistrados} / {materialesTotales}</span>
        </div>

        {/* Status badge */}
        {materialesRegistrados === 0 ? (
          <div className="mt-2 text-center">
            <p className="text-[11px] text-muted-foreground italic mb-1.5">Aún no hay materiales con registro</p>
            <button
              onClick={() => { /* already on capture */ }}
              className="text-[11px] text-primary font-semibold hover:underline"
            >
              Comenzar captura →
            </button>
          </div>
        ) : materialesRegistrados === materialesTotales ? (
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            ✓ Catálogo completo
          </span>
        ) : pendientes > 0 ? (
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
            Pendientes: {pendientes}
          </span>
        ) : null}
      </div>

      {/* Progress bar — Registro del catálogo */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-foreground">Registro del catálogo</span>
          <span className="text-[11px] text-muted-foreground">
            {materialesRegistrados} activos • {pendientes} pendientes
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary"
            style={{
              width: `${pct}%`,
              transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>

      {/* Micro KPIs — 3 chips */}
      <div
        className="grid grid-cols-1 gap-2 mb-5"
        style={{ animation: "fadeSlideUp 400ms 200ms both" }}
      >
        {[
          {
            icon: "📦",
            label: "Materiales con registro",
            value: `${materialesRegistrados} / ${materialesTotales}`,
          },
          {
            icon: "✅",
            label: "Capturas confirmadas",
            value: `${capturasConfirmadas} / ${materialesTotales}`,
          },
          {
            icon: "🕐",
            label: "Última actualización",
            value: lastUpdated ? formatTs(lastUpdated) : "Sin datos",
          },
        ].map(chip => (
          <div
            key={chip.label}
            className="flex items-center justify-between rounded-lg bg-accent/40 px-3 py-2"
          >
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span>{chip.icon}</span> {chip.label}
            </span>
            <span className="text-[11px] font-bold text-foreground">{chip.value}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/dashboard")}
        className="win-btn-accent w-full h-9 text-[13px] font-semibold"
      >
        📊 Ver Dashboard →
      </button>
    </div>
  );
};

export default ControlOperativoPeriodoCard;
