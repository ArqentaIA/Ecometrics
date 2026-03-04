import { useState, useMemo } from "react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import Navigation from "@/components/Navigation";
import HorizontalBarChart from "@/components/HorizontalBarChart";
import MiniLineChart from "@/components/MiniLineChart";
import ShareModal from "@/components/ShareModal";

const Dashboard = () => {
  const { kpiTotals, targets, materialEntries, monthlyHistory, refreshData, lastUpdated, totalKg } = useEcoMetrics();
  const [refreshing, setRefreshing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { refreshData(); setRefreshing(false); }, 800);
  };

  const pct = (v: number, t: number) => t > 0 ? Math.min((v / t) * 100, 100) : 0;
  const pctClass = (p: number) => p >= 80 ? "bg-primary/20 text-kpi-trees" : p >= 60 ? "bg-kpi-energy/20 text-kpi-energy" : "bg-destructive/20 text-destructive";

  const kpiCards = [
    { emoji: "🌳", label: "Árboles Preservados", value: kpiTotals.arboles, target: targets.arboles, unit: "equiv.", color: "var(--kpi-trees)", key: "arboles" },
    { emoji: "♻️", label: "CO₂e kG Evitado", value: kpiTotals.co2, target: targets.co2, unit: "kg", color: "var(--kpi-co2)", key: "co2" },
    { emoji: "⚡", label: "Energía Ahorrada", value: kpiTotals.energia, target: targets.energia, unit: "kWh", color: "var(--kpi-energy)", key: "energia" },
    { emoji: "💧", label: "Agua Conservada", value: kpiTotals.agua, target: targets.agua, unit: "Litros", color: "var(--kpi-water)", key: "agua" },
    { emoji: "💰", label: "Costo Evitado", value: kpiTotals.costo, target: targets.costo, unit: "$ pesos", color: "var(--kpi-cost)", key: "costo" },
    { emoji: "📦", label: "Mat. Primas Regeneradas", value: 0, target: 0, unit: "", color: "var(--kpi-materials)", key: "materiasPrimas", disabled: true },
  ];

  const chartConfigs = [
    { emoji: "🌳", title: "Árboles Preservados por Material", key: "arboles" as const, gradient: ["#2e7d32", "#66bb6a"] },
    { emoji: "♻️", title: "CO₂e kG Evitado por Material", key: "co2" as const, gradient: ["#d32f2f", "#ef9a9a"] },
    { emoji: "⚡", title: "Energía Ahorrada kWh por Material", key: "energia" as const, gradient: ["#f57f17", "#ffcc80"] },
    { emoji: "💧", title: "Agua Conservada Litros por Material", key: "agua" as const, gradient: ["#1565c0", "#90caf9"] },
    { emoji: "💰", title: "Costo Evitado por Material", key: "costo" as const, gradient: ["#6a1b9a", "#ce93d8"] },
  ];

  const trendConfigs = [
    { emoji: "🌳", title: "Árboles Preservados", key: "arboles" as const, color: "#2e7d32" },
    { emoji: "♻️", title: "CO₂e Evitado", key: "co2" as const, color: "#d32f2f" },
    { emoji: "⚡", title: "Energía Ahorrada", key: "energia" as const, color: "#f57f17" },
    { emoji: "💧", title: "Agua Conservada", key: "agua" as const, color: "#1565c0" },
    { emoji: "💰", title: "Costo Evitado", key: "costo" as const, color: "#6a1b9a" },
  ];

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
    const headers = ["#", "Descripción", "Código", "KG", "Árboles", "CO₂e kg", "Energía kWh", "Agua L", "Costo $"];
    const rows = materialEntries.map((e, i) => [
      i + 1, e.material.description, e.material.code, e.kg,
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
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #c8e6c9, #dcedc8)" }}>
        <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-between flex-wrap gap-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">MES DE FEBRERO 2026</h1>
            <p className="text-sm text-muted-foreground mt-1">Resumen de impacto ambiental acumulado</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              { emoji: "🌳", label: "Árboles", val: kpiTotals.arboles.toFixed(1) },
              { emoji: "♻️", label: "CO₂e", val: `${kpiTotals.co2.toFixed(1)} kg` },
              { emoji: "💧", label: "Agua", val: `${kpiTotals.agua.toFixed(0)} L` },
            ].map(p => (
              <div key={p.label} className="acrylic-strong rounded-xl px-5 py-3 text-center">
                <span className="text-xl">{p.emoji}</span>
                <div className="font-heading font-bold text-lg">{p.val}</div>
                <div className="text-xs text-muted-foreground">{p.label}</div>
              </div>
            ))}
          </div>
          {/* SVG illustration */}
          <svg viewBox="0 0 200 120" className="w-48 h-28 hidden lg:block" fill="none">
            <path d="M0 100 Q50 60 100 80 T200 70 V120 H0Z" fill="#a5d6a7" opacity="0.5" />
            <path d="M0 110 Q80 80 160 95 T200 90 V120 H0Z" fill="#c8e6c9" opacity="0.6" />
            <polygon points="40,90 50,50 60,90" fill="#1a3a1a" />
            <polygon points="70,85 80,40 90,85" fill="#2e7d32" />
            <polygon points="55,88 65,55 75,88" fill="#4caf50" />
            <rect x="130" y="60" width="3" height="30" fill="#666" />
            <circle cx="131" cy="55" r="8" fill="none" stroke="#4caf50" strokeWidth="1.5" />
            <line x1="131" y1="55" x2="139" y2="52" stroke="#4caf50" strokeWidth="1" />
            <line x1="131" y1="55" x2="137" y2="60" stroke="#4caf50" strokeWidth="1" />
            <line x1="131" y1="55" x2="135" y2="48" stroke="#4caf50" strokeWidth="1" />
            <rect x="155" y="70" width="3" height="20" fill="#666" />
            <circle cx="156" cy="65" r="7" fill="none" stroke="#4caf50" strokeWidth="1.5" />
            <line x1="156" y1="65" x2="163" y2="63" stroke="#4caf50" strokeWidth="1" />
            <line x1="156" y1="65" x2="161" y2="69" stroke="#4caf50" strokeWidth="1" />
          </svg>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="bg-filter-bar text-filter-bar-foreground">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-4">
          {["Año: 2025", "Mes: Febrero", "Categoría: Todas", "Material: Todos"].map(f => (
            <select key={f} className="bg-filter-bar-foreground/10 border-none rounded-md text-xs text-filter-bar-foreground px-3 py-1.5">
              <option>{f}</option>
            </select>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">🕐 Última actualización: {lastUpdated.toLocaleTimeString("es-MX")}</span>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="fluent-btn-outline text-xs">
            {refreshing ? <span className="inline-block w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin-slow" /> : "🔄"} Actualizar Datos
          </button>
          <button onClick={exportCSV} className="fluent-btn-outline text-xs">📤 Exportar CSV</button>
          <button onClick={() => setShareOpen(true)} className="fluent-btn-outline text-xs">🔗 Compartir Dashboard</button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards.map(k => {
            const p = pct(k.value, k.target);
            const trend = prevMonth && currMonth ? ((currMonth[k.key as keyof typeof currMonth] as number) / (prevMonth[k.key as keyof typeof prevMonth] as number) - 1) * 100 : 0;
            return (
              <div key={k.key} className={`fluent-card p-5 relative ${k.disabled ? "opacity-40" : ""}`}>
                {k.disabled && (
                  <span className="absolute top-3 right-3 bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium">Próximamente</span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${k.color}20` }}>
                    {k.emoji}
                  </div>
                  <span className="text-xs text-muted-foreground">{k.label}</span>
                </div>
                <div className="font-heading text-3xl font-bold mb-1">
                  {k.disabled ? "—" : k.value.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">{k.unit}</span>
                </div>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 ${pctClass(p)}`}>
                  {p.toFixed(0)}% DEL OBJETIVO
                </span>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, background: k.color }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0</span>
                  <span>Meta {k.target.toLocaleString()} {k.unit}</span>
                </div>
                {!k.disabled && (
                  <div className="text-[10px] text-muted-foreground mt-1 text-right">
                    {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs mes anterior
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Ranking Charts */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <h2 className="font-heading text-xl font-bold mb-4">📊 Ranking de Materiales por Indicador</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chartConfigs.map(c => (
            <HorizontalBarChart
              key={c.key}
              title={`${c.emoji} ${c.title}`}
              data={materialEntries.map(e => ({ name: e.material.code, value: e.kpis[c.key] }))}
              gradient={c.gradient as [string, string]}
            />
          ))}
          {/* Disabled card */}
          <div className="fluent-card p-5 opacity-40 flex flex-col items-center justify-center relative min-h-[300px]">
            <span className="absolute top-3 right-3 bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium">Próximamente</span>
            <span className="text-4xl mb-3">📦</span>
            <p className="text-sm text-muted-foreground text-center">Fórmula de conversión próximamente disponible</p>
          </div>
        </div>
      </section>

      {/* Monthly Trends */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <h2 className="font-heading text-xl font-bold mb-4">📈 Tendencia Mensual — Todos los Indicadores</h2>
        <div className="fluent-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trendConfigs.map(tc => (
              <MiniLineChart
                key={tc.key}
                title={`${tc.emoji} ${tc.title}`}
                data={monthlyHistory.map(h => ({ label: h.month, value: h[tc.key] }))}
                color={tc.color}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Material Detail Table */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold">📋 Detalle Completo por Material</h2>
          <button onClick={exportCSV} className="fluent-btn-outline text-xs">📤 Exportar CSV</button>
        </div>
        <div className="fluent-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-nav text-nav-foreground">
                  {[
                    { key: "", label: "#" },
                    { key: "", label: "Descripción" },
                    { key: "", label: "Código" },
                    { key: "kg", label: "KG Capturado" },
                    { key: "arboles", label: "🌳 Árboles" },
                    { key: "co2", label: "♻️ CO₂e kg" },
                    { key: "energia", label: "⚡ Energía kWh" },
                    { key: "agua", label: "💧 Agua L" },
                    { key: "costo", label: "💰 Costo $" },
                    { key: "", label: "📦 Mat. Primas" },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`px-3 py-2.5 text-left text-xs font-medium ${col.key ? "cursor-pointer hover:bg-nav-foreground/10" : ""}`}
                      onClick={() => col.key && toggleSort(col.key)}
                    >
                      {col.label}
                      {sortCol === col.key && <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((e, i) => (
                  <tr
                    key={e.material.code}
                    className={`${i % 2 === 0 ? "bg-card" : "bg-secondary/20"} ${e.kg > 0 ? "border-l-[3px] border-l-primary" : ""}`}
                  >
                    <td className="px-3 py-2">{e.material.id}</td>
                    <td className="px-3 py-2 font-medium">{e.material.description}</td>
                    <td className="px-3 py-2 text-muted-foreground">{e.material.code}</td>
                    <td className="px-3 py-2 font-medium">{e.kg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                    <td className="px-3 py-2">{e.kpis.arboles > 0 ? e.kpis.arboles.toFixed(2) : "—"}</td>
                    <td className="px-3 py-2">{e.kpis.co2 > 0 ? e.kpis.co2.toFixed(2) : "—"}</td>
                    <td className="px-3 py-2">{e.kpis.energia > 0 ? e.kpis.energia.toFixed(2) : "—"}</td>
                    <td className="px-3 py-2">{e.kpis.agua > 0 ? e.kpis.agua.toFixed(0) : "—"}</td>
                    <td className="px-3 py-2">${e.kpis.costo.toFixed(2)}</td>
                    <td className="px-3 py-2 text-muted-foreground group relative">
                      —
                      <span className="hidden group-hover:block absolute -top-6 left-0 bg-foreground text-card text-[10px] px-2 py-0.5 rounded whitespace-nowrap">Próximamente</span>
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-secondary font-bold text-primary">
                  <td className="px-3 py-2" colSpan={3}>TOTALES</td>
                  <td className="px-3 py-2">{totalKg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                  <td className="px-3 py-2">{kpiTotals.arboles.toFixed(2)}</td>
                  <td className="px-3 py-2">{kpiTotals.co2.toFixed(2)}</td>
                  <td className="px-3 py-2">{kpiTotals.energia.toFixed(2)}</td>
                  <td className="px-3 py-2">{kpiTotals.agua.toFixed(0)}</td>
                  <td className="px-3 py-2">${kpiTotals.costo.toFixed(2)}</td>
                  <td className="px-3 py-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </div>
  );
};

export default Dashboard;
