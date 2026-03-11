import { useState, useMemo } from "react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import Navigation from "@/components/Navigation";
import ControlOperativoPeriodoCard from "@/components/ControlOperativoPeriodoCard";
import ShareModal from "@/components/ShareModal";
import RadialGauge from "@/components/charts/RadialGauge";
import AreaChartSVG from "@/components/charts/AreaChartSVG";
import ColumnChart from "@/components/charts/ColumnChart";
import LiquidGauge from "@/components/charts/LiquidGauge";
import FinancialLineChart from "@/components/charts/FinancialLineChart";
import HorizontalBar3D from "@/components/charts/HorizontalBar3D";
import ReincorporatedRidgeline from "@/components/charts/ReincorporatedRidgeline";
import recyclingHero from "@/assets/recycling-hero.png";
import logoImrGris from "@/assets/logo-imr-gris.png";

const Dashboard = () => {
  const { kpiTotals, targets, materialEntries, monthlyHistory, refreshData, lastUpdated, totalKg, currentMonth, currentYear } = useEcoMetrics();
  const [refreshing, setRefreshing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { refreshData(); setRefreshing(false); }, 800);
  };

  const pct = (v: number, t: number) => t > 0 ? Math.min((v / t) * 100, 100) : 0;
  const pctBadge = (p: number) => p >= 80 ? "win-badge-success" : p >= 60 ? "win-badge-warning" : "win-badge-critical";

  // Yield calculations
  const totalKgNetos = useMemo(() =>
    materialEntries.reduce((s, e) => s + e.kg * (e.material.yieldInfo.yield / 100), 0),
    [materialEntries]
  );
  const totalPerdida = totalKg - totalKgNetos;

  const sortedEntries = useMemo(() => {
    if (!sortCol) return materialEntries;
    const sorted = [...materialEntries].sort((a, b) => {
      let va: number, vb: number;
      if (sortCol === "kg") { va = a.kg; vb = b.kg; }
      else if (sortCol === "arboles") { va = a.kpis.arboles; vb = b.kpis.arboles; }
      else if (sortCol === "co2") { va = a.kpis.co2; vb = b.kpis.co2; }
      else if (sortCol === "energia") { va = a.kpis.energia; vb = b.kpis.energia; }
      else if (sortCol === "agua") { va = a.kpis.agua; vb = b.kpis.agua; }
      else if (sortCol === "costo") { va = a.kpis.costo; vb = b.kpis.costo; }
      else { va = 0; vb = 0; }
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return sorted;
  }, [materialEntries, sortCol, sortDir]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const exportCSV = () => {
    const headers = ["#", "Descripción", "Código", "KG Brutos", "Yield %", "KG Netos", "Árboles", "CO₂e kg", "Energía kWh", "Agua L", "Costo $"];
    const rows = materialEntries.map((e, i) => [
      i + 1, e.material.description, e.material.code, e.kg,
      e.material.yieldInfo.yield,
      (e.kg * (e.material.yieldInfo.yield / 100)).toFixed(1),
      e.kpis.arboles.toFixed(2), e.kpis.co2.toFixed(2), e.kpis.energia.toFixed(2),
      e.kpis.agua.toFixed(0), e.kpis.costo.toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ecometrics-export.csv"; a.click();
  };

  const prevMonth = monthlyHistory[monthlyHistory.length - 2];
  const currMonth = monthlyHistory[monthlyHistory.length - 1];

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

      {/* Filter Bar */}
      <div className="bg-filter-bar text-filter-bar-foreground">
        <div className="max-w-7xl mx-auto px-5 h-11 flex items-center gap-3">
          {["Año: 2026", "Mes: Febrero", "Categoría: Todas", "Material: Todos"].map(f => (
            <select key={f} className="win-select !bg-filter-bar-foreground/10 !text-filter-bar-foreground !border-filter-bar-foreground/20 text-xs !min-h-[28px]">
              <option>{f}</option>
            </select>
          ))}
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
          Indicadores calculados sobre kg netos recuperados (kg capturados × yield del material). Fuente de yield: datos técnicos de planta IRM + literatura especializada de reciclaje.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1 */}
          <RadialGauge
            emoji="🌳" label="Árboles Preservados"
            value={kpiTotals.arboles} target={targets.arboles}
            unit="equiv." color="#22C55E"
            trend={prevMonth && currMonth ? ((currMonth.arboles / prevMonth.arboles - 1) * 100) : 0}
          />
          <AreaChartSVG
            emoji="♻️" title="CO₂e Evitado"
            data={monthlyHistory.map(h => ({ label: h.month, value: h.co2 }))}
            lineColor="#16A34A" areaColor="#22C55E" unit="kg CO₂"
            trend={prevMonth && currMonth ? ((currMonth.co2 / prevMonth.co2 - 1) * 100) : 0}
          />
          <ColumnChart
            emoji="⚡" title="Energía Ahorrada"
            data={monthlyHistory.map(h => ({ label: h.month, value: h.energia }))}
            color="#FACC15" unit="kWh"
            trend={prevMonth && currMonth ? ((currMonth.energia / prevMonth.energia - 1) * 100) : 0}
          />
          {/* Row 2 */}
          <LiquidGauge
            emoji="💧" label="Agua Conservada"
            value={kpiTotals.agua} target={targets.agua}
            unit="Litros" color="#38BDF8"
            trend={prevMonth && currMonth ? ((currMonth.agua / prevMonth.agua - 1) * 100) : 0}
          />
          <FinancialLineChart
            emoji="💰" title="Impacto Económico en la Comunidad"
            data={monthlyHistory.map(h => ({ label: h.month, value: h.costo }))}
            color="#9333EA" unit="MXN"
            trend={prevMonth && currMonth ? ((currMonth.costo / prevMonth.costo - 1) * 100) : 0}
          />
          <HorizontalBar3D
            emoji="📦" title="Materiales Reciclados Recuperados"
            segments={materialEntries
              .filter(e => e.kg > 0)
              .sort((a, b) => b.kg - a.kg)
              .slice(0, 8)
              .map((e, i) => ({
                label: e.material.code,
                value: e.kg,
                color: ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"][i % 8],
              }))}
            unit="kg totales"
          />
          {/* Row 3 */}
          <ReincorporatedRidgeline />
          <div className="lg:col-span-2">
            <ControlOperativoPeriodoCard
              totalKg={totalKg}
              totalKgNetos={totalKgNetos}
              totalPerdida={totalPerdida}
              materialesRegistrados={materialEntries.filter(e => e.kg > 0).length}
              materialesTotales={materialEntries.length}
              capturasConfirmadas={0}
              lastUpdated={lastUpdated}
              currentMonth={currentMonth}
              currentYear={currentYear}
              variant="fullwidth"
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-4 px-1 border-l-2 border-primary/40 pl-3">
          📐 Indicadores calculados sobre kg netos recuperados (kg capturados × yield del material).
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
                    { key: "", label: "Descripción" },
                    { key: "", label: "Código" },
                    { key: "kg", label: "KG Brutos" },
                    { key: "", label: "Yield %" },
                    { key: "", label: "KG Netos" },
                    { key: "arboles", label: "🌳 Árboles" },
                    { key: "co2", label: "♻️ CO₂e kg" },
                    { key: "energia", label: "⚡ Energía kWh" },
                    { key: "agua", label: "💧 Agua L" },
                    { key: "costo", label: "💰 Costo $" },
                    { key: "", label: "📦 Mat. Primas" },
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
                {sortedEntries.map((e, i) => {
                  const kgNetos = e.kg * (e.material.yieldInfo.yield / 100);
                  return (
                    <tr
                      key={e.material.code}
                      className={`transition-colors duration-100 hover:bg-accent/50 ${
                        i % 2 === 0 ? "bg-card" : "bg-accent/20"
                      } ${e.kg > 0 ? "border-l-[3px] border-l-primary" : ""}`}
                    >
                      <td className="px-3 py-2 text-muted-foreground">{e.material.id}</td>
                      <td className="px-3 py-2 font-medium">{e.material.description}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{e.material.code}</td>
                      <td className="px-3 py-2 font-semibold">{e.kg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                      <td className="px-3 py-2 text-muted-foreground font-medium">{e.material.yieldInfo.yield}%</td>
                      <td className="px-3 py-2 font-medium text-muted-foreground/80">
                        {kgNetos > 0 ? kgNetos.toLocaleString("es-MX", { maximumFractionDigits: 1 }) : "—"}
                      </td>
                      <td className="px-3 py-2">{e.kpis.arboles > 0 ? e.kpis.arboles.toFixed(1) : <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-2">{e.kpis.co2 > 0 ? e.kpis.co2.toFixed(2) : <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-2">{e.kpis.energia > 0 ? e.kpis.energia.toFixed(1) : <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-2">{e.kpis.agua > 0 ? e.kpis.agua.toFixed(0) : <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-2">${e.kpis.costo.toFixed(2)}</td>
                      <td className="px-3 py-2 text-muted-foreground group relative">
                        —
                        <span className="hidden group-hover:block absolute -top-7 left-0 win-tooltip whitespace-nowrap z-10">Próximamente</span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-secondary font-bold" style={{ color: "hsl(var(--kpi-trees))" }}>
                  <td className="px-3 py-2.5" colSpan={3}>TOTALES</td>
                  <td className="px-3 py-2.5">{totalKg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                  <td className="px-3 py-2.5">—</td>
                  <td className="px-3 py-2.5">{totalKgNetos.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                  <td className="px-3 py-2.5">{kpiTotals.arboles.toFixed(1)}</td>
                  <td className="px-3 py-2.5">{kpiTotals.co2.toFixed(2)}</td>
                  <td className="px-3 py-2.5">{kpiTotals.energia.toFixed(1)}</td>
                  <td className="px-3 py-2.5">{kpiTotals.agua.toFixed(0)}</td>
                  <td className="px-3 py-2.5">${kpiTotals.costo.toFixed(2)}</td>
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