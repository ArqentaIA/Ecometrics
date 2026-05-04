import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePublicDashboardFilter } from "@/hooks/usePublicDashboardFilter";
import HeroReincorporacionIndustriaCard from "@/components/HeroReincorporacionIndustriaCard";
import TreesRingCard from "@/components/charts/TreesRingCard";
import CO2ImpactCard from "@/components/charts/CO2ImpactCard";
import EnergyWaveCard from "@/components/charts/EnergyWaveCard";
import WaterLiquidCard from "@/components/charts/WaterLiquidCard";
import EconomicImpactCard from "@/components/charts/EconomicImpactCard";
import HorizontalBar3D from "@/components/charts/HorizontalBar3D";

import acLogo from "@/assets/logo-ac-recicladores.png";
import logoImrGris from "@/assets/logo-imr-gris.png";
import { formatKPI } from "@/lib/calculationEngine";
import { supabase } from "@/integrations/supabase/client";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const SuspendedScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#1a2d1a" }}>
    <img src={logoImrGris} alt="EcoMetrics" className="h-24 w-auto mb-8 opacity-90" />
    <p className="text-white/80 text-lg text-center max-w-md px-6 font-medium">
      Servicio temporalmente suspendido. Contacta a tu proveedor.
    </p>
  </div>
);

const PinScreen = ({ onSubmit, error, loading }: { onSubmit: (pin: string) => void; error: string | null; loading: boolean }) => {
  const [pin, setPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim()) onSubmit(pin.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#1a2d1a" }}>
      <img src={logoImrGris} alt="EcoMetrics" className="h-20 w-auto mb-8 opacity-90" />
      <form onSubmit={handleSubmit} className="w-full max-w-xs px-4">
        <div className="rounded-xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 className="text-white/90 text-center font-semibold text-sm tracking-wide">Código de acceso</h2>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="Ingresa tu código"
            autoFocus
            className="w-full px-4 py-2.5 rounded-lg text-sm text-center tracking-widest font-mono"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none" }}
          />
          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ background: "#22C55E", color: "#fff" }}
          >
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
};

const PublicDashboard = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token");

  // States: checking-token → checking if token exists & is active
  // pin-required → token is active, ask for PIN
  // checking-pin → validating PIN
  // valid → show dashboard
  // invalid → suspended screen
  const [stage, setStage] = useState<"checking-token" | "pin-required" | "checking-pin" | "valid" | "invalid">("checking-token");
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenParam) {
      setStage("invalid");
      return;
    }
    const checkToken = async () => {
      // First check if token exists and is active
      const { data, error } = await supabase.rpc("validate_public_token", { _token: tokenParam });
      if (!error && data === true) {
        // Try auto-login with empty PIN (no-PIN tokens)
        const { data: pinOk, error: pinErr } = await supabase.rpc("validate_public_token_with_pin", { _token: tokenParam, _pin: "" });
        console.log("AUTO_PIN_CHECK", { pinOk, pinErr });
        if (!pinErr && pinOk === true) {
          setStage("valid");
        } else {
          setStage("pin-required");
        }
      } else {
        setStage("invalid");
      }
    };
    checkToken();
  }, [tokenParam]);

  const handlePinSubmit = async (pin: string) => {
    setPinError(null);
    setStage("checking-pin");
    const { data, error } = await supabase.rpc("validate_public_token_with_pin" as any, { _token: tokenParam!, _pin: pin });
    if (!error && data === true) {
      setStage("valid");
    } else {
      setPinError("Código incorrecto, intenta de nuevo");
      setStage("pin-required");
    }
  };

  if (stage === "checking-token") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1a2d1a" }}>
        <span className="text-white/60">Verificando acceso…</span>
      </div>
    );
  }

  if (stage === "invalid") {
    return <SuspendedScreen />;
  }

  if (stage === "pin-required" || stage === "checking-pin") {
    return <PinScreen onSubmit={handlePinSubmit} error={pinError} loading={stage === "checking-pin"} />;
  }

  return <PublicDashboardContent />;
};

const PublicDashboardContent = () => {
  const {
    dashYear, setDashYear,
    selectedMonths, toggleMonth, clearSelection, isAllMonths,
    confirmedTotals: totals,
    materialEntries, confirmedEntries,
    monthlyEconomic, allMonthsEconomic,
    monthlyCo2, allMonthsCo2,
    monthlyEnergia, allMonthsEnergia,
    monthlyArboles, allMonthsArboles,
    monthlyAgua, allMonthsAgua,
    monthlyKgNetos, allMonthsKgNetos,
    loading, lastUpdated, catalogLoading,
  } = usePublicDashboardFilter();

  const periodLabel = isAllMonths
    ? `Acumulado ${dashYear}`
    : selectedMonths!.map(m => MONTHS[m - 1]).join(", ") + ` ${dashYear}`;

  const sortedEntries = useMemo(() => {
    return [...materialEntries].filter(e => e.isConfirmed && e.kg > 0);
  }, [materialEntries]);

  if (catalogLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Cargando indicadores…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, hsl(120 30% 82% / 0.5), hsl(90 25% 86% / 0.5))",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <img src={acLogo} alt="" className="absolute right-[120px] top-1/2 -translate-y-1/2 h-[85%] object-contain object-right" style={{ width: "22%", opacity: 0.95 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, hsl(120 30% 82%) 35%, hsl(120 30% 82% / 0.6) 50%, transparent 75%)" }} />
        </div>
        <div className="max-w-7xl mx-auto px-5 py-5 flex items-center gap-6 relative z-10">
          <img src={logoImrGris} alt="IRM Group" className="h-20 w-auto object-contain" />
          <div className="mr-[30%] ml-auto text-right">
            <h1 className="font-heading text-[28px] font-bold text-foreground tracking-tight uppercase">Resumen de Impacto Ambiental Acumulado</h1>
          </div>
        </div>
      </section>

      {/* Month Multi-Select Filter Bar */}
      <div className="bg-filter-bar text-filter-bar-foreground">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-4">
          <div className="flex gap-0.5 bg-filter-bar-foreground/10 rounded-lg p-0.5">
            {MONTHS.map((m, i) => {
              const monthNum = i + 1;
              const isActive = isAllMonths || (selectedMonths?.includes(monthNum) ?? false);
              return (
                <button
                  key={m}
                  onClick={() => toggleMonth(monthNum)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-filter-bar-foreground/60 hover:text-filter-bar-foreground hover:bg-filter-bar-foreground/15"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-0.5 bg-filter-bar-foreground/10 rounded-lg p-0.5">
            <button onClick={() => setDashYear(dashYear - 1)}
              className="px-2 py-1 text-xs rounded-md text-filter-bar-foreground/80 hover:bg-filter-bar-foreground/15 transition-colors">−</button>
            <span className="px-3 py-1 text-sm font-semibold text-filter-bar-foreground">{dashYear}</span>
            <button onClick={() => setDashYear(dashYear + 1)}
              className="px-2 py-1 text-xs rounded-md text-filter-bar-foreground/80 hover:bg-filter-bar-foreground/15 transition-colors">+</button>
          </div>

          {!isAllMonths && (
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-filter-bar-foreground/10 text-filter-bar-foreground/80 hover:bg-filter-bar-foreground/20 hover:text-filter-bar-foreground transition-all duration-150"
            >
              ✕ Limpiar selección
            </button>
          )}

          <span className="ml-auto text-xs text-filter-bar-foreground/70 font-medium">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* Sync status (read-only, no action buttons) */}
      <div className="max-w-7xl mx-auto px-5 py-3">
        <div className="px-4 py-3 inline-block" style={{ borderRadius: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", background: "linear-gradient(135deg, #1C1F26, #2A2E38)" }}>
          <div className="flex items-center gap-2.5 mb-1.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow" style={{ animationDuration: "4s" }}>
              <path d="M21.5 2v6h-6M2.5 22v-6h6" />
              <path d="M2.5 11.5a10 10 0 0 1 16.5-6L21.5 8M21.5 12.5a10 10 0 0 1-16.5 6L2.5 16" />
            </svg>
            <span className="font-heading font-semibold text-sm" style={{ color: "#F1F3F6" }}>Sistema sincronizado</span>
          </div>
          <p className="text-[13px] ml-[30px]" style={{ color: "#F1F3F6", opacity: 0.7 }}>
            {lastUpdated.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })} • {lastUpdated.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <div className="mt-2.5 ml-[30px] h-[3px] rounded-full overflow-hidden relative" style={{ background: "rgba(0,230,118,0.15)" }}>
            <div className="sync-scan-bar" style={{ background: "#00E676" }} />
          </div>
          <div className="flex items-center gap-1.5 mt-2 ml-[30px]">
            <span className="inline-block w-2 h-2 rounded-full sync-pulse" style={{ background: "#00E676" }} />
            <span className="text-[11px]" style={{ color: "#F1F3F6", opacity: 0.6 }}>Verificación automática de datos</span>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <section className="max-w-7xl mx-auto px-5 mb-7">
        <h2 className="font-heading text-lg font-bold tracking-tight mb-1">📊 Indicadores Clave de Impacto</h2>
        <p className="text-[10px] text-muted-foreground italic mb-3">
          Indicadores consolidados de capturas confirmadas ({periodLabel}). Base de cálculo: kg netos (kg capturados × yield del material).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TreesRingCard
            value={totals.arboles}
            target={800}
            monthlyData={monthlyArboles}
            allMonthsData={allMonthsArboles}
            periodLabel={periodLabel}
            dashYear={dashYear}
          />
          <CO2ImpactCard
            total={totals.co2}
            monthlyData={monthlyCo2}
            allMonthsData={allMonthsCo2}
            periodLabel={periodLabel}
            dashYear={dashYear}
            topMaterials={confirmedEntries
              .filter(e => e.kpis.co2 > 0)
              .sort((a, b) => b.kpis.co2 - a.kpis.co2)
              .slice(0, 3)
              .map(e => ({ name: e.material.name, co2: e.kpis.co2 }))}
          />
          <EnergyWaveCard
            total={totals.energia}
            monthlyData={monthlyEnergia}
            allMonthsData={allMonthsEnergia}
            periodLabel={periodLabel}
            dashYear={dashYear}
            topMaterials={confirmedEntries
              .filter(e => e.kpis.energia > 0)
              .sort((a, b) => b.kpis.energia - a.kpis.energia)
              .slice(0, 3)
              .map(e => ({ name: e.material.name, energia: e.kpis.energia }))}
          />
          <WaterLiquidCard
            value={totals.agua}
            monthlyData={monthlyAgua}
            periodLabel={periodLabel}
            dashYear={dashYear}
            confirmedEntries={confirmedEntries.map(e => ({
              materialName: e.material.name,
              agua: e.kpis.agua,
              kgBrutos: e.kg,
            }))}
            lastUpdated={lastUpdated}
          />
          <EconomicImpactCard
            total={totals.economicImpact}
            monthlyData={monthlyEconomic}
            allMonthsData={allMonthsEconomic}
            periodLabel={periodLabel}
            color="#9333EA"
            dashYear={dashYear}
            topMaterials={confirmedEntries
              .filter(e => e.kpis.economic_impact > 0)
              .sort((a, b) => b.kpis.economic_impact - a.kpis.economic_impact)
              .slice(0, 3)
              .map((e, i) => ({
                name: e.material.name,
                value: e.kpis.economic_impact,
                color: ["#22C55E", "#3B82F6", "#F59E0B"][i % 3],
              }))}
          />
          <HorizontalBar3D
            emoji="📦" title="Volumen Total de Material Recuperado"
            segments={confirmedEntries
              .sort((a, b) => b.kg - a.kg)
              .slice(0, 8)
              .map((e, i) => ({
                label: e.material.code,
                value: e.kg,
                color: ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"][i % 8],
              }))}
            extraSegments={confirmedEntries
              .sort((a, b) => b.kg - a.kg)
              .slice(8)
              .map(e => ({ label: e.material.code, value: e.kg, color: "#94A3B8" }))}
            unit="kg totales"
          />

          <div className="lg:col-span-3">
            <HeroReincorporacionIndustriaCard
              totalKgBrutos={totals.kgBrutos}
              totalKgNetos={totals.kgNetos}
              confirmedEntries={confirmedEntries}
              monthlyKgNetos={monthlyKgNetos}
              allMonthsKgNetos={allMonthsKgNetos}
              lastUpdated={lastUpdated}
              periodLabel={periodLabel}
              dashYear={dashYear}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-4 px-1 border-l-2 border-primary/40 pl-3">
          📐 Indicadores calculados sobre kg netos recuperados (kg capturados × yield del material). Solo capturas confirmadas.
        </p>
      </section>

      {/* Material Detail Table (read-only, no export button) */}
      <section className="max-w-7xl mx-auto px-5 mb-12">
        <h2 className="font-heading text-lg font-bold tracking-tight mb-3">📋 Detalle Completo por Material</h2>
        <div className="win-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-nav text-nav-foreground">
                  {["#", "Material", "Código", "KG Brutos", "Yield %", "KG Netos", "🌳 Árboles", "♻️ CO₂e kg", "⚡ Energía kWh", "💧 Agua L", "Estado"].map(label => (
                    <th key={label} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((e, i) => (
                  <tr
                    key={e.material.code}
                    className={`transition-colors duration-100 hover:bg-accent/50 ${i % 2 === 0 ? "bg-card" : "bg-accent/20"} border-l-[3px] border-l-primary`}
                  >
                    <td className="px-3 py-2 text-muted-foreground">{e.material.display_order}</td>
                    <td className="px-3 py-2 font-medium">{e.material.name}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{e.material.code}</td>
                    <td className="px-3 py-2 font-semibold">{formatKPI("kg_brutos", e.kg)}</td>
                    <td className="px-3 py-2 text-muted-foreground font-medium">{e.material.default_yield}%</td>
                    <td className="px-3 py-2 font-medium text-muted-foreground/80">
                      {e.kpis.kg_netos > 0 ? formatKPI("kg_netos", e.kpis.kg_netos) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {e.kpis.uses_arboles && e.kpis.arboles > 0 ? formatKPI("arboles", e.kpis.arboles) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {e.kpis.uses_co2 && e.kpis.co2 > 0 ? formatKPI("co2", e.kpis.co2) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {e.kpis.uses_energia && e.kpis.energia > 0 ? formatKPI("energia", e.kpis.energia) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {e.kpis.uses_agua && e.kpis.agua > 0 ? formatKPI("agua", e.kpis.agua) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-primary font-medium">✓ Confirmado</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-secondary font-bold" style={{ color: "hsl(var(--kpi-trees))" }}>
                  <td className="px-3 py-2.5" colSpan={3}>TOTALES (Confirmados)</td>
                  <td className="px-3 py-2.5">{formatKPI("kg_brutos", totals.kgBrutos)}</td>
                  <td className="px-3 py-2.5">—</td>
                  <td className="px-3 py-2.5">{formatKPI("kg_netos", totals.kgNetos)}</td>
                  <td className="px-3 py-2.5">{formatKPI("arboles", totals.arboles)}</td>
                  <td className="px-3 py-2.5">{formatKPI("co2", totals.co2)}</td>
                  <td className="px-3 py-2.5">{formatKPI("energia", totals.energia)}</td>
                  <td className="px-3 py-2.5">{formatKPI("agua", totals.agua)}</td>
                  <td className="px-3 py-2.5">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Methodology disclaimer */}
      <footer className="max-w-7xl mx-auto px-5 pb-10 pt-4">
        <p className="text-[10px] leading-relaxed text-muted-foreground/60 text-center max-w-4xl mx-auto">
          Los factores de conversión utilizados se basan en metodologías y referencias técnicas reconocidas internacionalmente, como el GHG Protocol, la EPA Waste Reduction Model (WARM) v16 (diciembre 2023) y literatura especializada del sector de reciclaje, lo que permite estimar de forma consistente y verificable los impactos ambientales asociados a la recuperación de materiales.
        </p>
      </footer>
    </div>
  );
};

export default PublicDashboard;
