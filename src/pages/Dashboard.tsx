import { useState, useMemo } from "react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import { useDashboardFilter } from "@/hooks/useDashboardFilter";
import Navigation from "@/components/Navigation";
import ControlOperativoPeriodoCard from "@/components/ControlOperativoPeriodoCard";
import ShareModal from "@/components/ShareModal";
import RadialGauge from "@/components/charts/RadialGauge";
import AreaChartSVG from "@/components/charts/AreaChartSVG";
import ColumnChart from "@/components/charts/ColumnChart";
import LiquidGauge from "@/components/charts/LiquidGauge";
import EconomicImpactCard from "@/components/charts/EconomicImpactCard";
import HorizontalBar3D from "@/components/charts/HorizontalBar3D";
import ReincorporatedRidgeline from "@/components/charts/ReincorporatedRidgeline";
import recyclingHero from "@/assets/recycling-hero.png";
import logoImrGris from "@/assets/logo-imr-gris.png";
import { formatKPI } from "@/lib/calculationEngine";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const Dashboard = () => {
  const { currentMonth, currentYear } = useEcoMetrics();

  const {
    dashYear, setDashYear,
    selectedMonths, toggleMonth, clearSelection, isAllMonths,
    confirmedTotals: totals,
    materialEntries, confirmedEntries, monthlyEconomic, allMonthsEconomic,
    loading, lastUpdated, refreshData, catalogLoading,
  } = useDashboardFilter();

  const [refreshing, setRefreshing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { refreshData(); setRefreshing(false); }, 800);
  };

  const sortedEntries = useMemo(() => {
    const entries = [...materialEntries];
    if (!sortCol) return entries;
    return entries.sort((a, b) => {
      let va: number, vb: number;
      if (sortCol === "kg") { va = a.kg; vb = b.kg; }
      else if (sortCol === "arboles") { va = a.kpis.arboles; vb = b.kpis.arboles; }
      else if (sortCol === "co2") { va = a.kpis.co2; vb = b.kpis.co2; }
      else if (sortCol === "energia") { va = a.kpis.energia; vb = b.kpis.energia; }
      else if (sortCol === "agua") { va = a.kpis.agua; vb = b.kpis.agua; }
      else { va = 0; vb = 0; }
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [materialEntries, sortCol, sortDir]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const exportCSV = () => {
    const headers = ["#", "Material", "Código", "KG Brutos", "Yield %", "KG Netos", "Árboles", "CO₂e kg", "Energía kWh", "Agua L"];
    const rows = materialEntries.map((e, i) => [
      i + 1, e.material.name, e.material.code, e.kg,
      e.material.default_yield,
      formatKPI("kg_netos", e.kpis.kg_netos),
      formatKPI("arboles", e.kpis.arboles),
      formatKPI("co2", e.kpis.co2),
      formatKPI("energia", e.kpis.energia),
      formatKPI("agua", e.kpis.agua),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ecometrics-export.csv"; a.click();
  };

  // Period label for display
  const periodLabel = isAllMonths
    ? `Acumulado ${dashYear}`
    : selectedMonths!.map(m => MONTHS[m - 1]).join(", ") + ` ${dashYear}`;

  if (catalogLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Cargando catálogo…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation showBell />

      {/* Hero Banner */}
      <section className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, hsl(120 30% 82% / 0.5), hsl(90 25% 86% / 0.5))",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <img src={recyclingHero} alt="" className="absolute right-0 top-0 h-full object-cover object-right" style={{ width: "25%", opacity: 0.7 }} />
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
          {/* Month toggles */}
          <div className="flex gap-0.5 bg-filter-bar-foreground/10 rounded-lg p-0.5">
            {MONTHS.map((m, i) => {
              const monthNum = i + 1; // DB months are 1-based
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

          {/* Year selector */}
          <div className="flex items-center gap-0.5 bg-filter-bar-foreground/10 rounded-lg p-0.5">
            <button onClick={() => setDashYear(dashYear - 1)}
              className="px-2 py-1 text-xs rounded-md text-filter-bar-foreground/80 hover:bg-filter-bar-foreground/15 transition-colors">−</button>
            <span className="px-3 py-1 text-sm font-semibold text-filter-bar-foreground">{dashYear}</span>
            <button onClick={() => setDashYear(dashYear + 1)}
              className="px-2 py-1 text-xs rounded-md text-filter-bar-foreground/80 hover:bg-filter-bar-foreground/15 transition-colors">+</button>
          </div>

          {/* Clear selection button */}
          {!isAllMonths && (
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-filter-bar-foreground/10 text-filter-bar-foreground/80 hover:bg-filter-bar-foreground/20 hover:text-filter-bar-foreground transition-all duration-150"
            >
              ✕ Limpiar selección
            </button>
          )}

          {/* Period label */}
          <span className="ml-auto text-xs text-filter-bar-foreground/70 font-medium">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="px-4 py-3 min-w-[260px]" style={{ borderRadius: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", background: "linear-gradient(135deg, #1C1F26, #2A2E38)" }}>
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

        <div className="flex gap-1.5">
          <button onClick={handleRefresh} disabled={refreshing} className="win-btn-standard text-xs">
            {refreshing ? <span className="inline-block w-3.5 h-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin-slow" /> : "🔄"} Actualizar Datos
          </button>
          <button onClick={exportCSV} className="win-btn-standard text-xs">📤 Exportar CSV</button>
          <button onClick={() => setShareOpen(true)} className="win-btn-standard text-xs">🔗 Compartir</button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <section className="max-w-7xl mx-auto px-5 mb-7">
        <h2 className="font-heading text-lg font-bold tracking-tight mb-1">📊 Indicadores Clave de Impacto</h2>
        <p className="text-[10px] text-muted-foreground italic mb-3">
          Indicadores consolidados de capturas confirmadas ({periodLabel}). Base de cálculo: kg netos (kg capturados × yield del material).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RadialGauge
            emoji="🌳" label="Árboles Preservados"
            value={totals.arboles} target={800}
            unit="equiv." color="#22C55E"
            trend={0}
          />
          <AreaChartSVG
            emoji="♻️" title="CO₂e Evitado"
            data={[{ label: "Actual", value: totals.co2 }]}
            lineColor="#16A34A" areaColor="#22C55E" unit="kg CO₂"
            trend={0}
          />
          <ColumnChart
            emoji="⚡" title="Energía Ahorrada"
            data={[{ label: "Actual", value: totals.energia }]}
            color="#FACC15" unit="kWh"
            trend={0}
          />
          <LiquidGauge
            emoji="💧" label="Agua Conservada"
            value={totals.agua} target={230000}
            unit="Litros" color="#38BDF8"
            trend={0}
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
            emoji="📦" title="Materiales Reciclados Recuperados"
            segments={confirmedEntries
              .sort((a, b) => b.kg - a.kg)
              .slice(0, 8)
              .map((e, i) => ({
                label: e.material.code,
                value: e.kg,
                color: ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"][i % 8],
              }))}
            unit="kg totales"
          />
          <ReincorporatedRidgeline />
          <div className="lg:col-span-2">
            <ControlOperativoPeriodoCard
              totalKg={totals.kgBrutos}
              totalKgNetos={totals.kgNetos}
              totalPerdida={totals.kgBrutos - totals.kgNetos}
              materialesRegistrados={confirmedEntries.length}
              materialesTotales={materialEntries.length}
              capturasConfirmadas={confirmedEntries.length}
              lastUpdated={lastUpdated}
              currentMonth={currentMonth}
              currentYear={dashYear}
              variant="fullwidth"
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-4 px-1 border-l-2 border-primary/40 pl-3">
          📐 Indicadores calculados sobre kg netos recuperados (kg capturados × yield del material). Solo capturas confirmadas.
        </p>
      </section>

      {/* Material Detail Table */}
      <section className="max-w-7xl mx-auto px-5 mb-12">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-bold tracking-tight">📋 Detalle Completo por Material</h2>
          <button onClick={exportCSV} className="win-btn-standard text-xs">📤 Exportar CSV</button>
        </div>
        <div className="win-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-nav text-nav-foreground">
                  {[
                    { key: "", label: "#" },
                    { key: "", label: "Material" },
                    { key: "", label: "Código" },
                    { key: "kg", label: "KG Brutos" },
                    { key: "", label: "Yield %" },
                    { key: "", label: "KG Netos" },
                    { key: "arboles", label: "🌳 Árboles" },
                    { key: "co2", label: "♻️ CO₂e kg" },
                    { key: "energia", label: "⚡ Energía kWh" },
                    { key: "agua", label: "💧 Agua L" },
                    { key: "", label: "Estado" },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider ${col.key ? "cursor-pointer hover:bg-nav-foreground/10 select-none" : ""}`}
                      onClick={() => col.key && toggleSort(col.key)}
                    >
                      {col.label}
                      {sortCol === col.key && <span className="ml-1 text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((e, i) => (
                  <tr
                    key={e.material.code}
                    className={`transition-colors duration-100 hover:bg-accent/50 ${
                      i % 2 === 0 ? "bg-card" : "bg-accent/20"
                    } ${e.isConfirmed ? "border-l-[3px] border-l-primary" : ""}`}
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
                      {e.kpis.uses_arboles && e.kpis.arboles > 0
                        ? formatKPI("arboles", e.kpis.arboles)
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {e.kpis.uses_co2 && e.kpis.co2 > 0
                        ? formatKPI("co2", e.kpis.co2)
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {e.kpis.uses_energia && e.kpis.energia > 0
                        ? formatKPI("energia", e.kpis.energia)
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {e.kpis.uses_agua && e.kpis.agua > 0
                        ? formatKPI("agua", e.kpis.agua)
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {e.isConfirmed
                        ? <span className="text-xs text-primary font-medium">✓ Confirmado</span>
                        : e.kg > 0
                          ? <span className="text-xs text-amber-500 font-medium">⏳ Pendiente</span>
                          : <span className="text-xs text-muted-foreground">—</span>}
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

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </div>
  );
};

export default Dashboard;
