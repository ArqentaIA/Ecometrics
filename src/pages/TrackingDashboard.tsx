import { useState } from "react";
import Navigation from "@/components/Navigation";
import TrackingMap from "@/components/tracking/TrackingMap";
import { useTrackingStore } from "@/stores/useTrackingStore";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const TrackingDashboard = () => {
  const routes = useTrackingStore((s) => s.routes);
  const [selectedId, setSelectedId] = useState(routes[0]?.id ?? "");
  const route = routes.find((r) => r.id === selectedId);

  const copyOperatorLink = (rutaId: string, token: string) => {
    const url = `${window.location.origin}/tracking?ruta_id=${rutaId}&token=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado", description: url });
  };

  const completed = route?.points.filter((p) => p.status === "completado").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-5 py-6">
        <header className="mb-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Módulo independiente</p>
          <h1 className="text-2xl font-bold text-foreground">Tracking Operativo</h1>
          <p className="text-sm text-muted-foreground">
            Visualización de rutas, ubicación de operadores y evidencia digital · <span className="text-amber-700 font-medium">Prototipo UI</span>
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* Routes sidebar */}
          <aside className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
              Rutas activas
            </p>
            {routes.map((r) => {
              const done = r.points.filter((p) => p.status === "completado").length;
              const isActive = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-card border-border hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.nombre}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        r.status === "finalizada"
                          ? "bg-green-100 text-green-800"
                          : r.status === "en_transito" || r.status === "en_proceso"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.operador}</p>
                  <div className="flex items-center justify-between mt-2 text-[10px]">
                    <span className="text-muted-foreground">
                      {done}/{r.points.length} puntos
                    </span>
                    <span className="text-muted-foreground">{r.id}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(done / r.points.length) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Main panel */}
          <section>
            {route && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold">{route.nombre}</h2>
                    <p className="text-xs text-muted-foreground">
                      {route.operador} · {completed}/{route.points.length} puntos completados ·{" "}
                      {route.last_update
                        ? `Última señal hace ${Math.round((Date.now() - route.last_update) / 60000)} min`
                        : "Sin señal aún"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copyOperatorLink(route.id, route.token)}>
                    🔗 Copiar link operador
                  </Button>
                </div>

                <TrackingMap route={route} height={500} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  {route.points.map((p, idx) => (
                    <div
                      key={p.id}
                      className="bg-card border border-border rounded-lg p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            p.status === "completado"
                              ? "bg-green-600"
                              : p.status === "en_atencion"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.nombre}</p>
                          <p className="text-[10px] text-muted-foreground">{p.centro_id}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 capitalize">
                        {p.status.replace("_", " ")}
                        {p.evidencia_url && " · 📷 evidencia"}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-muted-foreground mt-4 text-center">
                  Datos en memoria (prototipo). Reemplazar con endpoints reales:
                  <code className="ml-2 bg-muted px-1.5 py-0.5 rounded">POST /tracking/location</code>
                  <code className="ml-2 bg-muted px-1.5 py-0.5 rounded">POST /tracking/evidence</code>
                  <code className="ml-2 bg-muted px-1.5 py-0.5 rounded">GET /tracking/route/:id</code>
                </p>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default TrackingDashboard;
