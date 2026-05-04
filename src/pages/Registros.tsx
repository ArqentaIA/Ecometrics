import { useEffect, useState, useMemo, useCallback } from "react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import { useRegistrosStore } from "@/stores/useRegistrosStore";
import Navigation from "@/components/Navigation";
import HeaderLogos from "@/components/HeaderLogos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { formatKPI } from "@/lib/calculationEngine";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const Registros = () => {
  const { user, catalog, versionedFactors, userRole } = useEcoMetrics();
  const { registros, loading, error, undoStack, cargarRegistros, eliminarRegistro, restaurarRegistro, getKPIs } = useRegistrosStore();

  const [dashYear, setDashYear] = useState(new Date().getFullYear());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const isGlobalRole = userRole === "admin" || userRole === "administrador" || userRole === "direccion";

  useEffect(() => {
    if (user && catalog.length > 0) {
      cargarRegistros(dashYear, isGlobalRole, user.id);
    }
  }, [user, catalog, dashYear, isGlobalRole, cargarRegistros]);

  const kpis = useMemo(() => getKPIs(catalog, versionedFactors), [registros, catalog, versionedFactors, getKPIs]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    const { error } = await eliminarRegistro(id);
    setDeletingId(null);
    if (error) {
      toast({ title: "Error al eliminar", description: error, variant: "destructive" });
    } else {
      toast({ title: "Registro eliminado", description: "Puedes deshacer esta acción." });
    }
  }, [eliminarRegistro]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    const { error } = await restaurarRegistro();
    setRestoring(false);
    if (error) {
      toast({ title: "Error al restaurar", description: error, variant: "destructive" });
    } else {
      toast({ title: "Registro restaurado" });
    }
  }, [restaurarRegistro]);

  const kpiCards = [
    { label: "Volumen Total (kg)", value: formatKPI("kg_brutos", kpis.kgBrutos), icon: "📦" },
    { label: "Impacto Económico", value: `$${formatKPI("economic_impact", kpis.economicImpact)}`, icon: "💰" },
    { label: "CO₂e Evitado (t)", value: formatKPI("co2", kpis.co2), icon: "🌿" },
    { label: "Energía Ahorrada (kWh)", value: formatKPI("energia", kpis.energia), icon: "⚡" },
    { label: "Agua Conservada (L)", value: formatKPI("agua", kpis.agua), icon: "💧" },
    { label: "Árboles Preservados", value: formatKPI("arboles", kpis.arboles), icon: "🌳" },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Banner */}
      <section className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, hsl(120 30% 82% / 0.5), hsl(90 25% 86% / 0.5))",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <img src={acLogo} alt="" className="absolute right-[196px] top-1/2 -translate-y-1/2 h-[85%] object-contain object-right" style={{ width: "22%", opacity: 0.95 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, hsl(120 30% 82%) 35%, hsl(120 30% 82% / 0.6) 50%, transparent 75%)" }} />
        </div>
        <div className="max-w-7xl mx-auto px-5 py-5 flex items-center gap-6 relative z-10">
          <img src={logoImrGris} alt="IMR Group" className="h-20 w-auto object-contain" />
          <div className="flex-1 text-center" style={{ transform: "translateX(-120px)" }}>
            <h1 className="font-heading text-[28px] font-bold text-foreground tracking-tight uppercase">IMR Circular Intelligence</h1>
            <p className="font-heading text-[13px] text-muted-foreground tracking-wide mt-1">La trazabilidad que respalda cada operación.</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground font-[var(--font-heading)]">Registros</h1>
            <p className="text-sm text-muted-foreground">
              Últimos 100 registros confirmados — {dashYear}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {undoStack.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleRestore} disabled={restoring}>
                ↩ Deshacer ({undoStack.length})
              </Button>
            )}
            <select
              value={dashYear}
              onChange={e => setDashYear(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpiCards.map(k => (
            <Card key={k.label} className="border-border/50">
              <CardContent className="p-3 text-center">
                <span className="text-lg">{k.icon}</span>
                <p className="text-xs text-muted-foreground mt-1 leading-tight">{k.label}</p>
                <p className="text-base font-bold text-foreground mt-0.5">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                Cargando registros...
              </div>
            ) : registros.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                No hay registros confirmados para {dashYear}
              </div>
            ) : (
              <div className="overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold">Folio</TableHead>
                      <TableHead className="text-xs font-semibold">Material</TableHead>
                      <TableHead className="text-xs font-semibold">Familia</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Kg Brutos</TableHead>
                      <TableHead className="text-xs font-semibold text-right">$/kg</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Imp. Económico</TableHead>
                      <TableHead className="text-xs font-semibold">Proveedor</TableHead>
                      <TableHead className="text-xs font-semibold">Mes</TableHead>
                      <TableHead className="text-xs font-semibold">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold">Hora</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map(r => (
                      <TableRow key={r.id} className="text-[13px]">
                        <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                          {r.folio ? r.folio.slice(0, 16) : "—"}
                        </TableCell>
                        <TableCell className="py-2 font-medium">{r.material_name ?? r.material_code}</TableCell>
                        <TableCell className="py-2 text-muted-foreground">{r.family ?? "—"}</TableCell>
                        <TableCell className="py-2 text-right tabular-nums">
                          {r.kg_brutos.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="py-2 text-right tabular-nums">
                          ${(r.cost_per_kg_applied ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="py-2 text-right tabular-nums font-medium">
                          ${(r.result_economic_impact ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="py-2">{r.proveedor ?? "—"}</TableCell>
                        <TableCell className="py-2">{MONTHS[(r.month - 1)] ?? r.month}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("es-MX")}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                          >
                            {deletingId === r.id ? "..." : "🗑 Eliminar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          {registros.length} registro{registros.length !== 1 ? "s" : ""} mostrado{registros.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

export default Registros;
