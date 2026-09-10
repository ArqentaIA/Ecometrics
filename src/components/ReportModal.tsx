import { useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import {
  generateFolio, generateDatasetId, computeSHA256,
  deriveSignature, buildCanonicalDataset,
} from "@/lib/reportCertification";
import ReportView, { type BreakdownGroupView } from "@/components/ReportView";
import { useReportBreakdown, type BreakdownRow } from "@/hooks/useReportBreakdown";
import type { MaterialEntry, KPITotals } from "@/context/EcoMetricsContext";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const CLIENT_TYPES = [
  { value: "corporativo", label: "Corporativo / ESG" },
  { value: "regulatorio", label: "Regulatorio / Auditoría" },
  { value: "comercial", label: "Comercial / Proveedores" },
  { value: "interno", label: "Interno / Operativo" },
];

const MONTH_LABELS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const ALL = "__ALL__";

interface ReportModalProps {
  onClose: () => void;
  periodLabel: string;
  dashYear: number;
  selectedMonths: number[] | null;
  totals: KPITotals;
  confirmedEntries: MaterialEntry[];
}

export interface ReportRecipient {
  empresa: string;
  direccion: string;
  rfc: string;
  atencion: string;
}

const RFC_RE = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

const ReportModal = ({ onClose, periodLabel, dashYear, selectedMonths, totals, confirmedEntries }: ReportModalProps) => {
  const { user } = useEcoMetrics();
  const [clientType, setClientType] = useState("corporativo");
  const [step, setStep] = useState<"select" | "recipient" | "preview">("select");
  const [generating, setGenerating] = useState(false);
  const [recipient, setRecipient] = useState<ReportRecipient>({ empresa: "", direccion: "", rfc: "", atencion: "" });
  const [frozenRecipient, setFrozenRecipient] = useState<ReportRecipient | null>(null);
  const [cert, setCert] = useState<{
    folio: string; firma: string; hash: string; datasetId: string;
    fechaEmision: string; totalRegistros: number;
  } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // ---- Filtros del reporte (heredan del dashboard, ajustables aquí) ----
  const { rows: allRows, loading: rowsLoading } = useReportBreakdown(dashYear, true);
  const [fCliente, setFCliente] = useState<string>(ALL);
  const [fMaterial, setFMaterial] = useState<string>(ALL);
  const [fMes, setFMes] = useState<string>(
    selectedMonths && selectedMonths.length === 1 ? String(selectedMonths[0]) : ALL
  );

  // Base: hereda los meses seleccionados en el dashboard
  const baseRows = useMemo(
    () => (selectedMonths ? allRows.filter(r => selectedMonths.includes(r.month)) : allRows),
    [allRows, selectedMonths]
  );

  const clienteOptions = useMemo(() => {
    const map = new Map<string, string>();
    baseRows.forEach(r => map.set(r.clienteId, r.clienteNombre));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [baseRows]);

  const materialOptions = useMemo(() => {
    const map = new Map<string, string>();
    baseRows
      .filter(r => fCliente === ALL || r.clienteId === fCliente)
      .forEach(r => map.set(r.materialCode, r.materialName));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [baseRows, fCliente]);

  const mesOptions = useMemo(() => {
    const set = new Set<number>();
    baseRows
      .filter(r => (fCliente === ALL || r.clienteId === fCliente) && (fMaterial === ALL || r.materialCode === fMaterial))
      .forEach(r => set.add(r.month));
    return [...set].sort((a, b) => a - b);
  }, [baseRows, fCliente, fMaterial]);

  const filteredRows: BreakdownRow[] = useMemo(
    () =>
      baseRows.filter(
        r =>
          (fCliente === ALL || r.clienteId === fCliente) &&
          (fMaterial === ALL || r.materialCode === fMaterial) &&
          (fMes === ALL || r.month === Number(fMes))
      ),
    [baseRows, fCliente, fMaterial, fMes]
  );

  const filtersActive = fCliente !== ALL || fMaterial !== ALL || fMes !== ALL;
  const useBreakdown = allRows.length > 0;

  const filtersLabel = useMemo(() => {
    const parts: string[] = [];
    parts.push(`Cliente: ${fCliente === ALL ? "Todos" : (clienteOptions.find(c => c[0] === fCliente)?.[1] ?? "—")}`);
    parts.push(`Material: ${fMaterial === ALL ? "Todos" : (materialOptions.find(m => m[0] === fMaterial)?.[1] ?? "—")}`);
    parts.push(`Mes: ${fMes === ALL ? "Todos" : MONTH_LABELS[Number(fMes) - 1]}`);
    return parts.join(" · ");
  }, [fCliente, fMaterial, fMes, clienteOptions, materialOptions]);

  // Agrupación cliente → (material, mes)
  const breakdown: BreakdownGroupView[] = useMemo(() => {
    const groups = new Map<string, BreakdownGroupView>();
    const agg = new Map<string, { g: string; row: BreakdownRow; kg: number; netos: number; co2: number; energia: number; agua: number; arboles: number; economic: number }>();

    filteredRows.forEach(r => {
      const key = `${r.clienteNombre}||${r.materialCode}||${r.month}`;
      const prev = agg.get(key);
      const isBattery = r.materialCode === "BATERIAS";
      const valid = r.kpis.impacto_valido;
      const item = prev ?? { g: r.clienteNombre, row: r, kg: 0, netos: 0, co2: 0, energia: 0, agua: 0, arboles: 0, economic: 0 };
      item.kg += r.kgBrutos;
      item.netos += isBattery ? 0 : r.kpis.kg_netos;
      if (valid && r.kpis.uses_co2) item.co2 += r.kpis.co2;
      if (valid && r.kpis.uses_energia) item.energia += r.kpis.energia;
      if (valid && r.kpis.uses_agua) item.agua += r.kpis.agua;
      if (valid && r.kpis.uses_arboles) item.arboles += r.kpis.arboles;
      item.economic += r.kpis.economic_impact;
      agg.set(key, item);
    });

    [...agg.values()]
      .sort((a, b) =>
        a.g.localeCompare(b.g) ||
        a.row.materialName.localeCompare(b.row.materialName) ||
        a.row.month - b.row.month
      )
      .forEach(item => {
        const r = item.row;
        const isBattery = r.materialCode === "BATERIAS";
        const valid = r.kpis.impacto_valido;
        let g = groups.get(item.g);
        if (!g) {
          g = { clienteNombre: item.g, rows: [], totals: { kgBrutos: 0, kgNetos: 0, co2: 0, energia: 0, agua: 0, arboles: 0, economic: 0 } };
          groups.set(item.g, g);
        }
        g.rows.push({
          materialName: r.materialName,
          materialCode: r.materialCode,
          month: r.month,
          kgBrutos: item.kg,
          kgNetos: isBattery ? null : item.netos,
          co2: valid && r.kpis.uses_co2 ? item.co2 : null,
          energia: valid && r.kpis.uses_energia ? item.energia : null,
          agua: valid && r.kpis.uses_agua ? item.agua : null,
          arboles: valid && r.kpis.uses_arboles ? item.arboles : null,
          economic: item.economic,
        });
        g.totals.kgBrutos += item.kg;
        g.totals.kgNetos += isBattery ? 0 : item.netos;
        g.totals.co2 += item.co2;
        g.totals.energia += item.energia;
        g.totals.agua += item.agua;
        g.totals.arboles += item.arboles;
        g.totals.economic += item.economic;
      });

    return [...groups.values()];
  }, [filteredRows]);

  // Totales y entradas por material derivados de los filtros
  const effectiveTotals: KPITotals = useMemo(() => {
    if (!useBreakdown || !filtersActive) return totals;
    return filteredRows.reduce<KPITotals>(
      (acc, r) => ({
        arboles: acc.arboles + r.kpis.arboles,
        co2: acc.co2 + r.kpis.co2,
        energia: acc.energia + r.kpis.energia,
        agua: acc.agua + r.kpis.agua,
        kgBrutos: acc.kgBrutos + r.kgBrutos,
        kgNetos: acc.kgNetos + r.kpis.kg_netos,
        economicImpact: acc.economicImpact + r.kpis.economic_impact,
      }),
      { arboles: 0, co2: 0, energia: 0, agua: 0, kgBrutos: 0, kgNetos: 0, economicImpact: 0 }
    );
  }, [useBreakdown, filtersActive, filteredRows, totals]);

  const effectiveEntries: MaterialEntry[] = useMemo(() => {
    if (!useBreakdown || !filtersActive) return confirmedEntries;
    const byCode = new Map<string, MaterialEntry>();
    filteredRows.forEach(r => {
      const prev = byCode.get(r.materialCode);
      if (!prev) {
        byCode.set(r.materialCode, {
          material: r.material,
          kg: r.kgBrutos,
          kpis: { ...r.kpis },
          isConfirmed: true,
        });
      } else {
        prev.kg += r.kgBrutos;
        prev.kpis.kg_netos += r.kpis.kg_netos;
        prev.kpis.co2 += r.kpis.co2;
        prev.kpis.energia += r.kpis.energia;
        prev.kpis.agua += r.kpis.agua;
        prev.kpis.arboles += r.kpis.arboles;
        prev.kpis.economic_impact += r.kpis.economic_impact;
      }
    });
    return [...byCode.values()];
  }, [useBreakdown, filtersActive, filteredRows, confirmedEntries]);

  const effectivePeriodLabel = fMes === ALL ? periodLabel : `${MONTH_LABELS[Number(fMes) - 1]} ${dashYear}`;





  const generateCertification = useCallback(async () => {
    setGenerating(true);
    try {
      const now = new Date();
      const timestamp = now.toISOString();
      const folio = generateFolio(now);
      const datasetId = generateDatasetId(now);
      const canonicalDataset = buildCanonicalDataset(effectiveEntries);
      const anyRecipient =
        recipient.empresa.trim() || recipient.direccion.trim() ||
        recipient.rfc.trim() || recipient.atencion.trim();
      const destinatario = clientType === "corporativo" && anyRecipient
        ? {
            empresa: recipient.empresa.trim() || "—",
            direccion: recipient.direccion.trim() || "—",
            rfc: recipient.rfc.trim().toUpperCase() || "—",
            atencion: recipient.atencion.trim() || "—",
          }
        : null;
      const parametros = {
        year: dashYear,
        months: fMes === ALL ? (selectedMonths ?? "all") : [Number(fMes)],
        clientType,
        filtro_cliente: fCliente === ALL ? "todos" : fCliente,
        filtro_material: fMaterial === ALL ? "todos" : fMaterial,
        ...(destinatario ? { destinatario } : {}),
      };
      setFrozenRecipient(destinatario);


      const hash = await computeSHA256({
        folio, tipoReporte: "reporte_visual",
        parametros, datasetRows: canonicalDataset, timestamp,
      });
      const firma = deriveSignature(hash, folio);

      if (user) {
        const { error } = await supabase.from("report_audit_log").insert({
          folio, hash_sha256: hash, firma_digital: firma,
          dataset_id: datasetId, tipo_reporte: "reporte_visual",
          usuario_id: user.id, fecha_generacion: timestamp,
          parametros_json: parametros, total_registros: effectiveEntries.length,
        });
        if (error) console.error("CERT_ERROR", error);
      }

      setCert({ folio, firma, hash, datasetId, fechaEmision: timestamp, totalRegistros: effectiveEntries.length });
      setStep("preview");
    } finally {
      setGenerating(false);
    }
  }, [effectiveEntries, dashYear, selectedMonths, clientType, user, recipient, fCliente, fMaterial, fMes]);

  const handlePrimary = useCallback(() => {
    if (clientType === "corporativo") {
      setStep("recipient");
      return;
    }
    setFrozenRecipient(null);
    generateCertification();
  }, [clientType, generateCertification]);


  const exportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgW = canvas.width;
      const imgH = canvas.height;
      const pdfW = 210; // A4 mm
      const pdfH = (imgH * pdfW) / imgW;

      const pdf = new jsPDF({
        orientation: pdfH > 297 ? "portrait" : "portrait",
        unit: "mm",
        format: [pdfW, Math.max(pdfH, 297)],
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const fecha = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
      const hora = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      pdf.save(`IRM Circular Intelligence-${fecha}-${hora}.pdf`);
    } finally {
      setGenerating(false);
    }
  }, [cert, dashYear]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-card rounded-xl shadow-2xl max-w-[960px] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold">
            {step === "select"
              ? "📄 Seleccionar y Generar Reporte"
              : step === "recipient"
                ? "🏢 Datos del destinatario"
                : "📄 Vista Previa del Reporte"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>


        {step === "select" ? (
          <div className="p-8">
            <p className="text-sm text-muted-foreground mb-6">
              Seleccione el tipo de cliente para generar el reporte visual certificado.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {CLIENT_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setClientType(ct.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    clientType === ct.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="font-semibold text-sm">{ct.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-6 px-3 py-2 bg-muted/50 rounded-lg">
              <span>📊</span>
              <span>Período: <strong>{periodLabel}</strong> • {confirmedEntries.length} materiales confirmados</span>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="win-btn-standard text-sm">Cancelar</button>
              <button
                onClick={handlePrimary}
                disabled={generating}
                className="win-btn-standard text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {generating ? "⏳ Generando..." : "Generar Vista Previa"}
              </button>
            </div>
          </div>
        ) : step === "recipient" ? (
          <div className="p-8">
            <p className="text-sm text-muted-foreground mb-6">
              Capture los datos de la empresa a quien será dirigido el Reporte Corporativo / ESG.
              Puede dejar campos vacíos y continuar; los datos faltantes aparecerán como “—”.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nombre de la Empresa</label>
                <input
                  value={recipient.empresa}
                  onChange={e => setRecipient(r => ({ ...r, empresa: e.target.value }))}
                  placeholder="Ej. Industrias del Bajío S.A. de C.V."
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dirección</label>
                <textarea
                  value={recipient.direccion}
                  onChange={e => setRecipient(r => ({ ...r, direccion: e.target.value }))}
                  rows={3}
                  placeholder="Calle y número, colonia, ciudad, estado, C.P."
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">RFC</label>
                <input
                  value={recipient.rfc}
                  onChange={e => setRecipient(r => ({ ...r, rfc: e.target.value.toUpperCase().replace(/\s+/g, "") }))}
                  onBlur={e => setRecipient(r => ({ ...r, rfc: e.target.value.trim().toUpperCase() }))}
                  maxLength={13}
                  placeholder="XAXX010101000"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono uppercase"
                />
                {recipient.rfc.length > 0 && !RFC_RE.test(recipient.rfc.trim().toUpperCase()) && (
                  <p className="text-[11px] text-destructive mt-1">Formato de RFC inválido (12 o 13 caracteres).</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Con AT'N</label>
                <input
                  value={recipient.atencion}
                  onChange={e => setRecipient(r => ({ ...r, atencion: e.target.value }))}
                  placeholder="Ing. Juan Pérez Martínez — Director de Sustentabilidad"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-8">
              <button onClick={() => setStep("select")} className="win-btn-standard text-sm">Cancelar</button>
              <button
                onClick={generateCertification}
                disabled={generating}
                className="win-btn-standard text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {generating ? "⏳ Generando..." : "Continuar a Vista Previa"}
              </button>
            </div>
          </div>
        ) : (

          <div className="p-4">
            {/* Action bar */}
            <div className="flex items-center justify-between mb-4 px-2">
              <button onClick={() => setStep("select")} className="win-btn-standard text-xs">← Volver</button>
              <div className="flex gap-2">
                <button
                  onClick={exportPDF}
                  disabled={generating}
                  className="win-btn-standard text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {generating ? "⏳ Generando PDF..." : "📥 Generar PDF"}
                </button>
              </div>
            </div>

            {/* Report preview with scroll */}
            <div className="border border-border rounded-lg overflow-auto max-h-[70vh] bg-white">
              <ReportView
                ref={reportRef}
                clientType={CLIENT_TYPES.find(c => c.value === clientType)?.label ?? clientType}
                periodLabel={effectivePeriodLabel}
                dashYear={dashYear}
                totals={effectiveTotals}
                confirmedEntries={effectiveEntries}
                cert={cert}
                recipient={frozenRecipient}
                breakdown={useBreakdown ? breakdown : null}
                filtersLabel={filtersLabel}
              />
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-3">
              El reporte debe generarse desde la vista estructurada, no desde datos crudos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
