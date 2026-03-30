import { useMemo, useState } from "react";
import { formatKPI, type CatalogMaterial, type VersionedFactor, calculateIndicators } from "@/lib/calculationEngine";
import type { KPITotals } from "@/context/EcoMetricsContext";

interface CaptureRow {
  material_code: string;
  month: number;
  kg_brutos: number;
  cost_per_kg_applied: number;
  proveedor: string | null;
}

interface Props {
  rawCaptures: CaptureRow[];
  catalogMap: Record<string, CatalogMaterial>;
  versionedFactors: Record<string, VersionedFactor>;
  dashboardTotals: KPITotals;
  dashYear: number;
}

const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function VerificationTable({ rawCaptures, catalogMap, versionedFactors, dashboardTotals, dashYear }: Props) {
  const [open, setOpen] = useState(false);

  const rows = useMemo(() =>
    rawCaptures
      .filter(c => c.kg_brutos > 0)
      .map(c => {
        const mat = catalogMap[c.material_code];
        if (!mat) return null;
        const factor = versionedFactors[c.material_code] ?? null;
        const kpis = calculateIndicators(mat, c.kg_brutos, c.cost_per_kg_applied, factor);
        return { ...c, mat, factor, kpis };
      })
      .filter(Boolean) as {
        material_code: string; month: number; kg_brutos: number;
        cost_per_kg_applied: number; proveedor: string | null;
        mat: CatalogMaterial; factor: VersionedFactor | null;
        kpis: ReturnType<typeof calculateIndicators>;
      }[],
    [rawCaptures, catalogMap, versionedFactors]
  );

  const totals = useMemo(() => rows.reduce(
    (acc, r) => ({
      kgBrutos: acc.kgBrutos + r.kg_brutos,
      kgNetos: acc.kgNetos + r.kpis.kg_netos,
      co2: acc.co2 + r.kpis.co2,
      energia: acc.energia + r.kpis.energia,
      agua: acc.agua + r.kpis.agua,
      arboles: acc.arboles + r.kpis.arboles,
      economicImpact: acc.economicImpact + r.kpis.economic_impact,
    }),
    { kgBrutos: 0, kgNetos: 0, co2: 0, energia: 0, agua: 0, arboles: 0, economicImpact: 0 }
  ), [rows]);

  const match = (a: number, b: number) => Math.abs(a - b) < 0.01;
  const allMatch =
    match(totals.kgBrutos, dashboardTotals.kgBrutos) &&
    match(totals.co2, dashboardTotals.co2) &&
    match(totals.energia, dashboardTotals.energia) &&
    match(totals.agua, dashboardTotals.agua) &&
    match(totals.arboles, dashboardTotals.arboles);

  return (
    <section className="max-w-7xl mx-auto px-5 mb-10">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <span className="text-base">{open ? "▼" : "▶"}</span>
        🔍 Tabla de Verificación — Recálculo por Captura (factores v2)
        <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${allMatch ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}>
          {allMatch ? "✓ COINCIDE CON KPIs" : "⚠ DISCREPANCIA"}
        </span>
      </button>

      {open && (
        <div className="win-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-muted text-muted-foreground">
                  <th className="px-2 py-1.5 text-left">#</th>
                  <th className="px-2 py-1.5 text-left">Mes</th>
                  <th className="px-2 py-1.5 text-left">Código</th>
                  <th className="px-2 py-1.5 text-left">Material</th>
                  <th className="px-2 py-1.5 text-right">KG Brutos</th>
                  <th className="px-2 py-1.5 text-right">Yield</th>
                  <th className="px-2 py-1.5 text-right">KG Netos</th>
                  <th className="px-2 py-1.5 text-right">Factor CO₂</th>
                  <th className="px-2 py-1.5 text-right">CO₂e (kg)</th>
                  <th className="px-2 py-1.5 text-right">Factor Energía</th>
                  <th className="px-2 py-1.5 text-right">Energía (kWh)</th>
                  <th className="px-2 py-1.5 text-right">Factor Agua</th>
                  <th className="px-2 py-1.5 text-right">Agua (L)</th>
                  <th className="px-2 py-1.5 text-right">Factor Árboles</th>
                  <th className="px-2 py-1.5 text-right">Árboles</th>
                  <th className="px-2 py-1.5 text-center">v</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-accent/20"}>
                    <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-1">{MONTH_LABELS[r.month - 1]}</td>
                    <td className="px-2 py-1 font-mono text-[11px]">{r.material_code}</td>
                    <td className="px-2 py-1">{r.mat.name}</td>
                    <td className="px-2 py-1 text-right font-medium">{formatKPI("kg_brutos", r.kg_brutos)}</td>
                    <td className="px-2 py-1 text-right">{(r.kpis.yield_applied * 100).toFixed(0)}%</td>
                    <td className="px-2 py-1 text-right">{formatKPI("kg_netos", r.kpis.kg_netos)}</td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{r.kpis.factor_co2 ?? "—"}</td>
                    <td className="px-2 py-1 text-right font-medium">{r.kpis.co2 > 0 ? formatKPI("co2", r.kpis.co2) : "—"}</td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{r.kpis.factor_energia ?? "—"}</td>
                    <td className="px-2 py-1 text-right font-medium">{r.kpis.energia > 0 ? formatKPI("energia", r.kpis.energia) : "—"}</td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{r.kpis.factor_agua ?? "—"}</td>
                    <td className="px-2 py-1 text-right font-medium">{r.kpis.agua > 0 ? formatKPI("agua", r.kpis.agua) : "—"}</td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{r.kpis.factor_arboles ?? "—"}</td>
                    <td className="px-2 py-1 text-right font-medium">{r.kpis.arboles > 0 ? formatKPI("arboles", r.kpis.arboles) : "—"}</td>
                    <td className="px-2 py-1 text-center text-[10px] text-muted-foreground">{r.kpis.factor_version ?? "—"}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-secondary font-bold border-t-2 border-primary/30">
                  <td className="px-2 py-2" colSpan={4}>TOTALES VERIFICADOS</td>
                  <td className="px-2 py-2 text-right">{formatKPI("kg_brutos", totals.kgBrutos)}</td>
                  <td className="px-2 py-2 text-right">—</td>
                  <td className="px-2 py-2 text-right">{formatKPI("kg_netos", totals.kgNetos)}</td>
                  <td className="px-2 py-2 text-right">—</td>
                  <td className="px-2 py-2 text-right">{formatKPI("co2", totals.co2)}</td>
                  <td className="px-2 py-2 text-right">—</td>
                  <td className="px-2 py-2 text-right">{formatKPI("energia", totals.energia)}</td>
                  <td className="px-2 py-2 text-right">—</td>
                  <td className="px-2 py-2 text-right">{formatKPI("agua", totals.agua)}</td>
                  <td className="px-2 py-2 text-right">—</td>
                  <td className="px-2 py-2 text-right">{formatKPI("arboles", totals.arboles)}</td>
                  <td className="px-2 py-2">—</td>
                </tr>
                {/* Dashboard comparison row */}
                <tr className="bg-muted/50 text-[11px]">
                  <td className="px-2 py-1.5" colSpan={4}>KPIs DASHBOARD (referencia)</td>
                  <td className="px-2 py-1.5 text-right">{formatKPI("kg_brutos", dashboardTotals.kgBrutos)}</td>
                  <td className="px-2 py-1.5">—</td>
                  <td className="px-2 py-1.5 text-right">{formatKPI("kg_netos", dashboardTotals.kgNetos)}</td>
                  <td className="px-2 py-1.5">—</td>
                  <td className="px-2 py-1.5 text-right">{formatKPI("co2", dashboardTotals.co2)}</td>
                  <td className="px-2 py-1.5">—</td>
                  <td className="px-2 py-1.5 text-right">{formatKPI("energia", dashboardTotals.energia)}</td>
                  <td className="px-2 py-1.5">—</td>
                  <td className="px-2 py-1.5 text-right">{formatKPI("agua", dashboardTotals.agua)}</td>
                  <td className="px-2 py-1.5">—</td>
                  <td className="px-2 py-1.5 text-right">{formatKPI("arboles", dashboardTotals.arboles)}</td>
                  <td className="px-2 py-1.5">—</td>
                </tr>
                {/* Delta row */}
                <tr className="text-[10px] italic">
                  <td className="px-2 py-1" colSpan={4}>Δ Diferencia</td>
                  {[
                    { a: totals.kgBrutos, b: dashboardTotals.kgBrutos },
                    null,
                    { a: totals.kgNetos, b: dashboardTotals.kgNetos },
                    null,
                    { a: totals.co2, b: dashboardTotals.co2 },
                    null,
                    { a: totals.energia, b: dashboardTotals.energia },
                    null,
                    { a: totals.agua, b: dashboardTotals.agua },
                    null,
                    { a: totals.arboles, b: dashboardTotals.arboles },
                    null,
                  ].map((d, idx) => (
                    <td key={idx} className={`px-2 py-1 text-right ${d && !match(d.a, d.b) ? "text-red-500 font-bold" : "text-green-600"}`}>
                      {d ? (d.a - d.b).toFixed(4) : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground p-3 border-t">
            Cada fila recalcula: kg_netos = kg_brutos × yield, KPI = kg_netos × factor_v2. Totales deben coincidir exactamente con los KPIs del Dashboard.
          </p>
        </div>
      )}
    </section>
  );
}
