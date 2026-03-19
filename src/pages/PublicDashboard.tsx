import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AggregatedKPIs {
  arboles: number;
  co2: number;
  agua: number;
  energia: number;
  economico: number;
  kg_netos: number;
  kg_brutos: number;
}

const EMPTY: AggregatedKPIs = { arboles: 0, co2: 0, agua: 0, energia: 0, economico: 0, kg_netos: 0, kg_brutos: 0 };

const KPI_CONFIG = [
  { key: "kg_brutos" as const, icon: "♻️", label: "Materias primas reincorporadas", unit: "kg", decimals: 0 },
  { key: "kg_netos" as const, icon: "📦", label: "Volumen recuperado", unit: "kg", decimals: 0 },
  { key: "arboles" as const, icon: "🌳", label: "Árboles preservados", unit: "", decimals: 1 },
  { key: "co2" as const, icon: "🌿", label: "CO₂ evitado", unit: "kg", decimals: 1 },
  { key: "agua" as const, icon: "💧", label: "Agua conservada", unit: "L", decimals: 0 },
  { key: "energia" as const, icon: "⚡", label: "Energía ahorrada", unit: "kWh", decimals: 1 },
  { key: "economico" as const, icon: "💰", label: "Impacto económico", unit: "MXN", decimals: 0, prefix: "$" },
];

const AnimatedNumber = ({ value, decimals, duration = 1200 }: { value: number; decimals: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <>{display.toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
};

const PublicDashboard = () => {
  const [kpis, setKpis] = useState<AggregatedKPIs>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("material_captures")
        .select("kg_brutos, kg_netos, result_arboles, result_co2, result_agua, result_energia, result_economic_impact")
        .eq("is_confirmed", true)
        .eq("year", year);

      if (error || !data) { setLoading(false); return; }

      const agg = data.reduce<AggregatedKPIs>((acc, r) => ({
        arboles: acc.arboles + (r.result_arboles ?? 0),
        co2: acc.co2 + (r.result_co2 ?? 0),
        agua: acc.agua + (r.result_agua ?? 0),
        energia: acc.energia + (r.result_energia ?? 0),
        economico: acc.economico + (r.result_economic_impact ?? 0),
        kg_netos: acc.kg_netos + (r.kg_netos ?? 0),
        kg_brutos: acc.kg_brutos + (r.kg_brutos ?? 0),
      }), EMPTY);

      setKpis(agg);
      setLoading(false);
    };
    fetchData();
  }, [year]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(122,39%,49%)] to-[hsl(122,39%,35%)]">
        <div className="animate-pulse text-white/80 text-sm font-medium">Cargando indicadores…</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[hsl(140,20%,12%)] via-[hsl(135,18%,16%)] to-[hsl(130,15%,10%)] p-3 flex flex-col gap-2 font-[var(--font-body)]">
      {/* Header */}
      <div className="text-center mb-1">
        <h1 className="text-[13px] font-bold text-white/90 tracking-wide uppercase" style={{ fontFamily: "var(--font-heading)" }}>
          Impacto Ambiental {year}
        </h1>
        <div className="w-8 h-[2px] bg-[hsl(122,39%,49%)] mx-auto mt-1 rounded-full" />
      </div>

      {/* KPI Cards */}
      <div className="flex flex-col gap-[6px] flex-1">
        {KPI_CONFIG.map(({ key, icon, label, unit, decimals, prefix }) => (
          <div
            key={key}
            className="rounded-lg px-3 py-[10px] flex items-center gap-3 transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, hsla(0,0%,100%,0.07), hsla(0,0%,100%,0.03))",
              border: "1px solid hsla(0,0%,100%,0.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="text-[20px] flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-white/50 uppercase tracking-wider font-medium leading-tight truncate">
                {label}
              </p>
              <p className="text-[18px] font-bold text-white leading-tight mt-[2px]" style={{ fontFamily: "var(--font-heading)" }}>
                {prefix ?? ""}
                <AnimatedNumber value={kpis[key]} decimals={decimals} />
                {unit && <span className="text-[10px] font-normal text-white/40 ml-1">{unit}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pt-1">
        <p className="text-[8px] text-white/25 uppercase tracking-widest">IRM Group • Reciclaje Industrial</p>
      </div>
    </div>
  );
};

export default PublicDashboard;
