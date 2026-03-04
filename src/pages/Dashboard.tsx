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
  const pctBadge = (p: number) => p >= 80 ? "win-badge-success" : p >= 60 ? "win-badge-warning" : "win-badge-critical";

  const kpiCards = [
    { emoji: "🌳", label: "Árboles Preservados", value: kpiTotals.arboles, target: targets.arboles, unit: "equiv.", color: "hsl(var(--kpi-trees))", key: "arboles" },
    { emoji: "♻️", label: "CO₂e kG Evitado", value: kpiTotals.co2, target: targets.co2, unit: "kg", color: "hsl(var(--kpi-co2))", key: "co2" },
    { emoji: "⚡", label: "Energía Ahorrada", value: kpiTotals.energia, target: targets.energia, unit: "kWh", color: "hsl(var(--kpi-energy))", key: "energia" },
    { emoji: "💧", label: "Agua Conservada", value: kpiTotals.agua, target: targets.agua, unit: "Litros", color: "hsl(var(--kpi-water))", key: "agua" },
    { emoji: "💰", label: "Costo Evitado", value: kpiTotals.costo, target: targets.costo, unit: "$ pesos", color: "hsl(var(--kpi-cost))", key: "costo" },
    { emoji: "📦", label: "Mat. Primas Regeneradas", value: 0, target: 0, unit: "", color: "hsl(var(--kpi-materials))", key: "materiasPrimas", disabled: true },
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

      {/* Hero Banner — Windows 11 Settings header style */}
      <section className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, hsl(120 30% 82% / 0.5), hsl(90 25% 86% / 0.5))",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
      }}>
        <div className="max-w-7xl mx-auto px-5 py-7 flex items-center justify-between flex-wrap gap-5">
          <div>
            <h1 className="font-heading text-[26px] font-bold text-foreground tracking-tight">MES DE FEBRERO 2026</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Resumen de impacto ambiental acumulado</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { emoji: "🌳", label: "Árboles", val: kpiTotals.arboles.toFixed(1) },
              { emoji: "♻️", label: "CO₂e", val: `${kpiTotals.co2.toFixed(1)} kg` },
              { emoji: "💧", label: "Agua", val: `${kpiTotals.agua.toFixed(0)} L` },
            ].map(p => (
              <div key={p.label} className="win-acrylic rounded-lg px-4 py-2.5 text-center min-w-[100px]">
                <span className="text-lg">{p.emoji}</span>
                <div className="font-heading font-bold text-base tracking-tight">{p.val}</div>
                <div className="text-[10px] text-muted-foreground">{p.label}</div>
              </div>
            ))}
          </div>
          {/* SVG landscape illustration */}
          <svg viewBox="0 0 200 120" className="w-44 h-24 hidden lg:block opacity-60" fill="none">
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

      {/* Filter Bar — Windows 11 CommandBar style */}
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
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">🕐 Última actualización: {lastUpdated.toLocaleTimeString("es-MX")}</span>
        <div className="flex gap-1.5">
          <button onClick={handleRefresh} disabled={refreshing} className="win-btn-standard text-xs">
            {refreshing ? <span className="inline-block w-3.5 h-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin-slow" /> : "🔄"} Actualizar Datos
          </button>
          <button onClick={exportCSV} className="win-btn-standard text-xs">📤 Exportar CSV</button>
          <button onClick={() => setShareOpen(true)} className="win-btn-standard text-xs">🔗 Compartir</button>
        </div>
      </div>

      {/* KPI Cards — Windows 11 Settings card style */}
      <section className="max-w-7xl mx-auto px-5 mb-7">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {kpiCards.map(k => {
            const p = pct(k.value, k.target);
            const trend = prevMonth && currMonth ? ((currMonth[k.key as keyof typeof currMonth] as number) / (prevMonth[k.key as keyof typeof prevMonth] as number) - 1) * 100 : 0;
            return (
              <div key={k.key} className={`win-card win-card-interactive p-5 relative ${k.disabled ? "opacity-35 pointer-events-none" : ""}`}>
                {k.disabled && (
                  <span className="absolute top-3 right-3 win-badge win-badge-info text-[10px]">Próximamente</span>
                )}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ background: `${k.color}15` }}>
                    {k.emoji}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{k.label}</span>
                </div>
                <div className="font-heading text-[32px] font-bold tracking-tight leading-none mb-1.5">
                  {k.disabled ? "—" : k.value.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">{k.unit}</span>
                </div>
                <span className={`win-badge ${pctBadge(p)} mb-2`}>
                  {p.toFixed(0)}% DEL OBJETIVO
                </span>
                <div className="win-progress mt-2 mb-1.5">
                  <div className="win-progress-fill" style={{ width: `${p}%`, background: k.color }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0</span>
                  <span>Meta {k.target.toLocaleString()} {k.unit}</span>
                </div>
                {!k.disabled && (
                  <div className="text-[10px] text-muted-foreground mt-2 text-right">
                    <span style={{ color: trend >= 0 ? "hsl(var(--kpi-trees))" : "hsl(var(--destructive))" }}>
                      {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
                    </span> vs mes anterior
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Ranking Charts */}
      <section className="max-w-7xl mx-auto px-5 mb-7">
        <h2 className="font-heading text-lg font-bold tracking-tight mb-3">📊 Ranking de Materiales por Indicador</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {chartConfigs.map(c => (
            <HorizontalBarChart
              key={c.key}
              title={`${c.emoji} ${c.title}`}
              data={materialEntries.map(e => ({ name: e.material.code, value: e.kpis[c.key] }))}
              gradient={c.gradient as [string, string]}
            />
          ))}
          <div className="win-card p-5 opacity-35 flex flex-col items-center justify-center relative min-h-[300px]">
            <span className="absolute top-3 right-3 win-badge win-badge-info text-[10px]">Próximamente</span>
            <span className="text-4xl mb-3">📦</span>
            <p className="text-xs text-muted-foreground text-center">Fórmula de conversión próximamente disponible</p>
          </div>
        </div>
      </section>

      {/* Monthly Trends */}
      <section className="max-w-7xl mx-auto px-5 mb-7">
        <h2 className="font-heading text-lg font-bold tracking-tight mb-3">📈 Tendencia Mensual — Todos los Indicadores</h2>
        <div className="win-card p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

      {/* Material Detail Table — Windows 11 DataGrid */}
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
                    } ${e.kg > 0 ? "border-l-[3px] border-l-primary" : ""}`}
                  >
                    <td className="px-3 py-2 text-muted-foreground">{e.material.id}</td>
                    <td className="px-3 py-2 font-medium">{e.material.description}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{e.material.code}</td>
                    <td className="px-3 py-2 font-semibold">{e.kg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                    <td className="px-3 py-2">{e.kpis.arboles > 0 ? e.kpis.arboles.toFixed(2) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2">{e.kpis.co2 > 0 ? e.kpis.co2.toFixed(2) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2">{e.kpis.energia > 0 ? e.kpis.energia.toFixed(2) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2">{e.kpis.agua > 0 ? e.kpis.agua.toFixed(0) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2">${e.kpis.costo.toFixed(2)}</td>
                    <td className="px-3 py-2 text-muted-foreground group relative">
                      —
                      <span className="hidden group-hover:block absolute -top-7 left-0 win-tooltip whitespace-nowrap z-10">Próximamente</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-secondary font-bold" style={{ color: "hsl(var(--kpi-trees))" }}>
                  <td className="px-3 py-2.5" colSpan={3}>TOTALES</td>
                  <td className="px-3 py-2.5">{totalKg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                  <td className="px-3 py-2.5">{kpiTotals.arboles.toFixed(2)}</td>
                  <td className="px-3 py-2.5">{kpiTotals.co2.toFixed(2)}</td>
                  <td className="px-3 py-2.5">{kpiTotals.energia.toFixed(2)}</td>
                  <td className="px-3 py-2.5">{kpiTotals.agua.toFixed(0)}</td>
                  <td className="px-3 py-2.5">${kpiTotals.costo.toFixed(2)}</td>
                  <td className="px-3 py-2.5">—</td>
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
