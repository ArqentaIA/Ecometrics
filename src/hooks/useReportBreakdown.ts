import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import { calculateIndicators, type CatalogMaterial, type CalculatedKPIs } from "@/lib/calculationEngine";

export const SIN_CLIENTE_ID = "__SIN_CLIENTE__";
export const SIN_CLIENTE_LABEL = "Sin cliente asignado";

export interface BreakdownRow {
  clienteId: string;
  clienteNombre: string;
  materialCode: string;
  materialName: string;
  material: CatalogMaterial;
  month: number;
  kgBrutos: number;
  kpis: CalculatedKPIs;
}

interface RawRow {
  cliente_id: string | null;
  material_code: string;
  month: number;
  kg_brutos: number | null;
  cost_per_kg_applied: number | null;
}

/**
 * Carga las capturas confirmadas del año y las descompone por
 * cliente / material / mes, recalculando siempre los indicadores.
 */
export function useReportBreakdown(year: number, enabled: boolean) {
  const { user, userRole, catalog, versionedFactors } = useEcoMetrics();
  const [raw, setRaw] = useState<RawRow[]>([]);
  const [clienteNames, setClienteNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isGlobalRole = userRole === "admin" || userRole === "administrador" || userRole === "direccion";

  const load = useCallback(async () => {
    if (!enabled || !user) return;
    setLoading(true);
    try {
      const sel = (s: string): string => s;
      let q = supabase
        .from("material_captures")
        .select(sel("cliente_id, material_code, month, kg_brutos, cost_per_kg_applied"))
        .eq("year", year)
        .eq("is_confirmed", true);
      if (!isGlobalRole) q = q.eq("user_id", user.id);

      const [capturesRes, clientesRes] = await Promise.all([
        q.returns<RawRow[]>(),
        supabase.from("clientes").select(sel("id, nombre")).returns<{ id: string; nombre: string }[]>(),
      ]);

      if (capturesRes.error) {
        console.error("REPORT_BREAKDOWN error:", capturesRes.error);
        setRaw([]);
      } else {
        setRaw(capturesRes.data ?? []);
      }

      const names: Record<string, string> = {};
      (clientesRes.data ?? []).forEach(c => { names[c.id] = c.nombre; });
      setClienteNames(names);
    } finally {
      setLoading(false);
    }
  }, [enabled, user, year, isGlobalRole]);

  useEffect(() => { load(); }, [load]);

  const catalogMap = useMemo(() => {
    const map: Record<string, CatalogMaterial> = {};
    catalog.forEach(m => { map[m.code] = m; });
    return map;
  }, [catalog]);

  const rows: BreakdownRow[] = useMemo(() => {
    return raw
      .map(r => {
        const mat = catalogMap[r.material_code];
        const kg = Number(r.kg_brutos ?? 0);
        if (!mat || kg <= 0) return null;
        const factor = versionedFactors[r.material_code] ?? null;
        const kpis = calculateIndicators(mat, kg, Number(r.cost_per_kg_applied ?? 0), factor);
        const cid = r.cliente_id ?? SIN_CLIENTE_ID;
        return {
          clienteId: cid,
          clienteNombre: r.cliente_id ? (clienteNames[r.cliente_id] ?? "Cliente") : SIN_CLIENTE_LABEL,
          materialCode: mat.code,
          materialName: mat.name,
          material: mat,
          month: Number(r.month),
          kgBrutos: kg,
          kpis,
        } as BreakdownRow;
      })
      .filter((r): r is BreakdownRow => r !== null);
  }, [raw, catalogMap, versionedFactors, clienteNames]);

  return { rows, loading, reload: load };
}
