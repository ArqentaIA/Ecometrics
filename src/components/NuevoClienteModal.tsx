import { useState } from "react";
import type { NuevoClienteInput } from "@/hooks/useClientes";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: NuevoClienteInput) => Promise<{ error: string | null }>;
}

const EMPTY: NuevoClienteInput = {
  nombre: "", razon_social: "", rfc: "", direccion: "",
  contacto: "", correo: "", telefono: "", tipo: "cliente", notas: "",
};

export default function NuevoClienteModal({ open, onClose, onCreate }: Props) {
  const [form, setForm] = useState<NuevoClienteInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const set = (k: keyof NuevoClienteInput, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    const res = await onCreate(form);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setForm(EMPTY);
    onClose();
  };

  const field = (label: string, key: keyof NuevoClienteInput, required = false, type = "text") => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      <input
        type={type}
        value={(form[key] as string) ?? ""}
        onChange={e => set(key, e.target.value)}
        className="win-input text-sm"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto hide-scrollbar rounded-xl border border-border bg-card p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold">Nuevo cliente</h2>
          <button type="button" onClick={onClose} className="win-btn-subtle px-2 py-1 text-sm rounded-md">✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field("Nombre", "nombre", true)}
          {field("Razón social", "razon_social")}
          {field("RFC", "rfc")}
          {field("Tipo", "tipo")}
          {field("Contacto", "contacto")}
          {field("Correo", "correo", false, "email")}
          {field("Teléfono", "telefono")}
          {field("Dirección", "direccion")}
        </div>

        <div className="flex flex-col gap-1 mt-3">
          <label className="text-[11px] font-medium text-muted-foreground">Notas</label>
          <textarea
            value={form.notas ?? ""}
            onChange={e => set("notas", e.target.value)}
            rows={2}
            className="win-input text-sm"
          />
        </div>

        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="win-btn-standard text-xs px-4">Cancelar</button>
          <button type="submit" disabled={saving} className="win-btn-accent text-xs px-4 disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
