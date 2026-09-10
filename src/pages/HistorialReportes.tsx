import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import Navigation from "@/components/Navigation";
import acLogo from "@/assets/logo-ac-recicladores.png";
import logoImrGris from "@/assets/logo-imr-gris.png";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface ReporteRow {
  id: string;
  folio: string;
  hash_sha256: string;
  tipo_reporte: string;
  fecha_generacion: string;
  total_registros: number;
  parametros_json: any;
}

const HistorialReportes = () => {
  const { user } = useEcoMetrics();
  const [rows, setRows] = useState<ReporteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("report_audit_log")
        .select("id, folio, hash_sha256, tipo_reporte, fecha_generacion, total_registros, parametros_json")
        .order("fecha_generacion", { ascending: false })
        .limit(100);
      if (cancel) return;
      if (error) setError(error.message);
      else setRows((data ?? []) as ReporteRow[]);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.folio.toLowerCase().includes(q) ||
      (r.parametros_json?.recipient?.company ?? "").toLowerCase().includes(q) ||
      (r.parametros_json?.cliente ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const fmtFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const destinatario = (p: any) =>
    p?.recipient?.company || p?.cliente || "—";

  const copiar = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado` });
  };

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
          <img src={logoImrGris} alt="IRM Circular Intelligence" className="h-20 w-auto object-contain" />
          <div className="flex-1 text-center">
            <h1 className="font-heading text-[28px] font-bold text-foreground tracking-tight uppercase">IRM Circular Intelligence</h1>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground">Historial de Reportes</h2>
            <p className="text-sm text-muted-foreground">
              Últimos 100 reportes generados y certificados
            </p>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar folio o destinatario..."
            className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                Cargando historial...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                Aún no hay reportes generados.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Fecha de emisión</TableHead>
                    <TableHead>Destinatario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-semibold">{r.folio}</TableCell>
                      <TableCell className="text-sm">{fmtFecha(r.fecha_generacion)}</TableCell>
                      <TableCell className="text-sm">{destinatario(r.parametros_json)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.tipo_reporte}</TableCell>
                      <TableCell className="text-sm text-right">{r.total_registros}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {r.hash_sha256.slice(0, 12)}…
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => copiar(r.folio, "Folio")}>Copiar folio</Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/verificar?folio=${encodeURIComponent(r.folio)}`}>Verificar</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HistorialReportes;
