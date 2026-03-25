import { useState, useCallback, useRef } from "react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import Navigation from "@/components/Navigation";
import ImpactCards from "@/components/ImpactCards";
import { formatKPI } from "@/lib/calculationEngine";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const PROVEEDORES = ["Rec. Primario", "Rec. Privado", "Rec. Comercial", "Rec. Industrial", "Otros"];

interface CaptureState {
  confirmed: boolean;
  pending: boolean;
  timestamp: Date | null;
  feedbackVisible: boolean;
}

/** Small controlled input that keeps a local string so decimal points aren't lost */
const CostInput = ({ materialCode, defaultValue, onCommit }: {
  materialCode: string;
  defaultValue: number;
  onCommit: (code: string, val: number) => void;
}) => {
  const [raw, setRaw] = useState(() => defaultValue > 0 ? defaultValue.toFixed(2) : "");
  const committed = useRef(defaultValue);

  // Sync if external value changes (e.g. clearAll)
  if (defaultValue !== committed.current && !document.activeElement?.closest(`[data-cost="${materialCode}"]`)) {
    committed.current = defaultValue;
    setRaw(defaultValue > 0 ? defaultValue.toFixed(2) : "");
  }

  return (
    <div className="flex items-center gap-1" data-cost={materialCode}>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">$/kg</span>
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={e => {
          const val = e.target.value;
          if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
            setRaw(val);
            const num = parseFloat(val);
            if (!isNaN(num)) {
              committed.current = num;
              onCommit(materialCode, num);
            } else if (val === "") {
              committed.current = 0;
              onCommit(materialCode, 0);
            }
          }
        }}
        onBlur={() => {
          const num = parseFloat(raw);
          if (!isNaN(num) && num >= 0) {
            const formatted = num.toFixed(2);
            setRaw(formatted);
            committed.current = num;
            onCommit(materialCode, num);
          } else {
            setRaw("");
            committed.current = 0;
            onCommit(materialCode, 0);
          }
        }}
        className="win-input !w-24 text-right font-semibold text-sm tabular-nums"
        placeholder="0.00"
      />
    </div>
  );
};

const DataCapture = () => {
  const {
    materialEntries, setMaterialKg, setCostPerKg, costPerKgMap, clearAll,
    currentMonth, setCurrentMonth, currentYear, setCurrentYear,
    saveCapture, catalogLoading, catalog, permissions, roleLabel,
    proveedorMap, setProveedor,
  } = useEcoMetrics();

  const [activeTab, setActiveTab] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [openImpact, setOpenImpact] = useState<Record<string, boolean>>({});
  const [captureStates, setCaptureStates] = useState<Record<string, CaptureState>>({});

  // ── AUDIT CAPA 3: Datos recibidos en UI (DataCapture) ──
  console.log("AUDIT_UI_INPUT_CAPTURE", {
    total: materialEntries?.length,
    materiales: materialEntries?.map(m => ({
      id: m.material.code,
      nombre: m.material.name,
    })),
  });

  const getState = (code: string): CaptureState =>
    captureStates[code] ?? { confirmed: false, pending: false, timestamp: null, feedbackVisible: false };

  const handleKgChange = useCallback((code: string, kg: number) => {
    setMaterialKg(code, kg);
    setCaptureStates(prev => ({
      ...prev,
      [code]: { ...prev[code], confirmed: false, pending: kg > 0, timestamp: prev[code]?.timestamp ?? null, feedbackVisible: false },
    }));
  }, [setMaterialKg]);

  const handleConfirm = useCallback(async (code: string) => {
    const result = await saveCapture(code);
    if (result.error) {
      console.error("Error saving capture:", result.error);
      return;
    }
    const now = new Date();
    setCaptureStates(prev => ({
      ...prev,
      [code]: { confirmed: true, pending: false, timestamp: now, feedbackVisible: true },
    }));
    setTimeout(() => {
      setCaptureStates(prev => ({
        ...prev,
        [code]: { ...prev[code], feedbackVisible: false },
      }));
    }, 2000);
  }, [saveCapture]);

  const formatTimestamp = (d: Date) => {
    const day = d.getDate().toString().padStart(2, "0");
    const monthName = MONTHS[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return { date: `${day} ${monthName} ${year}`, time: `${h12}:${mins} ${ampm}` };
  };

  if (catalogLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Cargando catálogo de materiales…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <div className="max-w-6xl mx-auto px-5 pt-6 pb-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <span className="hover:text-foreground cursor-pointer transition-colors">Home</span>
          <span className="opacity-40">›</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Captura de Datos</span>
          <span className="opacity-40">›</span>
          <span className="text-foreground font-medium">{MONTHS[currentMonth]} {currentYear}</span>
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight mb-5">Captura de Datos</h1>
      </div>

      {/* Period Selector */}
      <div className="max-w-6xl mx-auto px-5 mb-5">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => setCurrentMonth(i)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  i === currentMonth
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
            <button onClick={() => setCurrentYear(currentYear - 1)}
              className="win-btn-subtle px-2 py-1 text-xs rounded-md">−</button>
            <span className="px-3 py-1 text-sm font-semibold">{currentYear}</span>
            <button onClick={() => setCurrentYear(currentYear + 1)}
              className="win-btn-subtle px-2 py-1 text-xs rounded-md">+</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-5 mb-6">
        <div className="flex gap-0 border-b border-border">
          {["📋 Captura por Material", "📂 Subir Excel / CSV"].map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              className={`relative pb-3 px-4 text-sm transition-all duration-150 ${
                activeTab === i
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {activeTab === i && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 0 ? (
        <div className="max-w-6xl mx-auto px-5 pb-8">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-foreground">Materiales</span>
              <button onClick={clearAll} className="win-btn-standard text-xs px-3">Limpiar todo</button>
            </div>

            <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
              {materialEntries.map((entry, idx) => {
                const state = getState(entry.material.code);
                const ts = state.timestamp ? formatTimestamp(state.timestamp) : null;

                return (
                  <div
                    key={entry.material.code}
                    className={`win-card p-4 transition-all duration-150 ${
                      entry.isConfirmed ? "border-l-[3px] border-l-primary" : ""
                    }`}
                    style={{ animation: `fadeSlideUp 300ms ${idx * 30}ms both` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>

                      <div className="min-w-[160px]">
                        <div className="text-sm font-semibold leading-tight text-foreground">{entry.material.name}</div>
                        <div className="text-[11px] text-muted-foreground">{entry.material.code}</div>
                      </div>

                      <input
                        type="text"
                        inputMode="decimal"
                        value={entry.kg || ""}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            handleKgChange(entry.material.code, parseFloat(val) || 0);
                          }
                        }}
                        disabled={entry.isConfirmed && !permissions.canReopenCapture}
                        className="win-input !w-32 text-right font-semibold text-base tabular-nums"
                        placeholder="0.00"
                      />
                      <span className="text-xs text-muted-foreground font-medium">kg</span>

                      {/* Cost per kg field — editable only for Admin/Dirección */}
                      {permissions.canEditPrice ? (
                        <CostInput
                          materialCode={entry.material.code}
                          defaultValue={costPerKgMap[entry.material.code] ?? entry.material.default_cost_per_kg ?? 0}
                          onCommit={(code, val) => setCostPerKg(code, val)}
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">$/kg</span>
                          <span className="win-input !w-24 text-right font-semibold text-sm tabular-nums bg-muted/50 cursor-not-allowed opacity-75">
                            {(costPerKgMap[entry.material.code] ?? entry.material.default_cost_per_kg ?? 0).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Proveedor selector */}
                      <select
                        value={proveedorMap[entry.material.code] ?? ""}
                        onChange={e => setProveedor(entry.material.code, e.target.value)}
                        disabled={entry.isConfirmed && !permissions.canReopenCapture}
                        className="win-input !w-36 text-xs"
                      >
                        <option value="">Proveedor…</option>
                        {PROVEEDORES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>

                      {/* Economic impact calculated */}
                      {entry.kg > 0 && (
                        <div className="shrink-0 px-2 py-1 rounded-md bg-accent/50 text-xs font-semibold text-foreground whitespace-nowrap">
                          💰 ${formatKPI("economic_impact", entry.kpis.economic_impact)} <span className="text-muted-foreground font-normal">MXN</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleConfirm(entry.material.code)}
                        disabled={
                          !entry.kg ||
                          !(proveedorMap[entry.material.code]) ||
                          (state.confirmed && !state.pending) ||
                          (!permissions.canConfirmCapture && !permissions.canEditPrice)
                        }
                        title={
                          !proveedorMap[entry.material.code]
                            ? "Seleccione un proveedor para confirmar"
                            : !permissions.canConfirmCapture && !permissions.canEditPrice
                              ? "No tienes permiso para confirmar capturas"
                              : ""
                        }
                        className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-md transition-all duration-200 ${
                          state.feedbackVisible
                            ? "bg-primary text-primary-foreground"
                            : state.pending
                              ? "win-btn-accent"
                              : state.confirmed
                                ? "bg-primary/10 text-primary cursor-default"
                                : "win-btn-standard opacity-60"
                        }`}
                      >
                        {state.feedbackVisible
                          ? "Captura registrada ✓"
                          : state.pending
                            ? "Confirmar captura"
                            : state.confirmed
                              ? "Confirmado ✓"
                              : "Confirmar captura"
                        }
                      </button>

                      <div className="shrink-0 min-w-[100px] text-right">
                        {ts ? (
                          <div className="text-[11px] leading-tight">
                            <div className="text-muted-foreground">Actualizado</div>
                            <div className="font-medium text-foreground">{ts.date}</div>
                            <div className="text-muted-foreground">{ts.time}</div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground italic">Sin registro</div>
                        )}
                      </div>

                      <button
                        onClick={() => setOpenImpact(prev => ({ ...prev, [entry.material.code]: !prev[entry.material.code] }))}
                        className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                      >
                        {openImpact[entry.material.code] ? "▲ Ocultar" : "🌿 Ver impacto"}
                      </button>
                    </div>

                    {/* Yield info — from catalog */}
                    <div className="mt-1.5 ml-12 text-[11px] text-muted-foreground">
                      Yield: <span className="font-medium">{entry.material.default_yield}%</span>
                      {" → "}KG netos estimados: <span className="font-semibold text-foreground">{formatKPI("kg_netos", entry.kpis.kg_netos)} kg</span>
                      <span className="ml-2 italic">(pérdida típica: {entry.material.yield_loss_reason})</span>
                    </div>
                    {/* Rule 21: Disclaimer about calculation bases */}
                    <div className="mt-1 ml-12 text-[10px] text-muted-foreground/70 italic">
                      Indicadores ambientales calculados sobre kg netos estimados. El valor económico se calcula sobre kg brutos capturados.
                    </div>

                    {state.pending && (
                      <div className="mt-2 ml-12 text-[11px] text-amber-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        Pendiente de confirmar
                      </div>
                    )}

                    {openImpact[entry.material.code] && (
                      <ImpactCards kpis={entry.kpis} kgNetos={entry.kpis.kg_netos} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 win-card p-4 border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Metodología: </span>
                Los factores de conversión utilizados se basan en metodologías y referencias técnicas reconocidas internacionalmente, como el GHG Protocol, la EPA Waste Reduction Model (WARM) v16 (diciembre 2023) y literatura especializada del sector de reciclaje. Indicadores calculados sobre kg netos recuperados (kg capturados × yield del material).
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-5 pb-8">
          <div className="max-w-xl mx-auto">
            <div
              className={`border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center transition-all duration-150 ${
                dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) setUploadedFile({ name: file.name, size: file.size });
              }}
            >
              <span className="text-3xl mb-2">📁</span>
              <p className="text-sm text-muted-foreground">Arrastra y suelta tu archivo Excel o CSV aquí</p>
              <p className="text-[11px] text-muted-foreground mt-1">o haz clic para seleccionar</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="win-btn-standard text-sm">📥 Descargar Plantilla</button>
            </div>
            {uploadedFile && (
              <div className="mt-4 win-card p-4 flex items-center gap-3">
                <span className="text-xl">✅</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{uploadedFile.name}</div>
                  <div className="text-[11px] text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</div>
                </div>
                <button className="win-btn-accent text-sm px-4">Procesar Archivo</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCapture;
