import { forwardRef } from "react";
import logoImrGris from "@/assets/logo-imr-gris.png";
import logoAC from "@/assets/logo-ac-recicladores.png";
import CertificationBlock from "@/components/CertificationBlock";
import HorizontalBarChart from "@/components/HorizontalBarChart";
import { formatKPI } from "@/lib/calculationEngine";
import type { MaterialEntry } from "@/context/EcoMetricsContext";
import type { KPITotals } from "@/context/EcoMetricsContext";

interface ReportViewProps {
  clientType: string;
  periodLabel: string;
  dashYear: number;
  totals: KPITotals;
  confirmedEntries: MaterialEntry[];
  cert: {
    folio: string;
    firma: string;
    hash: string;
    datasetId: string;
    fechaEmision: string;
    totalRegistros: number;
  } | null;
}

const KPIBlock = ({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) => (
  <div className="flex flex-col items-center p-3 rounded-lg" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="text-lg font-bold mt-0.5" style={{ color }}>{value}</span>
    <span className="text-[9px] text-muted-foreground">{unit}</span>
  </div>
);

const ReportView = forwardRef<HTMLDivElement, ReportViewProps>(
  ({ clientType, periodLabel, dashYear, totals, confirmedEntries, cert }, ref) => {
    const now = cert ? new Date(cert.fechaEmision) : new Date();

    // Flag: at least one confirmed material has valid agua factor
    const hasAnyAgua = confirmedEntries.some(e =>
      e.kpis.uses_agua && e.kpis.factor_agua != null && e.kpis.impacto_valido
    );

    const renderEnv = (e: MaterialEntry, usesFlag: boolean, value: number) => {
      const isBattery = e.material.code === "BATERIAS";
      const impactoValido = e.kpis.impacto_valido;
      if (isBattery) return "—";
      if (!impactoValido) return "PENDIENTE";
      if (!usesFlag) return "—";
      if (value === 0 && e.kg === 0) return "—";
      return value.toLocaleString("es-MX", { maximumFractionDigits: 2 });
    };

    return (
      <div
        ref={ref}
        className="bg-white text-foreground"
        style={{ width: 900, fontFamily: "'Inter', 'Segoe UI', sans-serif", fontSize: 12 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5" style={{ background: "linear-gradient(135deg, #e8f5e9, #f1f8e9)", borderBottom: "2px solid #4CAF50" }}>
          <div className="flex items-center gap-4">
            <img src={logoImrGris} alt="IMR Group" className="h-14 w-auto" />
            <div>
              <h1 className="text-[18px] font-bold tracking-tight uppercase text-gray-800">Reporte de Impacto Ambiental</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">Sistema ECOMETRICS — {periodLabel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Fecha de emisión</p>
            <p className="text-[12px] font-semibold text-gray-700">{now.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Tipo: {clientType}</p>
            {cert && <p className="text-[10px] font-mono text-gray-400 mt-0.5">Folio: {cert.folio}</p>}
          </div>
        </div>

        {/* KPI Summary */}
        <div className="px-8 py-5">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-700 mb-3">Indicadores Clave de Impacto</h2>
          <div className="grid grid-cols-6 gap-3">
            <KPIBlock label="Material Recuperado" value={formatKPI("kg_netos", totals.kgNetos)} unit="kg netos" color="#4CAF50" />
            <KPIBlock label="CO₂ Evitado" value={formatKPI("co2", totals.co2)} unit="kg CO₂e" color="#EF4444" />
            <KPIBlock label="Energía Ahorrada" value={formatKPI("energia", totals.energia)} unit="kWh" color="#F59E0B" />
            {hasAnyAgua && <KPIBlock label="Agua Conservada" value={formatKPI("agua", totals.agua)} unit="litros" color="#3B82F6" />}
            <KPIBlock label="Árboles Equivalentes" value={formatKPI("arboles", totals.arboles)} unit="árboles" color="#16A34A" />
            <KPIBlock label="Impacto Económico" value={`$${formatKPI("economic_impact", totals.economicImpact)}`} unit="MXN" color="#9333EA" />
          </div>
        </div>

        {/* Charts */}
        <div className="px-8 pb-4 grid grid-cols-2 gap-4">
          <HorizontalBarChart
            title="Top Materiales por CO₂ Evitado (kg)"
            data={confirmedEntries.filter(e => e.kpis.co2 > 0).sort((a, b) => b.kpis.co2 - a.kpis.co2).slice(0, 8).map(e => ({ name: e.material.name.substring(0, 18), value: e.kpis.co2 }))}
            gradient={["#EF4444", "#F87171"]}
          />
          <HorizontalBarChart
            title="Top Materiales por Volumen (kg)"
            data={confirmedEntries.sort((a, b) => b.kg - a.kg).slice(0, 8).map(e => ({ name: e.material.name.substring(0, 18), value: e.kg }))}
            gradient={["#4CAF50", "#81C784"]}
          />
        </div>

        {/* Data Table */}
        <div className="px-8 pb-4">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-700 mb-2">Detalle por Material</h2>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr style={{ background: "#2E7D32", color: "white" }}>
                <th className="px-2 py-1.5 text-left font-semibold">#</th>
                <th className="px-2 py-1.5 text-left font-semibold">Material</th>
                <th className="px-2 py-1.5 text-left font-semibold">Código</th>
                <th className="px-2 py-1.5 text-right font-semibold">KG Brutos</th>
                <th className="px-2 py-1.5 text-right font-semibold">Yield</th>
                <th className="px-2 py-1.5 text-right font-semibold">KG Netos</th>
                <th className="px-2 py-1.5 text-right font-semibold">CO₂e</th>
                <th className="px-2 py-1.5 text-right font-semibold">Energía</th>
                {hasAnyAgua && <th className="px-2 py-1.5 text-right font-semibold">Agua</th>}
                <th className="px-2 py-1.5 text-right font-semibold">Árboles</th>
              </tr>
            </thead>
            <tbody>
              {confirmedEntries.map((e, i) => {
                const isBattery = e.material.code === "BATERIAS";
                return (
                  <tr key={e.material.code} style={{ background: i % 2 === 0 ? "#FAFAFA" : "white" }}>
                    <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                    <td className="px-2 py-1 font-medium">{e.material.name}</td>
                    <td className="px-2 py-1 text-gray-500">{e.material.code}</td>
                    <td className="px-2 py-1 text-right font-semibold">{e.kg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}{isBattery ? " pzas" : ""}</td>
                    <td className="px-2 py-1 text-right text-gray-500">{isBattery ? "N/A" : `${(e.material.default_yield * 100).toFixed(0)}%`}</td>
                    <td className="px-2 py-1 text-right">{isBattery ? "N/A" : e.kpis.kg_netos.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                    <td className="px-2 py-1 text-right">{renderEnv(e, e.kpis.uses_co2, e.kpis.co2)}</td>
                    <td className="px-2 py-1 text-right">{renderEnv(e, e.kpis.uses_energia, e.kpis.energia)}</td>
                    {hasAnyAgua && <td className="px-2 py-1 text-right">{renderEnv(e, e.kpis.uses_agua, e.kpis.agua)}</td>}
                    <td className="px-2 py-1 text-right">{renderEnv(e, e.kpis.uses_arboles, e.kpis.arboles)}</td>
                  </tr>
                );
              })}
              <tr style={{ background: "#E8F5E9" }} className="font-bold">
                <td className="px-2 py-1.5" colSpan={3}>TOTALES</td>
                <td className="px-2 py-1.5 text-right">{totals.kgBrutos.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                <td className="px-2 py-1.5 text-right">—</td>
                <td className="px-2 py-1.5 text-right">{totals.kgNetos.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                <td className="px-2 py-1.5 text-right">{totals.co2.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                <td className="px-2 py-1.5 text-right">{totals.energia.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                {hasAnyAgua && <td className="px-2 py-1.5 text-right">{totals.agua.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>}
                <td className="px-2 py-1.5 text-right">{totals.arboles.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Certification Block */}
        {cert && (
          <div className="px-8 pb-4">
            <CertificationBlock {...cert} />
          </div>
        )}
      </div>
    );
  }
);

ReportView.displayName = "ReportView";
export default ReportView;
