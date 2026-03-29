import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import { buildCaptureSnapshot } from "@/lib/calculationEngine";
import {
  parseAndValidateTemplate,
  generateRejectionReport,
  type ValidatedRow,
  type RejectedRow,
} from "@/lib/excelValidator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const CLIENT_TO_PROVEEDOR: Record<string, string> = {
  Primario: "Rec. Primario",
  Privado: "Rec. Privado",
  Comercial: "Rec. Comercial",
  Industrial: "Rec. Industrial",
  Otros: "Otros",
};

interface ImportResult {
  imported: number;
  totalKg: number;
  materialsSet: Set<string>;
  clientCounts: Record<string, number>;
  rejected: RejectedRow[];
  periodMonth: number;
  periodYear: number;
}

export default function ExcelUploadProcessor() {
  const {
    catalog, versionedFactors, currentMonth, currentYear,
    user, loadCaptures, costPerKgMap, userRole,
  } = useEcoMetrics();

  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadRejectionReport = useCallback(() => {
    if (!result || result.rejected.length === 0) return;
    const blob = generateRejectionReport(result.rejected, result.periodMonth, result.periodYear);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rechazados_${MONTHS[result.periodMonth - 1]}_${result.periodYear}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const processFile = useCallback(async (file: File) => {
    setErrorMsg(null);
    setResult(null);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx") {
      setErrorMsg("Solo se aceptan archivos .xlsx generados desde la plantilla oficial.");
      return;
    }

    if (!user) {
      setErrorMsg("Debes iniciar sesión para importar datos.");
      return;
    }

    setProcessing(true);
    setProgress(10);

    try {
      const data = await file.arrayBuffer();
      setProgress(20);

      // ── Step 1: Parse & validate template structure ──
      const parsed = parseAndValidateTemplate(data);

      if (!parsed.valid) {
        setErrorMsg(parsed.error ?? "Archivo no reconocido como plantilla Ecometrics.");
        setProcessing(false);
        return;
      }

      setProgress(40);

      // ── Step 2: Warn if template period differs from selected period ──
      const templateMonth = parsed.periodMonth!;
      const templateYear = parsed.periodYear!;
      const selectedMonth = currentMonth + 1;

      if (templateMonth !== selectedMonth || templateYear !== currentYear) {
        setErrorMsg(
          `El período de la plantilla (${MONTHS[templateMonth - 1]} ${templateYear}) no coincide con el período seleccionado (${MONTHS[currentMonth]} ${currentYear}). ` +
          `Ajusta el período en la app o actualiza G2/H2 en la plantilla.`
        );
        setProcessing(false);
        return;
      }

      if (parsed.accepted.length === 0) {
        setResult({
          imported: 0, totalKg: 0, materialsSet: new Set(),
          clientCounts: {}, rejected: parsed.rejected,
          periodMonth: templateMonth, periodYear: templateYear,
        });
        setShowResult(true);
        setProcessing(false);
        return;
      }

      // ── Step 3: Match accepted rows to catalog codes ──
      const toInsert: Array<ValidatedRow & { catalogCode: string }> = [];
      const extraRejected: RejectedRow[] = [];

      for (const row of parsed.accepted) {
        const catalogMat = catalog.find(
          m => m.name.toUpperCase() === row.material.toUpperCase() || m.code.toUpperCase() === row.material.toUpperCase()
        );
        if (!catalogMat) {
          extraRejected.push({
            rowNum: row.rowNum,
            material: row.material,
            kg: String(row.kg),
            cliente: row.cliente,
            fecha: row.fecha.toLocaleDateString("es-MX"),
            notas: row.notas,
            reason: `Material "${row.material}" no encontrado en el catálogo del sistema`,
          });
        } else {
          toInsert.push({ ...row, catalogCode: catalogMat.code });
        }
      }

      const allRejected = [...parsed.rejected, ...extraRejected];
      setProgress(55);

      if (toInsert.length === 0) {
        setResult({
          imported: 0, totalKg: 0, materialsSet: new Set(),
          clientCounts: {}, rejected: allRejected,
          periodMonth: templateMonth, periodYear: templateYear,
        });
        setShowResult(true);
        setProcessing(false);
        return;
      }

      // ── Step 4: Check for duplicates in DB ──
      const { data: existing } = await supabase
        .from("material_captures")
        .select("material_code, kg_brutos")
        .eq("user_id", user.id)
        .eq("month", templateMonth)
        .eq("year", templateYear);

      setProgress(65);

      const existingSet = new Set(
        (existing ?? []).map(e => `${e.material_code}_${Number(e.kg_brutos)}`)
      );

      const deduped: typeof toInsert = [];
      for (const row of toInsert) {
        const key = `${row.catalogCode}_${row.kg}`;
        if (existingSet.has(key)) {
          allRejected.push({
            rowNum: row.rowNum,
            material: row.material,
            kg: String(row.kg),
            cliente: row.cliente,
            fecha: row.fecha.toLocaleDateString("es-MX"),
            notas: row.notas,
            reason: "Registro duplicado: ya existe este material y KG para el período.",
          });
        } else {
          deduped.push(row);
          existingSet.add(key);
        }
      }

      if (deduped.length === 0) {
        setResult({
          imported: 0, totalKg: 0, materialsSet: new Set(),
          clientCounts: {}, rejected: allRejected,
          periodMonth: templateMonth, periodYear: templateYear,
        });
        setShowResult(true);
        setProcessing(false);
        return;
      }

      // ── Step 5: Build snapshots and upsert ──
      setProgress(80);
      const snapshots = deduped.map(row => {
        const mat = catalog.find(m => m.code === row.catalogCode)!;
        const cost = costPerKgMap[mat.code] ?? mat.default_cost_per_kg ?? 0;
        const factor = versionedFactors[mat.code] ?? null;
        return {
          ...buildCaptureSnapshot(mat, row.kg, user.id, templateMonth, templateYear, cost, factor),
          proveedor: CLIENT_TO_PROVEEDOR[row.cliente] ?? row.cliente,
          capture_origin: "excel_upload",
          capture_role: userRole ?? "user",
          notes: row.notas || null,
        };
      });

      const { error } = await supabase
        .from("material_captures")
        .upsert(snapshots as any[], { onConflict: "user_id,material_code,month,year" });

      if (error) {
        setErrorMsg(`Error al guardar en Supabase: ${error.message}`);
        setProcessing(false);
        return;
      }

      setProgress(90);
      await loadCaptures();
      setProgress(100);

      // ── Build result summary ──
      const materialsSet = new Set(deduped.map(r => r.catalogCode));
      const clientCounts: Record<string, number> = {};
      let totalKg = 0;
      for (const row of deduped) {
        totalKg += row.kg;
        clientCounts[row.cliente] = (clientCounts[row.cliente] ?? 0) + 1;
      }

      setResult({
        imported: deduped.length, totalKg, materialsSet, clientCounts,
        rejected: allRejected,
        periodMonth: templateMonth, periodYear: templateYear,
      });
      setShowResult(true);
    } catch (err: any) {
      setErrorMsg(`Error al procesar archivo: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }, [catalog, versionedFactors, currentMonth, currentYear, user, loadCaptures, costPerKgMap, userRole]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }, [processFile]);

  return (
    <div className="max-w-xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div
        className={`border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {processing ? (
          <>
            <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">Procesando archivo… {progress}%</p>
          </>
        ) : (
          <>
            <span className="text-3xl mb-2">📁</span>
            <p className="text-sm text-muted-foreground">Arrastra y suelta tu archivo Excel aquí</p>
            <p className="text-[11px] text-muted-foreground mt-1">o haz clic para seleccionar (.xlsx)</p>
          </>
        )}
      </div>

      {errorMsg && (
        <div className="mt-4 win-card p-4 border border-destructive/30 bg-destructive/5">
          <p className="text-sm text-destructive font-medium">❌ {errorMsg}</p>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <a
          href="/Plantilla_Ecometrics_IRM.xlsx"
          download="Plantilla_Ecometrics_IRM.xlsx"
          className="win-btn-standard text-sm inline-flex items-center gap-2 no-underline"
        >
          📥 Descargar Plantilla
        </a>
      </div>

      {/* Result Modal */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {result && result.imported > 0
                ? "✅ Registros importados exitosamente"
                : "⚠️ No se importaron registros"
              }
            </DialogTitle>
            <DialogDescription>
              {result && result.imported > 0
                ? `${result.imported} registros aceptados, ${result.rejected.length} rechazados — ${MONTHS[result.periodMonth - 1]} ${result.periodYear}.`
                : "Todos los registros fueron rechazados por validación o duplicados."
              }
            </DialogDescription>
          </DialogHeader>

          {result && result.imported > 0 && (
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="win-card p-3">
                  <div className="text-muted-foreground text-xs">📦 KG totales importados</div>
                  <div className="font-bold text-lg">{result.totalKg.toLocaleString("es-MX", { maximumFractionDigits: 2 })}</div>
                </div>
                <div className="win-card p-3">
                  <div className="text-muted-foreground text-xs">🗂 Materiales distintos</div>
                  <div className="font-bold text-lg">{result.materialsSet.size}</div>
                </div>
              </div>

              <div className="win-card p-3">
                <div className="text-muted-foreground text-xs mb-2">👥 Por tipo de cliente</div>
                <div className="space-y-1">
                  {Object.entries(result.clientCounts).map(([client, count]) => (
                    <div key={client} className="flex justify-between text-sm">
                      <span>{client}</span>
                      <span className="font-semibold">{count} registro{count > 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result && result.rejected.length > 0 && (
            <div className="mt-3 win-card p-3 border border-amber-500/30 bg-amber-500/5">
              <div className="text-sm font-semibold text-amber-700 mb-2">
                ⚠️ {result.rejected.length} registro{result.rejected.length > 1 ? "s" : ""} rechazados
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.rejected.map((r, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    <span className="font-medium">Fila {r.rowNum}:</span> {r.reason}
                  </div>
                ))}
              </div>
              <button
                onClick={downloadRejectionReport}
                className="mt-3 win-btn-standard text-xs inline-flex items-center gap-1.5"
              >
                📄 Descargar reporte de rechazos (.xlsx)
              </button>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowResult(false)}
              className="win-btn-accent text-sm px-6 py-2"
            >
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
