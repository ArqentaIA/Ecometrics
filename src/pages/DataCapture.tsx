import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import Navigation from "@/components/Navigation";
import { MONTHS } from "@/data/materials";

const DataCapture = () => {
  const {
    materialEntries, setMaterialKg, clearAll, kpiTotals, totalKg, targets,
    currentMonth, setCurrentMonth, currentYear, setCurrentYear,
  } = useEcoMetrics();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  const pct = (val: number, target: number) => target > 0 ? Math.min((val / target) * 100, 100) : 0;

  const kpiRows = [
    { emoji: "🌳", label: "Árboles Preservados", value: kpiTotals.arboles, target: targets.arboles, unit: "equiv." },
    { emoji: "♻️", label: "CO₂e Evitado", value: kpiTotals.co2, target: targets.co2, unit: "kg" },
    { emoji: "⚡", label: "Energía Ahorrada", value: kpiTotals.energia, target: targets.energia, unit: "kWh" },
    { emoji: "💧", label: "Agua Conservada", value: kpiTotals.agua, target: targets.agua, unit: "L" },
    { emoji: "💰", label: "Costo Evitado", value: kpiTotals.costo, target: targets.costo, unit: "$" },
    { emoji: "📦", label: "Mat. Primas Regen.", value: 0, target: 0, unit: "", disabled: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Windows 11 page header area */}
      <div className="max-w-7xl mx-auto px-5 pt-6 pb-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <span className="hover:text-foreground cursor-pointer transition-colors">Home</span>
          <span className="opacity-40">›</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Captura de Datos</span>
          <span className="opacity-40">›</span>
          <span className="text-foreground font-medium">{MONTHS[currentMonth]} {currentYear}</span>
        </div>

        <h1 className="font-heading text-2xl font-bold tracking-tight mb-5">Captura de Datos</h1>
      </div>

      {/* Period Selector — Windows 11 SegmentedControl style */}
      <div className="max-w-7xl mx-auto px-5 mb-5">
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

      {/* Tabs — Windows 11 Pivot */}
      <div className="max-w-7xl mx-auto px-5 mb-6">
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
        <div className="max-w-7xl mx-auto px-5 pb-8 flex gap-5">
          {/* Material List */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-foreground">Materiales</span>
              <button onClick={clearAll} className="win-btn-standard text-xs px-3">Limpiar todo</button>
            </div>
            <div className="space-y-1.5 max-h-[72vh] overflow-y-auto pr-1">
              {materialEntries.map((entry, idx) => (
                <div
                  key={entry.material.code}
                  className={`win-card p-3 flex items-center gap-3 transition-all duration-150 ${
                    entry.kg > 0 ? "border-l-[3px] !border-l-primary" : ""
                  }`}
                  style={entry.kg > 0 ? { background: "hsl(120 20% 97%)" } : {}}
                >
                  <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-[130px]">
                    <div className="text-[13px] font-semibold leading-tight">{entry.material.description}</div>
                    <div className="text-[11px] text-muted-foreground">{entry.material.code}</div>
                  </div>
                  <input
                    type="number"
                    value={entry.kg || ""}
                    onChange={e => setMaterialKg(entry.material.code, parseFloat(e.target.value) || 0)}
                    className="win-input !w-28 text-right font-medium"
                    placeholder="0.00 kg"
                    min="0"
                    step="0.01"
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {entry.kg > 0 ? (
                      <>
                        <span className="kpi-chip">🌳 {entry.kpis.arboles > 0 ? entry.kpis.arboles.toFixed(1) : "—"}</span>
                        <span className="kpi-chip">♻️ {entry.kpis.co2 > 0 ? entry.kpis.co2.toFixed(1) : "—"} kg</span>
                        <span className="kpi-chip">⚡ {entry.kpis.energia > 0 ? entry.kpis.energia.toFixed(1) : "—"} kWh</span>
                        <span className="kpi-chip">💧 {entry.kpis.agua > 0 ? entry.kpis.agua.toFixed(0) : "—"} L</span>
                        <span className="kpi-chip">💰 ${entry.kpis.costo.toFixed(2)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky KPI Summary — Windows 11 Flyout style */}
          <div className="w-80 shrink-0">
            <div className="sticky top-16 win-acrylic rounded-xl p-5"
              style={{ boxShadow: "var(--shadow-flyout)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-[15px]">Resumen del Período</h3>
                <span className="win-badge win-badge-success">{MONTHS[currentMonth]} {currentYear}</span>
              </div>
              <div className="text-center mb-5 pb-4 border-b border-border">
                <div className="text-3xl font-heading font-bold tracking-tight">
                  {totalKg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">KG Totales Capturados</div>
              </div>
              <div className="space-y-3.5">
                {kpiRows.map(k => {
                  const p = pct(k.value, k.target);
                  return (
                    <div key={k.label} className={k.disabled ? "opacity-35" : ""}>
                      <div className="flex items-center justify-between text-[13px] mb-1">
                        <span className="flex items-center gap-1.5">
                          <span>{k.emoji}</span>
                          <span className="text-xs">{k.label}</span>
                        </span>
                        <span className="font-bold font-heading text-sm">
                          {k.disabled ? "—" : k.value.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                          {!k.disabled && <span className="text-[10px] text-muted-foreground ml-1 font-normal">{k.unit}</span>}
                        </span>
                      </div>
                      <div className="win-progress">
                        <div
                          className="win-progress-fill bg-primary"
                          style={{ width: `${p}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                        <span>{p.toFixed(0)}% del objetivo</span>
                        {k.disabled && <span className="text-primary">Próximamente</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="win-btn-accent w-full mt-5 h-9 text-[13px] font-semibold"
              >
                💾 Guardar y Ver Dashboard →
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Upload */
        <div className="max-w-7xl mx-auto px-5 pb-8">
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
