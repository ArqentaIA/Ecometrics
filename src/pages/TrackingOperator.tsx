import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTrackingStore } from "@/stores/useTrackingStore";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const TrackingOperator = () => {
  const [params] = useSearchParams();
  const ruta_id = params.get("ruta_id") ?? "R-001";
  const token = params.get("token") ?? "";

  const route = useTrackingStore((s) => s.routes.find((r) => r.id === ruta_id));
  const startRoute = useTrackingStore((s) => s.startRoute);
  const finishRoute = useTrackingStore((s) => s.finishRoute);
  const pushLocation = useTrackingStore((s) => s.pushLocation);
  const setPointStatus = useTrackingStore((s) => s.setPointStatus);
  const setEvidence = useTrackingStore((s) => s.setEvidence);

  const intervalRef = useRef<number | null>(null);
  const [simIndex, setSimIndex] = useState(0);

  const currentPoint = useMemo(
    () => route?.points.find((p) => p.status !== "completado"),
    [route],
  );

  // Mock GPS: walk from previous toward currentPoint, every 5s for demo (real spec: 60s)
  useEffect(() => {
    if (!route || route.status !== "en_transito" && route.status !== "en_proceso") return;
    if (!currentPoint) return;

    const startLat = route.current_lat ?? route.points[0].lat - 0.01;
    const startLng = route.current_lng ?? route.points[0].lng - 0.01;

    intervalRef.current = window.setInterval(() => {
      setSimIndex((i) => i + 1);
      const last = useTrackingStore.getState().routes.find((r) => r.id === ruta_id);
      const lat0 = last?.current_lat ?? startLat;
      const lng0 = last?.current_lng ?? startLng;
      const dx = currentPoint.lat - lat0;
      const dy = currentPoint.lng - lng0;
      const step = 0.18;
      pushLocation(ruta_id, {
        lat: lat0 + dx * step + (Math.random() - 0.5) * 0.0008,
        lng: lng0 + dy * step + (Math.random() - 0.5) * 0.0008,
        timestamp: Date.now(),
      });
    }, 5000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [route?.status, currentPoint?.id, ruta_id]);

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center">
          <p className="text-lg font-semibold">Ruta no encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">ruta_id: {ruta_id}</p>
        </div>
      </div>
    );
  }

  const lastUpdateMin = route.last_update
    ? Math.max(0, Math.round((Date.now() - route.last_update) / 60000))
    : null;

  const statusLabel = {
    programada: "Programada",
    en_transito: "🚚 En tránsito",
    en_proceso: "📍 En proceso",
    finalizada: "✓ Finalizada",
  }[route.status];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-3">
          <h1 className="font-heading text-[18px] font-bold tracking-tight uppercase">IRM Circular Intelligence</h1>
        </div>
        <header className="mb-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Tracking Operativo</p>
          <h2 className="text-xl font-bold">{route.nombre}</h2>
          <p className="text-sm text-slate-300">Operador: {route.operador}</p>
        </header>

        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Estado</span>
            <span className="text-sm font-semibold">{statusLabel}</span>
          </div>
          {lastUpdateMin !== null && (
            <p className="text-[11px] text-slate-400 mt-1">
              Última actualización hace {lastUpdateMin} min
            </p>
          )}
        </div>

        {route.status === "programada" && (
          <Button
            className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              startRoute(route.id);
              pushLocation(route.id, {
                lat: route.points[0].lat - 0.008,
                lng: route.points[0].lng - 0.008,
                timestamp: Date.now(),
              });
              toast({ title: "Ruta iniciada", description: "GPS activo" });
            }}
          >
            🚀 Iniciar Ruta
          </Button>
        )}

        {(route.status === "en_transito" || route.status === "en_proceso") && (
          <div className="space-y-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Próximo punto</p>
              {currentPoint ? (
                <>
                  <p className="text-lg font-bold">{currentPoint.nombre}</p>
                  <p className="text-xs text-slate-400">{currentPoint.centro_id}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {currentPoint.lat.toFixed(4)}, {currentPoint.lng.toFixed(4)}
                  </p>

                  <div className="grid grid-cols-1 gap-2 mt-4">
                    {currentPoint.status === "pendiente" && (
                      <Button
                        className="h-12 bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => {
                          setPointStatus(route.id, currentPoint.id, "en_atencion");
                          toast({ title: "Llegaste al punto" });
                        }}
                      >
                        📍 Llegué al punto
                      </Button>
                    )}
                    {currentPoint.status === "en_atencion" && (
                      <>
                        <Button
                          variant="secondary"
                          className="h-12"
                          onClick={() => {
                            setEvidence(route.id, currentPoint.id, `mock://photo-${Date.now()}.jpg`);
                            toast({ title: "Evidencia subida", description: "Foto + GPS + timestamp" });
                          }}
                        >
                          📷 Subir evidencia {currentPoint.evidencia_url && "✓"}
                        </Button>
                        <Button
                          className="h-12 bg-green-600 hover:bg-green-700"
                          disabled={!currentPoint.evidencia_url}
                          onClick={() => {
                            setPointStatus(route.id, currentPoint.id, "completado");
                            toast({ title: "Punto finalizado" });
                          }}
                        >
                          ✓ Finalizar punto
                        </Button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-300">Todos los puntos completados</p>
              )}
            </div>

            <Button
              variant="destructive"
              className="w-full h-12"
              onClick={() => {
                finishRoute(route.id);
                toast({ title: "Ruta finalizada" });
              }}
            >
              🏁 Finalizar ruta
            </Button>
          </div>
        )}

        {route.status === "finalizada" && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-6 text-center">
            <p className="text-2xl mb-2">✓</p>
            <p className="font-semibold">Ruta finalizada</p>
            <p className="text-xs text-slate-300 mt-1">
              {route.points.filter((p) => p.status === "completado").length} de {route.points.length} puntos
            </p>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Puntos de la ruta</p>
          {route.points.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-white/5 rounded-lg p-2.5 border border-white/5"
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  p.status === "completado"
                    ? "bg-green-600"
                    : p.status === "en_atencion"
                    ? "bg-amber-500"
                    : "bg-slate-600"
                }`}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.nombre}</p>
                <p className="text-[10px] text-slate-400">{p.centro_id}</p>
              </div>
              <span className="text-[10px] text-slate-400 capitalize">{p.status.replace("_", " ")}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-slate-500 mt-6">
          Token: {token || "—"} · Sim. step #{simIndex}
        </p>
      </div>
    </div>
  );
};

export default TrackingOperator;
