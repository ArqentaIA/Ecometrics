import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Cliente {
  id: string;
  nombre: string;
  razon_social: string | null;
  rfc: string | null;
  direccion: string | null;
  contacto: string | null;
  correo: string | null;
  telefono: string | null;
  tipo: string;
  es_publico_general: boolean;
  activo: boolean;
  notas: string | null;
}

export interface NuevoClienteInput {
  nombre: string;
  razon_social?: string;
  rfc?: string;
  direccion?: string;
  contacto?: string;
  correo?: string;
  telefono?: string;
  tipo?: string;
  notas?: string;
}

/**
 * Carga el catálogo de clientes visibles para el usuario (RLS decide el alcance)
 * y expone el alta rápida. No hace ningún cambio en capturas.
 */
export function useClientes(enabled: boolean) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [canCreate, setCanCreate] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("activo", true)
      .order("es_publico_general", { ascending: true })
      .order("nombre", { ascending: true });
    if (error) {
      console.error("Error cargando clientes:", error);
      setClientes([]);
    } else {
      setClientes((data ?? []) as unknown as Cliente[]);
    }
    setLoading(false);
  }, [enabled]);

  useEffect(() => { load(); }, [load]);

  // Permiso de alta: depende de rol global (is_global_role) evaluado en BD.
  useEffect(() => {
    if (!enabled) { setCanCreate(false); return; }
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) { setCanCreate(false); return; }
      const { data, error } = await supabase.rpc("is_global_role", { _user_id: uid });
      setCanCreate(!error && data === true);
    })();
  }, [enabled]);

  const createCliente = useCallback(async (input: NuevoClienteInput): Promise<{ cliente: Cliente | null; error: string | null }> => {
    const nombre = input.nombre.trim();
    if (!nombre) return { cliente: null, error: "El nombre del cliente es obligatorio" };
    if (nombre.toLowerCase() === "público en general" || nombre.toLowerCase() === "publico en general") {
      return { cliente: null, error: "Ya existe el cliente Público en General" };
    }

    const payload: Record<string, any> = {
      nombre,
      razon_social: input.razon_social?.trim() || null,
      rfc: input.rfc?.trim() || null,
      direccion: input.direccion?.trim() || null,
      contacto: input.contacto?.trim() || null,
      correo: input.correo?.trim() || null,
      telefono: input.telefono?.trim() || null,
      tipo: input.tipo?.trim() || "cliente",
      notas: input.notas?.trim() || null,
      es_publico_general: false,
      activo: true,
    };

    const { data, error } = await supabase.from("clientes").insert(payload as any).select().single();
    if (error) return { cliente: null, error: error.message };

    const nuevo = data as unknown as Cliente;
    await load();
    return { cliente: nuevo, error: null };
  }, [load]);

  return { clientes, loading, canCreate, reload: load, createCliente };
}
