import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { calculateIndicators, type CatalogMaterial, type VersionedFactor } from "@/lib/calculationEngine";

export interface RegistroRow {
  id: string;
  material_code: string;
  material_name: string | null;
  family: string | null;
  kg_brutos: number;
  kg_netos: number | null;
  cost_per_kg_applied: number | null;
  result_co2: number | null;
  result_energia: number | null;
  result_agua: number | null;
  result_arboles: number | null;
  result_economic_impact: number | null;
  month: number;
  year: number;
  proveedor: string | null;
  folio: string | null;
  status: string;
  is_confirmed: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrosKPIs {
  arboles: number;
  co2: number;
  energia: number;
  agua: number;
  kgBrutos: number;
  kgNetos: number;
  economicImpact: number;
}

const EMPTY_KPIS: RegistrosKPIs = { arboles: 0, co2: 0, energia: 0, agua: 0, kgBrutos: 0, kgNetos: 0, economicImpact: 0 };

interface RegistrosState {
  registros: RegistroRow[];
  loading: boolean;
  error: string | null;
  undoStack: RegistroRow[];

  cargarRegistros: (year: number, isGlobalRole: boolean, userId?: string) => Promise<void>;
  eliminarRegistro: (id: string) => Promise<{ error: string | null }>;
  restaurarRegistro: () => Promise<{ error: string | null }>;

  // Derived
  getKPIs: (catalog: CatalogMaterial[], factors: Record<string, VersionedFactor>) => RegistrosKPIs;
}

export const useRegistrosStore = create<RegistrosState>((set, get) => ({
  registros: [],
  loading: false,
  error: null,
  undoStack: [],

  cargarRegistros: async (year, isGlobalRole, userId) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from("material_captures")
        .select("id, material_code, material_name, family, kg_brutos, kg_netos, cost_per_kg_applied, result_co2, result_energia, result_agua, result_arboles, result_economic_impact, month, year, proveedor, folio, status, is_confirmed, created_at, updated_at")
        .eq("year", year)
        .eq("is_confirmed", true)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!isGlobalRole && userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }

      const rows: RegistroRow[] = (data ?? []).map((r: any) => ({
        id: r.id,
        material_code: r.material_code,
        material_name: r.material_name,
        family: r.family,
        kg_brutos: Number(r.kg_brutos ?? 0),
        kg_netos: r.kg_netos != null ? Number(r.kg_netos) : null,
        cost_per_kg_applied: r.cost_per_kg_applied != null ? Number(r.cost_per_kg_applied) : null,
        result_co2: r.result_co2 != null ? Number(r.result_co2) : null,
        result_energia: r.result_energia != null ? Number(r.result_energia) : null,
        result_agua: r.result_agua != null ? Number(r.result_agua) : null,
        result_arboles: r.result_arboles != null ? Number(r.result_arboles) : null,
        result_economic_impact: r.result_economic_impact != null ? Number(r.result_economic_impact) : null,
        month: r.month,
        year: r.year,
        proveedor: r.proveedor,
        folio: r.folio,
        status: r.status,
        is_confirmed: r.is_confirmed,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      set({ registros: rows, loading: false });
    } catch (e: any) {
      set({ error: e.message ?? "Error desconocido", loading: false });
    }
  },

  eliminarRegistro: async (id) => {
    const { registros } = get();
    const target = registros.find(r => r.id === id);
    if (!target) return { error: "Registro no encontrado" };

    // Delete from DB
    const { error } = await supabase
      .from("material_captures")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };

    // Remove from local state, push to undo
    set(state => ({
      registros: state.registros.filter(r => r.id !== id),
      undoStack: [target, ...state.undoStack].slice(0, 10),
    }));

    // Signal dashboard to refresh
    window.dispatchEvent(new CustomEvent("capture-confirmed"));

    return { error: null };
  },

  restaurarRegistro: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return { error: "No hay registros para restaurar" };

    const target = undoStack[0];

    // Re-insert into DB
    const { error } = await supabase
      .from("material_captures")
      .insert({
        material_code: target.material_code,
        material_name: target.material_name,
        family: target.family,
        kg_brutos: target.kg_brutos,
        kg_netos: target.kg_netos,
        cost_per_kg_applied: target.cost_per_kg_applied,
        result_co2: target.result_co2,
        result_energia: target.result_energia,
        result_agua: target.result_agua,
        result_arboles: target.result_arboles,
        result_economic_impact: target.result_economic_impact,
        month: target.month,
        year: target.year,
        proveedor: target.proveedor,
        status: target.status,
        is_confirmed: target.is_confirmed,
        user_id: (await supabase.auth.getUser()).data.user?.id ?? "",
      } as any);

    if (error) return { error: error.message };

    // Add back to registros in sorted position, remove from undo
    set(state => {
      const newRegistros = [target, ...state.registros]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 100);
      return {
        registros: newRegistros,
        undoStack: state.undoStack.slice(1),
      };
    });

    window.dispatchEvent(new CustomEvent("capture-confirmed"));
    return { error: null };
  },

  getKPIs: (catalog, factors) => {
    const { registros } = get();
    const catalogMap: Record<string, CatalogMaterial> = {};
    catalog.forEach(m => { catalogMap[m.code] = m; });

    return registros.reduce((acc, r) => {
      const mat = catalogMap[r.material_code];
      if (!mat) {
        // Fallback to stored values
        return {
          arboles: acc.arboles + (r.result_arboles ?? 0),
          co2: acc.co2 + (r.result_co2 ?? 0),
          energia: acc.energia + (r.result_energia ?? 0),
          agua: acc.agua + (r.result_agua ?? 0),
          kgBrutos: acc.kgBrutos + r.kg_brutos,
          kgNetos: acc.kgNetos + (r.kg_netos ?? 0),
          economicImpact: acc.economicImpact + (r.result_economic_impact ?? 0),
        };
      }
      const factor = factors[r.material_code] ?? null;
      const kpis = calculateIndicators(mat, r.kg_brutos, r.cost_per_kg_applied ?? mat.default_cost_per_kg ?? 0, factor);
      return {
        arboles: acc.arboles + kpis.arboles,
        co2: acc.co2 + kpis.co2,
        energia: acc.energia + kpis.energia,
        agua: acc.agua + kpis.agua,
        kgBrutos: acc.kgBrutos + r.kg_brutos,
        kgNetos: acc.kgNetos + kpis.kg_netos,
        economicImpact: acc.economicImpact + kpis.economic_impact,
      };
    }, { ...EMPTY_KPIS });
  },
}));
