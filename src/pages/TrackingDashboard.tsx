import { useEffect, useMemo, useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

/* ============================================================
 * TRACKING OPERATIVO — SIMULACIÓN CONTROLADA
 * 100% frontend. Sin backend, sin fetch, sin persistencia.
 * ============================================================ */

type PointStatus = "pendiente" | "en_atencion" | "completado";
type RouteStatus = "programada" | "en_curso" | "pausada" | "finalizada";

interface SimPoint {
  id: string;
  nombre: string;
  material?: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
  municipio?: string;
  lat: number;
  lng: number;
  status: PointStatus;
}

interface SimRoute {
  id: string;
  nombre: string;
  operador: string;
  status: RouteStatus;
  points: SimPoint[];
  trail: { lat: number; lng: number }[];
  op_lat: number;
  op_lng: number;
}

const MUNICIPIOS_QRO = [
  "Querétaro",
  "El Marqués",
  "Corregidora",
  "San Juan del Río",
  "Pedro Escobedo",
  "Colón",
  "Huimilpan",
];

const CLIENTES_CATALOGO = [
  { nombre: "Recicladora EcoQro", lat: 20.5931, lng: -100.3927, municipio: "Querétaro" },
  { nombre: "Plásticos Industriales del Bajío", lat: 20.6500, lng: -100.4100, municipio: "Querétaro" },
  { nombre: "Reprocesos Sustentables QRO", lat: 20.5500, lng: -100.3500, municipio: "Corregidora" },
  { nombre: "Centro de Acopio El Marqués", lat: 20.7100, lng: -100.2900, municipio: "El Marqués" },
  { nombre: "Reciclados Técnicos Querétaro", lat: 20.5800, lng: -100.4400, municipio: "Querétaro" },
];

const ROUTE_DEFS: Array<{ id: string; nombre: string; operador: string; base: { lat: number; lng: number } }> = [
  { id: "RC-QRO", nombre: "Ruta Centro QRO", operador: "Juan Pérez",  base: { lat: 20.5888, lng: -100.3899 } },
  { id: "RN-QRO", nombre: "Ruta Norte QRO",  operador: "María López", base: { lat: 20.7000, lng: -100.3500 } },
  { id: "RS-QRO", nombre: "Ruta Sur QRO",    operador: "Carlos Ruiz", base: { lat: 20.4500, lng: -100.3800 } },
];

const initialRoutes = (): SimRoute[] =>
  ROUTE_DEFS.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    operador: r.operador,
    status: "programada",
    points: [],
    trail: [],
    op_lat: r.base.lat,
    op_lng: r.base.lng,
  }));

// Nearest neighbor sequencing
function nearestNeighborOrder(start: { lat: number; lng: number }, pts: SimPoint[]): SimPoint[] {
  const remaining = [...pts];
  const ordered: SimPoint[] = [];
  let cur = start;
  while (remaining.length) {
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = Math.hypot(remaining[i].lat - cur.lat, remaining[i].lng - cur.lng);
      if (d < bestD) { bestD = d; bestIdx = i; }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    cur = { lat: next.lat, lng: next.lng };
  }
  return ordered;
}

const TrackingDashboard = () => {
  const [routes, setRoutes] = useState<SimRoute[]>(initialRoutes);
  const [selectedId, setSelectedId] = useState<string>(ROUTE_DEFS[0].id);
  const [clienteSel, setClienteSel] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [counter, setCounter] = useState(1);

  const route = routes.find((r) => r.id === selectedId)!;

  const updateRoute = (id: string, fn: (r: SimRoute) => SimRoute) =>
    setRoutes((rs) => rs.map((r) => (r.id === id ? fn(r) : r)));

  // ---- Simulación de movimiento del operador ----
  const tickRef = useRef<number | null>(null);
  useEffect(() => {
    if (route.status !== "en_curso") return;
    tickRef.current = window.setInterval(() => {
      setRoutes((rs) =>
        rs.map((r) => {
          if (r.id !== selectedId || r.status !== "en_curso") return r;
          // target = primer punto pendiente/en_atencion en orden
          const target = r.points.find((p) => p.status !== "completado");
          let nLat = r.op_lat;
          let nLng = r.op_lng;
          if (target) {
            const dx = target.lat - r.op_lat;
            const dy = target.lng - r.op_lng;
            nLat = r.op_lat + dx * 0.18 + (Math.random() - 0.5) * 0.0008;
            nLng = r.op_lng + dy * 0.18 + (Math.random() - 0.5) * 0.0008;
          }
          // Auto cambio a "en_atencion" si está cerca
          const points = r.points.map((p) => {
            if (p.status === "pendiente") {
              const d = Math.hypot(p.lat - nLat, p.lng - nLng);
              if (d < 0.003) return { ...p, status: "en_atencion" as PointStatus };
            }
            return p;
          });
          return {
            ...r,
            op_lat: nLat,
            op_lng: nLng,
            trail: [...r.trail, { lat: nLat, lng: nLng }].slice(-200),
            points,
          };
        }),
      );
    }, 5000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [route.status, selectedId]);

  // ---- Acciones ----
  const addClienteFromCatalog = (nombre: string) => {
    const tpl = CLIENTES_CATALOGO.find((c) => c.nombre === nombre);
    if (!tpl) return;
    const id = `C-${String(counter).padStart(3, "0")}`;
    setCounter((c) => c + 1);
    updateRoute(selectedId, (r) => {
      const np: SimPoint = {
        id,
        nombre: tpl.nombre,
        lat: tpl.lat + (Math.random() - 0.5) * 0.01,
        lng: tpl.lng + (Math.random() - 0.5) * 0.01,
        municipio: tpl.municipio,
        status: "pendiente",
      };
      const ordered = nearestNeighborOrder({ lat: r.op_lat, lng: r.op_lng }, [...r.points, np]);
      return { ...r, points: ordered };
    });
    toast({ title: "Cliente agregado", description: `${tpl.nombre} (${id})` });
    setClienteSel("");
  };

  const addClienteManual = (data: Omit<SimPoint, "id" | "status">) => {
    const id = `C-${String(counter).padStart(3, "0")}`;
    setCounter((c) => c + 1);
    updateRoute(selectedId, (r) => {
      const np: SimPoint = { ...data, id, status: "pendiente" };
      const ordered = nearestNeighborOrder({ lat: r.op_lat, lng: r.op_lng }, [...r.points, np]);
      return { ...r, points: ordered };
    });
    toast({ title: "Cliente agregado", description: `${data.nombre} (${id})` });
  };

  const setRouteStatus = (st: RouteStatus) => updateRoute(selectedId, (r) => ({ ...r, status: st }));

  const completePoint = (pid: string) =>
    updateRoute(selectedId, (r) => ({
      ...r,
      points: r.points.map((p) => (p.id === pid ? { ...p, status: "completado" } : p)),
    }));

  const completed = route.points.filter((p) => p.status === "completado").length;
  const total = route.points.length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-5 py-6">
        <header className="mb-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Módulo independiente · Simulación</p>
          <h1 className="text-2xl font-bold text-foreground">Tracking Operativo</h1>
          <p className="text-sm font-medium text-primary italic mt-0.5">
            La trazabilidad que respalda cada operación.
          </p>
          <p className="text-sm text-muted-foreground">
            Logística simulada de recolección industrial · <span className="text-amber-700 font-medium">Modo simulación controlada</span>
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* Sidebar de rutas */}
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
                    isActive ? "bg-primary/10 border-primary shadow-sm" : "bg-card border-border hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.nombre}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        r.status === "finalizada"
                          ? "bg-green-100 text-green-800"
                          : r.status === "en_curso"
                          ? "bg-blue-100 text-blue-800"
                          : r.status === "pausada"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.operador}</p>
                  <div className="flex items-center justify-between mt-2 text-[10px]">
                    <span className="text-muted-foreground">
                      {done}/{r.points.length || 5} puntos
                    </span>
                    <span className="text-muted-foreground">{r.id}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(done / Math.max(r.points.length, 1)) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Panel principal */}
          <section>
            {/* Header de ruta + controles */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg font-bold">{route.nombre}</h2>
                <p className="text-xs text-muted-foreground">
                  {route.operador} · {completed}/{total || 5} puntos · Estado: <span className="font-semibold capitalize">{route.status.replace("_", " ")}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={route.status === "en_curso" || route.points.length === 0}
                  onClick={() => { setRouteStatus("en_curso"); toast({ title: "Ruta iniciada" }); }}
                >
                  ▶ Iniciar Ruta
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={route.status !== "en_curso"}
                  onClick={() => { setRouteStatus("pausada"); toast({ title: "Ruta pausada" }); }}
                >
                  ⏸ Pausar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={route.status === "finalizada" || route.status === "programada"}
                  onClick={() => { setRouteStatus("finalizada"); toast({ title: "Ruta finalizada" }); }}
                >
                  ⏹ Finalizar
                </Button>
              </div>
            </div>

            {/* Selector de cliente + agregar */}
            <div className="bg-card border border-border rounded-lg p-3 mb-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[240px]">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Seleccionar cliente
                </label>
                <Select value={clienteSel} onValueChange={(v) => { setClienteSel(v); addClienteFromCatalog(v); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Elige un cliente reciclador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENTES_CATALOGO.map((c) => (
                      <SelectItem key={c.nombre} value={c.nombre}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setModalOpen(true)} className="self-end">
                + Agregar Cliente
              </Button>
            </div>

            {/* Mapa simulado */}
            <SimMap route={route} />

            {/* Tarjetas de puntos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {route.points.length === 0 && (
                <div className="col-span-full text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-lg">
                  Sin clientes en esta ruta. Agrega clientes desde el selector o el botón <strong>+ Agregar Cliente</strong>.
                </div>
              )}
              {route.points.map((p, idx) => (
                <div key={p.id} className="bg-card border border-border rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        p.status === "completado" ? "bg-green-600" : p.status === "en_atencion" ? "bg-amber-500" : "bg-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">{p.id} · {p.municipio ?? "Querétaro"}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 capitalize">
                    Estado: <span className="font-semibold">{p.status.replace("_", " ")}</span>
                  </p>
                  {p.status !== "completado" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 h-8 text-xs"
                      onClick={() => completePoint(p.id)}
                    >
                      ✓ Marcar completado
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground mt-4 text-center">
              Datos en memoria · Sin conexión a backend · Operador simulado se mueve cada 5 s
            </p>
          </section>
        </div>
      </main>

      {/* Modal Agregar Cliente */}
      <AddClienteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={addClienteManual}
      />
    </div>
  );
};

/* ============================================================
 * Mapa SVG simulado
 * ============================================================ */
const SimMap = ({ route }: { route: SimRoute }) => {
  const { points, trail, op_lat, op_lng } = route;

  const { project, viewBox, linePath, trailPath } = useMemo(() => {
    const allLats = [op_lat, ...points.map((p) => p.lat), ...trail.map((t) => t.lat)];
    const allLngs = [op_lng, ...points.map((p) => p.lng), ...trail.map((t) => t.lng)];
    const minLat = Math.min(...allLats) - 0.02;
    const maxLat = Math.max(...allLats) + 0.02;
    const minLng = Math.min(...allLngs) - 0.02;
    const maxLng = Math.max(...allLngs) + 0.02;
    const W = 1000, H = 600;
    const proj = (lat: number, lng: number) => ({
      x: ((lng - minLng) / (maxLng - minLng || 1)) * W,
      y: H - ((lat - minLat) / (maxLat - minLat || 1)) * H,
    });
    const linePath = points
      .map((p, i) => {
        const { x, y } = proj(p.lat, p.lng);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
    const trailPath = trail
      .map((t, i) => {
        const { x, y } = proj(t.lat, t.lng);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
    return { project: proj, viewBox: `0 0 ${W} ${H}`, linePath, trailPath };
  }, [points, trail, op_lat, op_lng]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner" style={{ height: 500 }}>
      <svg className="w-full h-full" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="sim-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
          </pattern>
          <filter id="sim-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#sim-grid)" />

        {/* Línea de ruta optimizada */}
        {points.length > 1 && (
          <path d={linePath} fill="none" stroke="#16a34a" strokeWidth="3" strokeDasharray="8 6" opacity="0.7" />
        )}
        {/* Trayectoria del operador */}
        {trail.length > 1 && (
          <path d={trailPath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        )}

        {/* Puntos cliente */}
        {points.map((p, idx) => {
          const { x, y } = project(p.lat, p.lng);
          const color = p.status === "completado" ? "#16a34a" : p.status === "en_atencion" ? "#f59e0b" : "#94a3b8";
          return (
            <g key={p.id}>
              <title>{`${idx + 1}. ${p.nombre} (${p.id})`}</title>
              <circle cx={x} cy={y} r="14" fill={color} opacity="0.25" />
              <circle cx={x} cy={y} r="10" fill={color} stroke="white" strokeWidth="2.5" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">{idx + 1}</text>
              <text x={x} y={y - 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(var(--foreground))">
                {p.nombre}
              </text>
            </g>
          );
        })}

        {/* Operador simulado */}
        <g filter="url(#sim-glow)">
          {(() => {
            const { x, y } = project(op_lat, op_lng);
            return (
              <>
                <circle cx={x} cy={y} r="22" fill="#3b82f6" opacity="0.25">
                  <animate attributeName="r" values="18;30;18" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={y} r="10" fill="#3b82f6" stroke="white" strokeWidth="3" />
              </>
            );
          })()}
        </g>
      </svg>

      <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 text-[11px] shadow-md border border-border">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Operador</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Completado</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> En atención</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Pendiente</span>
        </div>
      </div>
      <div className="absolute top-3 right-3 bg-amber-100 text-amber-900 text-[10px] px-2 py-1 rounded-md font-semibold border border-amber-300">
        SIMULACIÓN · Querétaro
      </div>
    </div>
  );
};

/* ============================================================
 * Modal: Agregar Cliente
 * ============================================================ */
const AddClienteModal = ({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: Omit<SimPoint, "id" | "status">) => void;
}) => {
  const [nombre, setNombre] = useState("");
  const [material, setMaterial] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [municipio, setMunicipio] = useState("Querétaro");
  const [lat, setLat] = useState("20.5888");
  const [lng, setLng] = useState("-100.3899");

  const reset = () => {
    setNombre(""); setMaterial(""); setContacto(""); setTelefono("");
    setDireccion(""); setMunicipio("Querétaro");
    setLat("20.5888"); setLng("-100.3899");
  };

  const handleSave = () => {
    if (!nombre.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" });
      return;
    }
    onSave({
      nombre: nombre.trim(),
      material: material.trim() || undefined,
      contacto: contacto.trim() || undefined,
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
      municipio,
      lat: parseFloat(lat) || 20.5888,
      lng: parseFloat(lng) || -100.3899,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar cliente reciclador</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre empresa</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Tipo de material</label>
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="PET, HDPE, Cartón..." />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Contacto</label>
            <Input value={contacto} onChange={(e) => setContacto(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Teléfono</label>
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Municipio</label>
            <Select value={municipio} onValueChange={setMunicipio}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MUNICIPIOS_QRO.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Dirección</label>
            <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Latitud</label>
            <Input value={lat} onChange={(e) => setLat(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Longitud</label>
            <Input value={lng} onChange={(e) => setLng(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Estado</label>
            <Input value="Querétaro" disabled />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar (solo en memoria)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrackingDashboard;
