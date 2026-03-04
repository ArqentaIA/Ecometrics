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

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="text-sm text-muted-foreground">
          Home › Captura de Datos › {MONTHS[currentMonth]} {currentYear}
        </div>
      </div>

      {/* Period Selector */}
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => setCurrentMonth(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  i === currentMonth
                    ? "bg-btn-dark text-btn-dark-foreground shadow"
                    : "bg-card text-foreground border border-border hover:bg-secondary"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentYear(currentYear - 1)} className="fluent-btn-outline px-2 py-1 text-xs">−</button>
            <span className="px-3 py-1 text-sm font-semibold">{currentYear}</span>
            <button onClick={() => setCurrentYear(currentYear + 1)} className="fluent-btn-outline px-2 py-1 text-xs">+</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex gap-6 border-b border-border">
          {["📋 Captura por Material", "📂 Subir Excel / CSV"].map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              className={`pb-2 text-sm font-medium transition-all duration-150 border-b-2 ${
                activeTab === i
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 0 ? (
        <div className="max-w-7xl mx-auto px-4 pb-8 flex gap-6">
          {/* Material List */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-lg font-bold">Materiales</h2>
              <button onClick={clearAll} className="fluent-btn-outline text-xs px-3 py-1">Limpiar todo</button>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
              {materialEntries.map((entry, idx) => (
                <div
                  key={entry.material.code}
                  className={`fluent-card p-3 flex items-center gap-4 transition-all duration-150 ${
                    entry.kg > 0 ? "border-l-[3px] !border-l-primary bg-secondary/30" : ""
                  }`}
                  style={{ cursor: "default" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-[140px]">
                    <div className="text-sm font-semibold">{entry.material.description}</div>
                    <div className="text-xs text-muted-foreground">{entry.material.code}</div>
                  </div>
                  <input
                    type="number"
                    value={entry.kg || ""}
                    onChange={e => setMaterialKg(entry.material.code, parseFloat(e.target.value) || 0)}
                    className="fluent-input w-28 text-right font-medium"
                    placeholder="0.00 kg"
                    min="0"
                    step="0.01"
                  />
                  <div className="flex flex-wrap gap-1.5 flex-1">
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

          {/* Sticky KPI Summary */}
          <div className="w-80 shrink-0">
            <div className="sticky top-20 acrylic rounded-2xl p-5" style={{ boxShadow: "var(--shadow-acrylic)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-base">Resumen del Período</h3>
                <span className="kpi-chip text-xs">{MONTHS[currentMonth]} {currentYear}</span>
              </div>
              <div className="text-center mb-4">
                <div className="text-3xl font-heading font-bold">{totalKg.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</div>
                <div className="text-xs text-muted-foreground">KG Totales</div>
              </div>
              <div className="space-y-3">
                {kpiRows.map(k => (
                  <div key={k.label} className={k.disabled ? "opacity-40" : ""}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{k.emoji} {k.label}</span>
                      <span className="font-bold font-heading">
                        {k.disabled ? "—" : k.value.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                        {!k.disabled && <span className="text-xs text-muted-foreground ml-1">{k.unit}</span>}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${pct(k.value, k.target)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>{pct(k.value, k.target).toFixed(0)}% del objetivo</span>
                      {k.disabled && <span className="text-primary text-[10px]">Próximamente</span>}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="fluent-btn-primary w-full mt-5 h-10"
              >
                💾 Guardar y Ver Dashboard →
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Upload */
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="max-w-xl mx-auto">
            <div
              className={`border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center transition-all duration-150 ${
                dragOver ? "border-primary bg-primary/5" : "border-primary/50"
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
              <span className="text-4xl mb-2">📁</span>
              <p className="text-sm text-muted-foreground">Arrastra y suelta tu archivo Excel o CSV aquí</p>
              <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="fluent-btn-outline text-sm">📥 Descargar Plantilla</button>
            </div>
            {uploadedFile && (
              <div className="mt-4 fluent-card p-4 flex items-center gap-3">
                <span className="text-xl">✅</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{uploadedFile.name}</div>
                  <div className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</div>
                </div>
                <button className="fluent-btn-primary text-sm px-4">Procesar Archivo</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCapture;
