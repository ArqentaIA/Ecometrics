import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { abbreviateHash } from "@/lib/reportCertification";
import logoImrGris from "@/assets/logo-imr-gris.png";

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
        .rpc("verify_report_by_folio", { _folio: folio.trim() });
      if (err) throw err;
      const record = Array.isArray(data) ? data[0] : data;
      if (!record) {
        setError("Reporte no encontrado o inválido.");
        return;
      }
      setResult(record);
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
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #f0f7f0 0%, #e8f5e9 50%, #f5f5f5 100%)" }}>
      {/* Header */}
      <header className="w-full border-b" style={{ borderColor: "#c8e6c9", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <img src={logoImrGris} alt="IMR Group" className="h-10 w-auto" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-800 uppercase">ECOMETRICS</h1>
            <p className="text-[10px] text-gray-500">Sistema de Integridad Documental</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Verificación de Reporte</h2>
            <p className="text-xs text-gray-500">Valide la autenticidad e integridad de un documento certificado por ECOMETRICS</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-200">
            <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
              Folio del reporte
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={folioInput}
                onChange={e => setFolioInput(e.target.value)}
                placeholder="ECM-20260325-104532-A7K2"
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500"
                onKeyDown={e => e.key === "Enter" && verify(folioInput)}
              />
              <button
                onClick={() => verify(folioInput)}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: "#2E7D32" }}
              >
                {loading ? "…" : "Verificar"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <span>❌</span> {error}
              </div>
            )}

            {result && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                  <span className="text-xl">✔</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#2E7D32" }}>Documento verificado</p>
                    <p className="text-[11px]" style={{ color: "#4CAF50" }}>Integridad confirmada — sin alteraciones detectadas</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px] mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider">Folio</span>
                    <p className="font-mono font-semibold text-gray-800">{result.folio}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider">Fecha de generación</span>
                    <p className="font-medium text-gray-800">{new Date(result.fecha_generacion).toLocaleString("es-MX")}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider">Tipo de reporte</span>
                    <p className="font-medium text-gray-800">{result.tipo_reporte}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider">Período</span>
                    <p className="font-medium text-gray-800">{params?.year ?? "—"} {Array.isArray(params?.months) ? params.months.join(", ") : params?.months ?? "Todos"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider">Total de registros</span>
                    <p className="font-semibold text-gray-800">{result.total_registros}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider">ID Dataset</span>
                    <p className="font-mono text-[11px] text-gray-800">{result.dataset_id}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider">Firma digital</span>
                    <p className="font-mono text-[11px] text-gray-800">{result.firma_digital}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider">Hash SHA-256 (abreviado)</span>
                    <p className="font-mono text-[11px] text-gray-800">{abbreviateHash(result.hash_sha256)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-6 max-w-sm mx-auto leading-relaxed">
            Este módulo permite verificar la autenticidad e integridad de reportes generados por el sistema ECOMETRICS.
            No se exponen datos financieros ni información sensible.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 py-3">
        <p className="text-[9px] text-gray-400 text-center">
          © {new Date().getFullYear()} ECOMETRICS — IMR Group. Sistema de integridad y trazabilidad documental.
        </p>
      </footer>
    </div>
  );
};

export default Verificar;
