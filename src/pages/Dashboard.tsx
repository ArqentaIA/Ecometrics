import { useState, useMemo, useCallback } from "react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import { supabase } from "@/integrations/supabase/client";
import ReportModal from "@/components/ReportModal";
import { useDashboardFilter } from "@/hooks/useDashboardFilter";
import DualPeriodBadge from "@/components/DualPeriodBadge";
import Navigation from "@/components/Navigation";
import HeroReincorporacionIndustriaCard from "@/components/HeroReincorporacionIndustriaCard";
import ShareModal from "@/components/ShareModal";
import TreesRingCard from "@/components/charts/TreesRingCard";
import CO2ImpactCard from "@/components/charts/CO2ImpactCard";
import EnergyWaveCard from "@/components/charts/EnergyWaveCard";
import WaterLiquidCard from "@/components/charts/WaterLiquidCard";
import EconomicImpactCard from "@/components/charts/EconomicImpactCard";
import HorizontalBar3D from "@/components/charts/HorizontalBar3D";

import recyclingHero from "@/assets/recycling-hero.png";
import logoImrGris from "@/assets/logo-imr-gris.png";
import { formatKPI } from "@/lib/calculationEngine";
import {
  generateFolio, generateDatasetId, computeSHA256,
  deriveSignature, buildCanonicalDataset,
} from "@/lib/reportCertification";
import CertificationBlock from "@/components/CertificationBlock";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const Dashboard = () => {
  const { currentMonth, currentYear } = useEcoMetrics();

  const {
    dashYear, setDashYear,
    selectedMonths, toggleMonth, clearSelection, isAllMonths,
    confirmedTotals: totals, yearTotals,
    distinctMaterialsCount, totalConfirmedRecords,
    materialEntries, confirmedEntries, monthlyEconomic, allMonthsEconomic,
    monthlyCo2, allMonthsCo2,
    monthlyEnergia, allMonthsEnergia,
    monthlyArboles, allMonthsArboles,
    monthlyAgua, allMonthsAgua,
    monthlyKgNetos, allMonthsKgNetos,
    loading, lastUpdated, refreshData, catalogLoading,
    rawCaptures, catalogMap,
  } = useDashboardFilter();

  const [refreshing, setRefreshing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [exporting, setExporting] = useState(false);
  const [lastCert, setLastCert] = useState<{
    folio: string; firma: string; hash: string; datasetId: string;
    fechaEmision: string; totalRegistros: number;
  } | null>(null);

  const { user } = useEcoMetrics();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { refreshData(); setRefreshing(false); }, 800);
  };

  // Flag: at least one confirmed material has valid agua factor
  const hasAnyAgua = useMemo(() =>
    materialEntries.some(e => e.kpis.uses_agua && e.kpis.factor_agua != null && e.kpis.impacto_valido),
    [materialEntries]
  );

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

  const exportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const datasetToExport = confirmedEntries;

      if (datasetToExport.length === 0) {
        alert("No hay datos confirmados para exportar en el periodo seleccionado.");
        return;
      }

      // ── Certificación digital ──
      const now = new Date();
      const timestamp = now.toISOString();
      const folio = generateFolio(now);
      const datasetId = generateDatasetId(now);
      const canonicalDataset = buildCanonicalDataset(datasetToExport);
      const parametros = {
        year: dashYear,
        months: selectedMonths ?? "all",
      };

      const hash = await computeSHA256({
        folio, tipoReporte: "dashboard_export",
        parametros, datasetRows: canonicalDataset, timestamp,
      });
      const firma = deriveSignature(hash, folio);

      // Registrar en BD
      if (user) {
        const { error: insertErr } = await supabase.from("report_audit_log").insert({
          folio, hash_sha256: hash, firma_digital: firma,
          dataset_id: datasetId, tipo_reporte: "dashboard_export",
          usuario_id: user.id, fecha_generacion: timestamp,
          parametros_json: parametros, total_registros: datasetToExport.length,
        });
        if (insertErr) console.error("CERT_ERROR", insertErr);
      }

      setLastCert({ folio, firma, hash, datasetId, fechaEmision: timestamp, totalRegistros: datasetToExport.length });

      // ── CSV ──
      const headers = [
        "Material", "Codigo", "Familia", "Unidad",
        "KG_Brutos", "Yield", "KG_Netos",
        "Precio_Unitario", "Valor_Economico",
        "CO2", "Energia", "Agua", "Arboles",
        "Proveedor", "Fecha_Confirmacion", "Estado",
        "Folio_Certificacion",
      ];

      const csvEscape = (v: string | number | null | undefined) => {
        if (v === null || v === undefined) return "";
        const s = String(v);
        return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const rows = datasetToExport.map(e => {
        const isBattery = e.material.code === 'BATERIAS';
        const impactoValido = e.kpis.impacto_valido;
        const envCell = (usesFlag: boolean, value: number): string => {
          if (isBattery || !impactoValido || !usesFlag) return "";
          return value.toFixed(4);
        };
        const costPerKg = (e as any).cost_per_kg_applied ?? 0;
        return [
          csvEscape(e.material.name), e.material.code, csvEscape(e.material.family),
          isBattery ? "pza" : "kg",
          e.kg.toFixed(2),
          isBattery ? "" : (e.material.default_yield * 100).toFixed(0),
          isBattery ? "" : e.kpis.kg_netos.toFixed(2),
          Number(costPerKg).toFixed(2), e.kpis.economic_impact.toFixed(2),
          envCell(e.kpis.uses_co2, e.kpis.co2),
          envCell(e.kpis.uses_energia, e.kpis.energia),
          envCell(e.kpis.uses_agua, e.kpis.agua),
          envCell(e.kpis.uses_arboles, e.kpis.arboles),
          csvEscape((e as any).proveedor ?? ""),
          (e as any).confirmed_at ? new Date((e as any).confirmed_at).toISOString().split("T")[0] : "",
          "CONFIRMADO", folio,
        ];
      });

      const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ecometrics-${dashYear}-${folio}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [confirmedEntries, dashYear, selectedMonths, user]);

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
          <button onClick={() => setReportOpen(true)} className="win-btn-standard text-xs bg-primary text-primary-foreground hover:bg-primary/90">📄 Seleccionar y generar reporte</button>
        </div>
      </div>

      {/* Summary Counters Bar */}
      <div className="max-w-7xl mx-auto px-5 mt-2">
        <div className="flex items-center gap-6 bg-accent/40 border border-border rounded-lg px-5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm">📦</span>
            <span className="text-sm font-semibold text-foreground">Materiales capturados: <span className="text-primary">{distinctMaterialsCount} de 25</span></span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-sm">📋</span>
            <span className="text-sm font-semibold text-foreground">Total de registros: <span className="text-primary">{totalConfirmedRecords} confirmados</span></span>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <section className="max-w-7xl mx-auto px-5 mb-7">
        <h2 className="font-heading text-lg font-bold tracking-tight mb-1">📊 Indicadores Clave de Impacto</h2>
        <p className="text-[10px] text-muted-foreground italic mb-3">
          Indicadores calculados únicamente sobre capturas confirmadas, usando kg netos estimados y factores versionados por material. ({periodLabel})
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <TreesRingCard
              value={totals.arboles}
              target={800}
              monthlyData={monthlyArboles}
              allMonthsData={allMonthsArboles}
              periodLabel={periodLabel}
              dashYear={dashYear}
            />
            <DualPeriodBadge filteredValue={totals.arboles} yearValue={yearTotals.arboles} fmtKey="arboles" unit="árboles" dashYear={dashYear} isAllMonths={isAllMonths} />
          </div>
          <div>
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
            <DualPeriodBadge filteredValue={totals.co2} yearValue={yearTotals.co2} fmtKey="co2" unit="kg CO₂e" dashYear={dashYear} isAllMonths={isAllMonths} />
          </div>
          <div>
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
            <DualPeriodBadge filteredValue={totals.energia} yearValue={yearTotals.energia} fmtKey="energia" unit="kWh" dashYear={dashYear} isAllMonths={isAllMonths} />
          </div>
          {hasAnyAgua && (
            <div>
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
              <DualPeriodBadge filteredValue={totals.agua} yearValue={yearTotals.agua} fmtKey="agua" unit="litros" dashYear={dashYear} isAllMonths={isAllMonths} />
            </div>
          )}
          <div>
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
            <DualPeriodBadge filteredValue={totals.economicImpact} yearValue={yearTotals.economicImpact} fmtKey="economic_impact" unit="MXN" prefix="$" dashYear={dashYear} isAllMonths={isAllMonths} />
          </div>
          <div>
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
            <DualPeriodBadge filteredValue={totals.kgBrutos} yearValue={yearTotals.kgBrutos} fmtKey="kg_brutos" unit="kg" dashYear={dashYear} isAllMonths={isAllMonths} />
          </div>
          
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
            <DualPeriodBadge filteredValue={totals.kgNetos} yearValue={yearTotals.kgNetos} fmtKey="kg_netos" unit="kg netos" dashYear={dashYear} isAllMonths={isAllMonths} />
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
          <button onClick={exportCSV} disabled={exporting} className="win-btn-standard text-xs">{exporting ? "⏳" : "📤"} Exportar CSV</button>
        </div>
        <div className="win-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                {/* Group header row */}
                <tr className="bg-nav text-nav-foreground border-b border-nav-foreground/20">
                  <th colSpan={3} className="px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest border-r border-nav-foreground/20">Identificación</th>
                  <th colSpan={4} className="px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest border-r border-nav-foreground/20" style={{ color: "hsl(var(--kpi-co2))" }}>
                    💰 Bloque Económico
                  </th>
                   <th colSpan={hasAnyAgua ? 4 : 3} className="px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest border-r border-nav-foreground/20" style={{ color: "hsl(var(--kpi-trees))" }}>
                     🌿 Bloque Ambiental
                   </th>
                  <th colSpan={1} className="px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest">Estado</th>
                </tr>
                <tr className="bg-nav text-nav-foreground">
                  {[
                    { key: "", label: "#" },
                    { key: "", label: "Material" },
                    { key: "", label: "Código" },
                    // Económico
                    { key: "kg", label: "KG Brutos" },
                    { key: "", label: "Yield %" },
                    { key: "", label: "KG Netos" },
                    { key: "", label: "💰 Valor $" },
                    // Ambiental
                    { key: "co2", label: "♻️ CO₂e kg" },
                    { key: "energia", label: "⚡ Energía kWh" },
                    ...(hasAnyAgua ? [{ key: "agua", label: "💧 Agua L" }] : []),
                    { key: "arboles", label: "🌳 Árboles" },
                    // Estado
                    { key: "", label: "Estado" },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider ${col.key ? "cursor-pointer hover:bg-nav-foreground/10 select-none" : ""}`}
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
                  const impactoValido = e.kpis.impacto_valido;
                  const isBattery = e.material.code === 'BATERIAS';
                  const renderEnv = (usesFlag: boolean, value: number, fmtKey: "co2" | "energia" | "agua" | "arboles") => {
                    if (isBattery) return <span className="text-muted-foreground text-[10px]">—</span>;
                    if (!impactoValido) return <span className="text-amber-500 text-[10px] font-medium" title="Validación metodológica pendiente">PENDIENTE</span>;
                    if (!usesFlag) return <span className="text-muted-foreground text-[10px]">—</span>;
                    if (value === 0 && e.kg === 0) return <span className="text-muted-foreground">—</span>;
                    return formatKPI(fmtKey, value);
                  };
                  return (
                    <tr
                      key={e.material.code}
                      className={`transition-colors duration-100 hover:bg-accent/50 ${
                        i % 2 === 0 ? "bg-card" : "bg-accent/20"
                      } ${e.isConfirmed ? "border-l-[3px] border-l-primary" : ""}`}
                    >
                      <td className="px-3 py-2 text-muted-foreground">{e.material.display_order}</td>
                      <td className="px-3 py-2 font-medium">{e.material.name}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{e.material.code}</td>
                      {/* Bloque Económico */}
                      <td className="px-3 py-2 font-semibold">
                        {formatKPI("kg_brutos", e.kg)}{isBattery && e.kg > 0 ? " pzas" : ""}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground font-medium">
                        {isBattery ? "N/A" : `${(e.material.default_yield * 100).toFixed(0)}%`}
                      </td>
                      <td className="px-3 py-2 font-medium text-muted-foreground/80">
                        {isBattery ? "N/A" : e.kpis.kg_netos > 0 ? formatKPI("kg_netos", e.kpis.kg_netos) : "—"}
                      </td>
                      <td className="px-3 py-2 font-semibold" style={{ color: e.kpis.economic_impact > 0 ? "hsl(var(--primary))" : undefined }}>
                        {e.kpis.economic_impact > 0 ? `$${formatKPI("economic_impact", e.kpis.economic_impact)}` : "—"}
                      </td>
                      {/* Bloque Ambiental */}
                      <td className="px-3 py-2">{renderEnv(e.kpis.uses_co2, e.kpis.co2, "co2")}</td>
                      <td className="px-3 py-2">{renderEnv(e.kpis.uses_energia, e.kpis.energia, "energia")}</td>
                      {hasAnyAgua && <td className="px-3 py-2">{renderEnv(e.kpis.uses_agua, e.kpis.agua, "agua")}</td>}
                      <td className="px-3 py-2">{renderEnv(e.kpis.uses_arboles, e.kpis.arboles, "arboles")}</td>
                      {/* Estado */}
                      <td className="px-3 py-2">
                        {e.isConfirmed
                          ? <span className="text-xs text-primary font-medium">✓ Confirmado</span>
                          : e.kg > 0
                            ? <span className="text-xs text-amber-500 font-medium">⏳ Pendiente</span>
                            : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-secondary font-bold" style={{ color: "hsl(var(--kpi-trees))" }}>
                  <td className="px-3 py-2.5" colSpan={3}>TOTALES (Confirmados)</td>
                  {/* Económico */}
                  <td className="px-3 py-2.5">{formatKPI("kg_brutos", totals.kgBrutos)}</td>
                  <td className="px-3 py-2.5">—</td>
                  <td className="px-3 py-2.5">{formatKPI("kg_netos", totals.kgNetos)}</td>
                  <td className="px-3 py-2.5">${formatKPI("economic_impact", totals.economicImpact)}</td>
                  {/* Ambiental */}
                  <td className="px-3 py-2.5">{formatKPI("co2", totals.co2)}</td>
                  <td className="px-3 py-2.5">{formatKPI("energia", totals.energia)}</td>
                  {hasAnyAgua && <td className="px-3 py-2.5">{formatKPI("agua", totals.agua)}</td>}
                  <td className="px-3 py-2.5">{formatKPI("arboles", totals.arboles)}</td>
                  <td className="px-3 py-2.5">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Certification Block */}
      {lastCert && (
        <section className="max-w-7xl mx-auto px-5 mb-6">
          <CertificationBlock {...lastCert} />
        </section>
      )}

      {/* Methodology disclaimer */}
      <footer className="max-w-7xl mx-auto px-5 pb-10 pt-4">
        <p className="text-[10px] leading-relaxed text-muted-foreground/60 text-center max-w-4xl mx-auto">
          Los factores de conversión utilizados se basan en metodologías y referencias técnicas reconocidas internacionalmente, como el GHG Protocol, la EPA Waste Reduction Model (WARM) v16 (diciembre 2023) y literatura especializada del sector de reciclaje, lo que permite estimar de forma consistente y verificable los impactos ambientales asociados a la recuperación de materiales.
        </p>
        <p className="text-[9px] text-muted-foreground/40 text-center mt-2 max-w-3xl mx-auto leading-relaxed">
          Este documento ha sido generado automáticamente por el sistema ECOMETRICS y cuenta con mecanismos de integridad y trazabilidad. Cualquier alteración posterior invalida su autenticidad.
        </p>
      </footer>

      {reportOpen && (
        <ReportModal
          onClose={() => setReportOpen(false)}
          periodLabel={periodLabel}
          dashYear={dashYear}
          selectedMonths={selectedMonths}
          totals={totals}
          confirmedEntries={confirmedEntries}
        />
      )}
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </div>
  );
};

export default Dashboard;
