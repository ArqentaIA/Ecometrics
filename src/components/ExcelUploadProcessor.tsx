import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import { buildCaptureSnapshot } from "@/lib/calculationEngine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const VALID_CLIENTS = ["Primario", "Privado", "Comercial", "Industrial", "Otros"];
const CLIENT_TO_PROVEEDOR: Record<string, string> = {
  "Primario": "Rec. Primario",
  "Privado": "Rec. Privado",
  "Comercial": "Rec. Comercial",
  "Industrial": "Rec. Industrial",
  "Otros": "Otros",
};

interface ParsedRow {
  rowNum: number;
  material: string;
  kg: number;
  cliente: string;
}

interface RejectedRow {
  rowNum: number;
  reason: string;
}

interface ImportResult {
  imported: number;
  totalKg: number;
  materialsSet: Set<string>;
  clientCounts: Record<string, number>;
  rejected: RejectedRow[];
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function ExcelUploadProcessor() {
  const {
    catalog, versionedFactors, currentMonth, currentYear,
    user, loadCaptures, costPerKgMap,
  } = useEcoMetrics();

  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setErrorMsg(null);
    setResult(null);

    // Validate extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") {
      setErrorMsg("Solo se aceptan archivos .xlsx o .csv");
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
      const wb = XLSX.read(data, { type: "array" });

      // Find CAPTURA sheet
      const sheetName = wb.SheetNames.find(s => s.toUpperCase() === "CAPTURA");
      if (!sheetName) {
        setErrorMsg("No se encontró la hoja 'CAPTURA' en el archivo.");
        setProcessing(false);
        return;
      }

      const ws = wb.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      // Data starts at row 6 (index 5)
      const dataRows = rows.slice(5);
      if (dataRows.length === 0) {
        setErrorMsg("No se encontraron datos a partir de la fila 6.");
        setProcessing(false);
        return;
      }

      setProgress(25);

      // Parse and validate
      const validRows: ParsedRow[] = [];
      const rejected: RejectedRow[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 6; // Excel row number
        const material = String(row[0] ?? "").trim().toUpperCase();
        const kgRaw = row[1];
        const cliente = String(row[2] ?? "").trim();

        // Skip TOTAL KG row
        if (material.includes("TOTAL KG") || material.includes("TOTAL")) continue;
        // Skip empty rows
        if (!material && !kgRaw && !cliente) continue;

        const errors: string[] = [];
        if (!material) errors.push("MATERIAL vacío");

        const kg = typeof kgRaw === "number" ? kgRaw : parseFloat(String(kgRaw));
        if (isNaN(kg) || kg <= 0) errors.push("KG debe ser un número mayor a 0");

        // Normalize cliente
        const clienteNorm = VALID_CLIENTS.find(
          c => c.toLowerCase() === cliente.toLowerCase()
        );
        if (!clienteNorm) errors.push(`CLIENTE inválido: "${cliente}". Debe ser: ${VALID_CLIENTS.join(", ")}`);

        if (errors.length > 0) {
          rejected.push({ rowNum, reason: errors.join("; ") });
          continue;
        }

        // Validate material exists in catalog
        const catalogMat = catalog.find(m => m.code === material || m.name.toUpperCase() === material);
        if (!catalogMat) {
          rejected.push({ rowNum, reason: `Material "${material}" no encontrado en el catálogo` });
          continue;
        }

        validRows.push({ rowNum, material: catalogMat.code, kg, cliente: clienteNorm! });
      }

      setProgress(45);

      if (validRows.length === 0) {
        setResult({ imported: 0, totalKg: 0, materialsSet: new Set(), clientCounts: {}, rejected });
        setShowResult(true);
        setProcessing(false);
        return;
      }

      // Check for duplicates in DB
      const { data: existing } = await supabase
        .from("material_captures")
        .select("material_code, kg_brutos")
        .eq("user_id", user.id)
        .eq("month", currentMonth + 1)
        .eq("year", currentYear);

      setProgress(60);

      const existingSet = new Set(
        (existing ?? []).map(e => `${e.material_code}_${Number(e.kg_brutos)}`)
      );

      const toInsert: ParsedRow[] = [];
      for (const row of validRows) {
        const key = `${row.material}_${row.kg}`;
        if (existingSet.has(key)) {
          rejected.push({
            rowNum: row.rowNum,
            reason: "Registro duplicado: ya existe este material y KG para el período seleccionado.",
          });
        } else {
          toInsert.push(row);
          // Add to set so intra-file duplicates are also caught
          existingSet.add(key);
        }
      }

      if (toInsert.length === 0) {
        setResult({ imported: 0, totalKg: 0, materialsSet: new Set(), clientCounts: {}, rejected });
        setShowResult(true);
        setProcessing(false);
        return;
      }

      // Build snapshots and insert
      setProgress(75);
      const snapshots = toInsert.map(row => {
        const mat = catalog.find(m => m.code === row.material)!;
        const cost = costPerKgMap[mat.code] ?? mat.default_cost_per_kg ?? 0;
        const factor = versionedFactors[mat.code] ?? null;
        return {
          ...buildCaptureSnapshot(mat, row.kg, user.id, currentMonth + 1, currentYear, cost, factor),
          proveedor: CLIENT_TO_PROVEEDOR[row.cliente] ?? row.cliente,
          capture_origin: "excel_upload",
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

      // Reload captures to refresh KPIs
      await loadCaptures();

      setProgress(100);

      // Build result
      const materialsSet = new Set(toInsert.map(r => r.material));
      const clientCounts: Record<string, number> = {};
      let totalKg = 0;
      for (const row of toInsert) {
        totalKg += row.kg;
        clientCounts[row.cliente] = (clientCounts[row.cliente] ?? 0) + 1;
      }

      setResult({ imported: toInsert.length, totalKg, materialsSet, clientCounts, rejected });
      setShowResult(true);
    } catch (err: any) {
      setErrorMsg(`Error al procesar archivo: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }, [catalog, versionedFactors, currentMonth, currentYear, user, loadCaptures, costPerKgMap]);

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
        accept=".xlsx,.csv"
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
            <p className="text-sm text-muted-foreground">Arrastra y suelta tu archivo Excel o CSV aquí</p>
            <p className="text-[11px] text-muted-foreground mt-1">o haz clic para seleccionar</p>
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
          href="/Plantilla_Ecometrics_IRM_Final.xlsx"
          download="Plantilla_Ecometrics_IRM_Final.xlsx"
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
                ? `Se importaron ${result.imported} registros con un total de ${result.totalKg.toLocaleString("es-MX", { maximumFractionDigits: 2 })} kg para ${MONTHS[currentMonth]} ${currentYear}.`
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
                ⚠️ {result.rejected.length} registro{result.rejected.length > 1 ? "s" : ""} no se importaron
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.rejected.map((r, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    <span className="font-medium">Fila {r.rowNum}:</span> {r.reason}
                  </div>
                ))}
              </div>
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
