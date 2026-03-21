import { useState, useEffect, useCallback } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PublicToken {
  id: string;
  token: string;
  cliente: string;
  pin: string;
  activo: boolean;
  fecha_creacion: string;
  notas: string | null;
  fecha_vencimiento: string | null;
}

const BASE_URL = "https://www.ecometrics.sbs/public-dashboard";

const generateToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
};

const generatePin = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(3));
  return Array.from(bytes, b => b.toString(10).padStart(3, "0")).join("").slice(0, 6);
};

const ExpiryBadge = ({ fecha }: { fecha: string | null }) => {
  if (!fecha) return <span className="text-muted-foreground text-xs">—</span>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = parseISO(fecha);
  const days = differenceInDays(expDate, today);
  const label = format(expDate, "dd MMM yyyy", { locale: es });

  if (days < 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/15 text-destructive">
        ⚠ {label}
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-700 dark:text-yellow-400">
        ⏳ {label}
      </span>
    );
  }
  return <span className="text-muted-foreground text-xs">{label}</span>;
};

const DatePickerField = ({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  placeholder?: string;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal text-sm h-9",
          !value && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
        {value ? format(value, "dd MMM yyyy", { locale: es }) : placeholder}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={value}
        onSelect={onChange}
        initialFocus
        className="p-3 pointer-events-auto"
        disabled={(date) => date < new Date()}
      />
    </PopoverContent>
  </Popover>
);

const AdminTokens = () => {
  const { user } = useEcoMetrics();
  const { role, loading: roleLoading } = useUserRole(user);
  const { toast } = useToast();

  const [tokens, setTokens] = useState<PublicToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCliente, setNewCliente] = useState("");
  const [newNotas, setNewNotas] = useState("");
  const [newPin, setNewPin] = useState(() => generatePin());
  const [newFechaVenc, setNewFechaVenc] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [editPinValue, setEditPinValue] = useState("");

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
    if (!newCliente.trim() || !newPin.trim() || !newFechaVenc) return;
    setSaving(true);
    const token = generateToken();
    const { error } = await supabase.from("public_tokens" as any).insert({
      token,
      cliente: newCliente.trim(),
      pin: newPin.trim(),
      notas: newNotas.trim() || null,
      fecha_vencimiento: format(newFechaVenc, "yyyy-MM-dd"),
    } as any);
    if (error) {
      toast({ title: "Error al crear token", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Token creado exitosamente" });
      setNewCliente("");
      setNewNotas("");
      setNewPin(generatePin());
      setNewFechaVenc(undefined);
      setShowForm(false);
      fetchTokens();
    }
    setSaving(false);
  };

  const savePin = async (t: PublicToken) => {
    if (!editPinValue.trim()) return;
    await supabase
      .from("public_tokens" as any)
      .update({ pin: editPinValue.trim() } as any)
      .eq("id", t.id);
    setTokens(prev => prev.map(x => x.id === t.id ? { ...x, pin: editPinValue.trim() } : x));
    setEditingPin(null);
    toast({ title: "PIN actualizado" });
  };

  const updateExpiry = async (t: PublicToken, date: Date | undefined) => {
    const val = date ? format(date, "yyyy-MM-dd") : null;
    await supabase
      .from("public_tokens" as any)
      .update({ fecha_vencimiento: val } as any)
      .eq("id", t.id);
    setTokens(prev => prev.map(x => x.id === t.id ? { ...x, fecha_vencimiento: val } : x));
    toast({ title: "Fecha de vencimiento actualizada" });
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <label className="text-[11px] text-muted-foreground mb-1 block font-medium">PIN de acceso *</label>
                <div className="flex gap-2">
                  <input
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    placeholder="Ej: 482910"
                    className="win-input text-sm w-full font-mono tracking-widest"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={() => setNewPin(generatePin())}
                    className="win-btn-standard text-[11px] px-2 whitespace-nowrap"
                  >
                    🔄
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Vencimiento *</label>
                <DatePickerField value={newFechaVenc} onChange={setNewFechaVenc} />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Notas (opcional)</label>
                <input
                  value={newNotas}
                  onChange={e => setNewNotas(e.target.value)}
                  placeholder="Ej: Contrato anual"
                  className="win-input text-sm w-full"
                  maxLength={255}
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !newCliente.trim() || !newPin.trim() || !newFechaVenc}
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
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">PIN</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">Vencimiento</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">Fecha creación</th>
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
                        <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px] font-mono">{t.token.slice(0, 12)}…</code>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{t.cliente}</td>
                      <td className="px-4 py-2.5">
                        {editingPin === t.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={editPinValue}
                              onChange={e => setEditPinValue(e.target.value)}
                              className="win-input text-[11px] font-mono tracking-widest w-20 py-0.5 px-1.5"
                              maxLength={20}
                              autoFocus
                              onKeyDown={e => e.key === "Enter" && savePin(t)}
                            />
                            <button onClick={() => savePin(t)} className="text-primary text-[11px] font-medium">✓</button>
                            <button onClick={() => setEditingPin(null)} className="text-muted-foreground text-[11px]">✕</button>
                          </div>
                        ) : (
                          <span
                            className="font-mono text-[11px] bg-secondary px-1.5 py-0.5 rounded cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => { setEditingPin(t.id); setEditPinValue(t.pin); }}
                            title="Clic para editar"
                          >
                            {t.pin || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.activo
                            ? "bg-primary/15 text-primary"
                            : "bg-destructive/15 text-destructive"
                        }`}>
                          {t.activo ? "● Activo" : "● Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="hover:bg-accent/50 rounded px-1 py-0.5 transition-colors" title="Clic para cambiar">
                              <ExpiryBadge fecha={t.fecha_vencimiento} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={t.fecha_vencimiento ? parseISO(t.fecha_vencimiento) : undefined}
                              onSelect={(d) => updateExpiry(t, d)}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {new Date(t.fecha_creacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
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
                            📋 URL
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
