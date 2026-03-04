import { useState, useCallback } from "react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import Navigation from "@/components/Navigation";
import ControlOperativoPeriodoCard from "@/components/ControlOperativoPeriodoCard";
import { MONTHS } from "@/data/materials";

interface CaptureState {
  confirmed: boolean;
  pending: boolean;
  timestamp: Date | null;
  feedbackVisible: boolean;
}

const DataCapture = () => {
  const {
    materialEntries, setMaterialKg, clearAll, totalKg, targets,
    currentMonth, setCurrentMonth, currentYear, setCurrentYear,
  } = useEcoMetrics();
  
  const [activeTab, setActiveTab] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  // Track capture state per material
  const [captureStates, setCaptureStates] = useState<Record<string, CaptureState>>({});

  const getState = (code: string): CaptureState =>
    captureStates[code] ?? { confirmed: false, pending: false, timestamp: null, feedbackVisible: false };

  const handleKgChange = useCallback((code: string, kg: number) => {
    setMaterialKg(code, kg);
    setCaptureStates(prev => ({
      ...prev,
      [code]: { ...prev[code], confirmed: false, pending: kg > 0, timestamp: prev[code]?.timestamp ?? null, feedbackVisible: false },
    }));
  }, [setMaterialKg]);

  const handleConfirm = useCallback((code: string) => {
    const now = new Date();
    setCaptureStates(prev => ({
      ...prev,
      [code]: { confirmed: true, pending: false, timestamp: now, feedbackVisible: true },
    }));
    // Reset feedback after 2s
    setTimeout(() => {
      setCaptureStates(prev => ({
        ...prev,
        [code]: { ...prev[code], feedbackVisible: false },
      }));
    }, 2000);
  }, []);

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
        <div className="max-w-6xl mx-auto px-5 pb-8 flex gap-5">
          {/* Material List — clean entry */}
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
                      state.confirmed ? "border-l-[3px] border-l-primary" : ""
                    }`}
                    style={{ animation: `fadeSlideUp 300ms ${idx * 30}ms both` }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Index */}
                      <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>

                      {/* Name */}
                      <div className="min-w-[160px]">
                        <div className="text-sm font-semibold leading-tight text-foreground">{entry.material.description}</div>
                        <div className="text-[11px] text-muted-foreground">{entry.material.code}</div>
                      </div>

                      {/* Input — no spinners */}
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
                        className="win-input !w-32 text-right font-semibold text-base tabular-nums"
                        placeholder="0.00"
                      />
                      <span className="text-xs text-muted-foreground font-medium">kg</span>

                      {/* Confirm button */}
                      <button
                        onClick={() => handleConfirm(entry.material.code)}
                        disabled={!entry.kg || (state.confirmed && !state.pending)}
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

                      {/* Timestamp */}
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
                    </div>

                    {/* Pending warning */}
                    {state.pending && (
                      <div className="mt-2 ml-12 text-[11px] text-amber-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        Pendiente de confirmar
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Control Operativo del Periodo */}
          <div className="w-80 shrink-0">
            <div className="sticky top-16">
              <ControlOperativoPeriodoCard
                totalKg={totalKg}
                materialesRegistrados={materialEntries.filter(e => e.kg > 0).length}
                materialesTotales={materialEntries.length}
                capturasConfirmadas={Object.values(captureStates).filter(s => s.confirmed).length}
                lastUpdated={
                  Object.values(captureStates)
                    .filter(s => s.timestamp)
                    .sort((a, b) => (b.timestamp!.getTime() - a.timestamp!.getTime()))[0]?.timestamp ?? null
                }
                currentMonth={currentMonth}
                currentYear={currentYear}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Upload */
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
