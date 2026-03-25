import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { abbreviateHash } from "@/lib/reportCertification";

const Verificar = () => {
  const [searchParams] = useSearchParams();
  const folioParam = searchParams.get("folio") ?? "";
  const [folioInput, setFolioInput] = useState(folioParam);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const verify = async (folio: string) => {
    if (!folio.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data, error: err } = await supabase
        .from("report_audit_log")
        .select("folio, hash_sha256, firma_digital, dataset_id, tipo_reporte, fecha_generacion, parametros_json, total_registros")
        .eq("folio", folio.trim())
        .maybeSingle();
      if (err) throw err;
      if (!data) {
        setError("Reporte no encontrado o inválido.");
        return;
      }
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Error al verificar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (folioParam) verify(folioParam);
  }, [folioParam]);

  const params = result?.parametros_json as Record<string, any> | null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">🔍 Verificación de Reporte</h1>
          <p className="text-sm text-muted-foreground">ECOMETRICS — Sistema de integridad documental</p>
        </div>

        <div className="border border-border rounded-lg bg-card p-6 shadow-sm">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2 block">
            Ingresa el folio del reporte
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={folioInput}
              onChange={e => setFolioInput(e.target.value)}
              placeholder="ECM-20260325-104532-A7K2"
              className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={e => e.key === "Enter" && verify(folioInput)}
            />
            <button
              onClick={() => verify(folioInput)}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "…" : "Verificar"}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              ❌ {error}
            </div>
          )}

          {result && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20">
                <span className="text-lg">✔</span>
                <div>
                  <p className="font-semibold text-primary text-sm">Documento verificado</p>
                  <p className="text-xs text-primary/70">Integridad confirmada</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] mt-3">
                <div>
                  <span className="text-muted-foreground">Folio:</span>
                  <p className="font-mono font-semibold">{result.folio}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha de generación:</span>
                  <p className="font-medium">{new Date(result.fecha_generacion).toLocaleString("es-MX")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo de reporte:</span>
                  <p className="font-medium">{result.tipo_reporte}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Período:</span>
                  <p className="font-medium">{params?.year ?? "—"} {params?.months ?? "Todos"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total de registros:</span>
                  <p className="font-semibold">{result.total_registros}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ID Dataset:</span>
                  <p className="font-mono text-[11px]">{result.dataset_id}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Hash (SHA-256 abreviado):</span>
                  <p className="font-mono text-[11px]">{abbreviateHash(result.hash_sha256)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/50 text-center mt-6 max-w-sm mx-auto leading-relaxed">
          Este módulo permite verificar la autenticidad e integridad de reportes generados por ECOMETRICS.
          No se exponen datos financieros ni información sensible.
        </p>
      </div>
    </div>
  );
};

export default Verificar;
