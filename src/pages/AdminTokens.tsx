import { useState, useEffect, useCallback } from "react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

interface PublicToken {
  id: string;
  token: string;
  cliente: string;
  activo: boolean;
  fecha_creacion: string;
  notas: string | null;
}

const BASE_URL = "https://www.ecometrics.sbs/public-dashboard";

const generateToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
};

const AdminTokens = () => {
  const { user } = useEcoMetrics();
  const { role, loading: roleLoading } = useUserRole(user);
  const { toast } = useToast();

  const [tokens, setTokens] = useState<PublicToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCliente, setNewCliente] = useState("");
  const [newNotas, setNewNotas] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = role === "admin" || role === "administrador";

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("public_tokens" as any)
      .select("*")
      .order("fecha_creacion", { ascending: false });
    setTokens((data as any as PublicToken[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchTokens();
  }, [isAdmin, fetchTokens]);

  const toggleActive = async (t: PublicToken) => {
    await supabase
      .from("public_tokens" as any)
      .update({ activo: !t.activo } as any)
      .eq("id", t.id);
    setTokens(prev => prev.map(x => x.id === t.id ? { ...x, activo: !x.activo } : x));
    toast({ title: t.activo ? "Token desactivado" : "Token activado" });
  };

  const copyUrl = (token: string) => {
    navigator.clipboard.writeText(`${BASE_URL}?token=${token}`);
    toast({ title: "URL copiada al portapapeles" });
  };

  const handleCreate = async () => {
    if (!newCliente.trim()) return;
    setSaving(true);
    const token = generateToken();
    const { error } = await supabase.from("public_tokens" as any).insert({
      token,
      cliente: newCliente.trim(),
      notas: newNotas.trim() || null,
    } as any);
    if (error) {
      toast({ title: "Error al crear token", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Token creado exitosamente" });
      setNewCliente("");
      setNewNotas("");
      setShowForm(false);
      fetchTokens();
    }
    setSaving(false);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Verificando permisos…</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation showBell />
        <div className="flex items-center justify-center pt-32">
          <p className="text-destructive font-semibold">Acceso restringido a administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation showBell />

      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">🔑 Gestión de Tokens de Acceso Público</h1>
            <p className="text-xs text-muted-foreground mt-1">Administra los tokens de acceso al dashboard público para clientes externos.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="win-btn-accent text-sm px-4 py-2"
          >
            {showForm ? "Cancelar" : "+ Nuevo Token"}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="win-card p-5 mb-6 space-y-4">
            <h3 className="font-heading font-semibold text-sm">Crear nuevo token</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Nombre del cliente *</label>
                <input
                  value={newCliente}
                  onChange={e => setNewCliente(e.target.value)}
                  placeholder="Ej: Empresa ABC"
                  className="win-input text-sm w-full"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Notas (opcional)</label>
                <input
                  value={newNotas}
                  onChange={e => setNewNotas(e.target.value)}
                  placeholder="Ej: Contrato hasta dic 2026"
                  className="win-input text-sm w-full"
                  maxLength={255}
                />
              </div>
            </div>
            {newCliente.trim() && (
              <p className="text-xs text-muted-foreground">
                Token generado: <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-[11px]">{generateToken(newCliente)}</code>
                <span className="text-[10px] ml-2 opacity-60">(el valor final se genera al guardar)</span>
              </p>
            )}
            <button
              onClick={handleCreate}
              disabled={saving || !newCliente.trim()}
              className="win-btn-accent text-sm px-5 py-2 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Crear Token"}
            </button>
          </div>
        )}

        {/* Tokens Table */}
        <div className="win-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando tokens…</div>
          ) : tokens.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No hay tokens creados aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-nav text-nav-foreground">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">Token</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">Fecha Creación</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">Notas</th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t, i) => (
                    <tr
                      key={t.id}
                      className={`transition-colors duration-100 hover:bg-accent/50 ${i % 2 === 0 ? "bg-card" : "bg-accent/20"}`}
                    >
                      <td className="px-4 py-2.5">
                        <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px] font-mono">{t.token}</code>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{t.cliente}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.activo
                            ? "bg-primary/15 text-primary"
                            : "bg-destructive/15 text-destructive"
                        }`}>
                          {t.activo ? "● Activo" : "● Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {new Date(t.fecha_creacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs max-w-[200px] truncate">
                        {t.notas || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => toggleActive(t)}
                            className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                              t.activo
                                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                : "bg-primary/10 text-primary hover:bg-primary/20"
                            }`}
                          >
                            {t.activo ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => copyUrl(t.token)}
                            className="win-btn-standard text-[11px] px-2.5 py-1"
                          >
                            📋 Copiar URL
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTokens;
