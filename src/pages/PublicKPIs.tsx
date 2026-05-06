import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

type KpiKey = "trees" | "co2" | "energy" | "water" | "economic" | "volume" | "reincorporation";

const KPI_OPTIONS: { key: KpiKey; label: string; emoji: string }[] = [
  { key: "trees", label: "Árboles", emoji: "🌳" },
  { key: "co2", label: "CO₂ Evitado", emoji: "♻️" },
  { key: "energy", label: "Energía", emoji: "⚡" },
  { key: "water", label: "Agua", emoji: "💧" },
  { key: "economic", label: "Económico", emoji: "💰" },
  { key: "volume", label: "Volumen", emoji: "📦" },
  { key: "reincorporation", label: "Reincorporación", emoji: "🏭" },
];

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
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#1a2d1a" }}>
      <img src={logoImrGris} alt="EcoMetrics" className="h-20 w-auto mb-8 opacity-90" />
      <form onSubmit={e => { e.preventDefault(); if (pin.trim()) onSubmit(pin.trim()); }} className="w-full max-w-xs px-4">
        <div className="rounded-xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 className="text-white/90 text-center font-semibold text-sm tracking-wide">Código de acceso</h2>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Ingresa tu código" autoFocus
            className="w-full px-4 py-2.5 rounded-lg text-sm text-center tracking-widest font-mono"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none" }} />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button type="submit" disabled={loading || !pin.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ background: "#22C55E", color: "#fff" }}>
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
};

const PublicKPIs = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token");
  const [stage, setStage] = useState<"checking-token" | "pin-required" | "checking-pin" | "valid" | "invalid">("checking-token");
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenParam) { setStage("invalid"); return; }
    (async () => {
      const { data, error } = await supabase.rpc("validate_public_token", { _token: tokenParam });
      if (!error && data === true) {
        const { data: pinOk, error: pinErr } = await supabase.rpc("validate_public_token_with_pin", { _token: tokenParam, _pin: "" });
        if (!pinErr && pinOk === true) setStage("valid");
        else setStage("pin-required");
      } else setStage("invalid");
    })();
  }, [tokenParam]);

  const handlePinSubmit = async (pin: string) => {
    setPinError(null);
    setStage("checking-pin");
    const { data, error } = await supabase.rpc("validate_public_token_with_pin" as any, { _token: tokenParam!, _pin: pin });
    if (!error && data === true) setStage("valid");
    else { setPinError("Código incorrecto, intenta de nuevo"); setStage("pin-required"); }
  };

  if (stage === "checking-token")
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#1a2d1a" }}><span className="text-white/60">Verificando acceso…</span></div>;
  if (stage === "invalid") return <SuspendedScreen />;
  if (stage === "pin-required" || stage === "checking-pin")
    return <PinScreen onSubmit={handlePinSubmit} error={pinError} loading={stage === "checking-pin"} />;

  return <KPIsContent token={tokenParam!} initialKpis={searchParams.get("kpis")} />;
};

const KPIsContent = ({ token, initialKpis }: { token: string; initialKpis: string | null }) => {
  const {
    dashYear, setDashYear, selectedMonths, toggleMonth, clearSelection, isAllMonths,
    confirmedTotals: totals, confirmedEntries,
    monthlyEconomic, allMonthsEconomic,
    monthlyCo2, allMonthsCo2,
    monthlyEnergia, allMonthsEnergia,
    monthlyArboles, allMonthsArboles,
    monthlyAgua,
    monthlyKgNetos, allMonthsKgNetos,
    loading, lastUpdated, catalogLoading,
  } = usePublicDashboardFilter(token);

  const initialSet = new Set<KpiKey>(
    (initialKpis?.split(",").filter(Boolean) as KpiKey[] | undefined)?.length
      ? (initialKpis!.split(",") as KpiKey[])
      : KPI_OPTIONS.map(o => o.key)
  );
  const [visible, setVisible] = useState<Set<KpiKey>>(initialSet);

  const toggle = (k: KpiKey) => {
    setVisible(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) { /* noop */ }
  };

  const periodLabel = isAllMonths ? `Acumulado ${dashYear}` : selectedMonths!.map(m => MONTHS[m - 1]).join(", ") + ` ${dashYear}`;

  if (catalogLoading || loading)
    return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Cargando indicadores…</span></div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, hsl(120 30% 82% / 0.5), hsl(90 25% 86% / 0.5))",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <img src={acLogo} alt="" className="absolute right-[120px] top-1/2 -translate-y-1/2 h-[85%] object-contain object-right" style={{ width: "22%", opacity: 0.95 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, hsl(120 30% 82%) 35%, hsl(120 30% 82% / 0.6) 50%, transparent 75%)" }} />
        </div>
        <div className="max-w-7xl mx-auto px-5 py-5 flex items-center gap-6 relative z-10">
          <img src={logoImrGris} alt="IRM Circular Intelligence" className="h-20 w-auto object-contain" />
          <div className="flex-1 text-center" style={{ transform: "translateX(-120px)" }}>
            <h1 className="font-heading text-[28px] font-bold text-foreground tracking-tight uppercase">IRM CIRCULAR INTELLIGENCE.</h1>
          </div>
        </div>
      </section>

      {/* Months */}
      <div className="bg-filter-bar text-filter-bar-foreground">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-4">
          <div className="flex gap-0.5 bg-filter-bar-foreground/10 rounded-lg p-0.5">
            {MONTHS.map((m, i) => {
              const monthNum = i + 1;
              const isActive = isAllMonths || (selectedMonths?.includes(monthNum) ?? false);
              return (
                <button key={m} onClick={() => toggleMonth(monthNum)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-filter-bar-foreground/60 hover:text-filter-bar-foreground hover:bg-filter-bar-foreground/15"}`}>
                  {m}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-0.5 bg-filter-bar-foreground/10 rounded-lg p-0.5">
            <button onClick={() => setDashYear(dashYear - 1)} className="px-2 py-1 text-xs rounded-md text-filter-bar-foreground/80 hover:bg-filter-bar-foreground/15">−</button>
            <span className="px-3 py-1 text-sm font-semibold text-filter-bar-foreground">{dashYear}</span>
            <button onClick={() => setDashYear(dashYear + 1)} className="px-2 py-1 text-xs rounded-md text-filter-bar-foreground/80 hover:bg-filter-bar-foreground/15">+</button>
          </div>
          {!isAllMonths && (
            <button onClick={clearSelection} className="px-3 py-1.5 rounded-md text-xs font-medium bg-filter-bar-foreground/10 text-filter-bar-foreground/80 hover:bg-filter-bar-foreground/20">
              ✕ Limpiar selección
            </button>
          )}
          <span className="ml-auto text-xs text-filter-bar-foreground/70 font-medium">{periodLabel}</span>
        </div>
      </div>

      {/* Dynamic KPI visibility chips */}
      <div className="max-w-7xl mx-auto px-5 pt-4">
        <div className="win-card p-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-2">Mostrar:</span>
          {KPI_OPTIONS.map(o => {
            const active = visible.has(o.key);
            return (
              <button key={o.key} onClick={() => toggle(o.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-transparent text-muted-foreground border-border hover:bg-accent"}`}>
                <span className="mr-1">{o.emoji}</span>{o.label}
              </button>
            );
          })}
          <button onClick={() => setVisible(new Set(KPI_OPTIONS.map(o => o.key)))}
            className="ml-auto text-[11px] text-primary font-medium hover:underline">Mostrar todos</button>
          <button onClick={() => setVisible(new Set())}
            className="text-[11px] text-muted-foreground font-medium hover:underline">Ocultar todos</button>
          <button onClick={toggleFullscreen}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            className="ml-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-all">
            {isFullscreen ? "🗗 Salir" : "⛶ Pantalla completa"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <section className="max-w-7xl mx-auto px-5 mb-7 mt-4">
        <h2 className="font-heading text-lg font-bold tracking-tight mb-1">📊 Indicadores Clave de Impacto</h2>
        <p className="text-[10px] text-muted-foreground italic mb-3">
          Indicadores consolidados de capturas confirmadas ({periodLabel}). Base de cálculo: kg netos.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.has("trees") && (
            <TreesRingCard value={totals.arboles} target={800} monthlyData={monthlyArboles} allMonthsData={allMonthsArboles} periodLabel={periodLabel} dashYear={dashYear} />
          )}
          {visible.has("co2") && (
            <CO2ImpactCard total={totals.co2} monthlyData={monthlyCo2} allMonthsData={allMonthsCo2} periodLabel={periodLabel} dashYear={dashYear}
              topMaterials={confirmedEntries.filter(e => e.kpis.co2 > 0).sort((a, b) => b.kpis.co2 - a.kpis.co2).slice(0, 3).map(e => ({ name: e.material.name, co2: e.kpis.co2 }))} />
          )}
          {visible.has("energy") && (
            <EnergyWaveCard total={totals.energia} monthlyData={monthlyEnergia} allMonthsData={allMonthsEnergia} periodLabel={periodLabel} dashYear={dashYear}
              topMaterials={confirmedEntries.filter(e => e.kpis.energia > 0).sort((a, b) => b.kpis.energia - a.kpis.energia).slice(0, 3).map(e => ({ name: e.material.name, energia: e.kpis.energia }))} />
          )}
          {visible.has("water") && (
            <WaterLiquidCard value={totals.agua} monthlyData={monthlyAgua} periodLabel={periodLabel} dashYear={dashYear}
              confirmedEntries={confirmedEntries.map(e => ({ materialName: e.material.name, agua: e.kpis.agua, kgBrutos: e.kg }))}
              lastUpdated={lastUpdated} />
          )}
          {visible.has("economic") && (
            <EconomicImpactCard total={totals.economicImpact} monthlyData={monthlyEconomic} allMonthsData={allMonthsEconomic} periodLabel={periodLabel} color="#9333EA" dashYear={dashYear}
              topMaterials={confirmedEntries.filter(e => e.kpis.economic_impact > 0).sort((a, b) => b.kpis.economic_impact - a.kpis.economic_impact).slice(0, 3)
                .map((e, i) => ({ name: e.material.name, value: e.kpis.economic_impact, color: ["#22C55E", "#3B82F6", "#F59E0B"][i % 3] }))} />
          )}
          {visible.has("volume") && (
            <HorizontalBar3D emoji="📦" title="Volumen Total de Material Recuperado"
              segments={confirmedEntries.sort((a, b) => b.kg - a.kg).slice(0, 8).map((e, i) => ({
                label: e.material.code, value: e.kg, color: ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"][i % 8],
              }))}
              extraSegments={confirmedEntries.sort((a, b) => b.kg - a.kg).slice(8).map(e => ({ label: e.material.code, value: e.kg, color: "#94A3B8" }))}
              unit="kg totales" />
          )}
          {visible.has("reincorporation") && (
            <div className="lg:col-span-3">
              <HeroReincorporacionIndustriaCard
                totalKgBrutos={totals.kgBrutos} totalKgNetos={totals.kgNetos} confirmedEntries={confirmedEntries}
                monthlyKgNetos={monthlyKgNetos} allMonthsKgNetos={allMonthsKgNetos}
                lastUpdated={lastUpdated} periodLabel={periodLabel} dashYear={dashYear} />
            </div>
          )}
          {visible.size === 0 && (
            <div className="lg:col-span-3 text-center py-16 text-muted-foreground text-sm">
              Selecciona al menos un indicador para visualizar.
            </div>
          )}
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-5 pb-10 pt-4">
        <p className="text-[10px] leading-relaxed text-muted-foreground/60 text-center max-w-4xl mx-auto">
          Los factores de conversión utilizados se basan en metodologías reconocidas internacionalmente (GHG Protocol, EPA WARM v16).
        </p>
      </footer>
    </div>
  );
};

export default PublicKPIs;
