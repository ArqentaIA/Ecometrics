import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEcoMetrics, type KPITotals, type MaterialEntry } from "@/context/EcoMetricsContext";
import { calculateIndicators, type CatalogMaterial } from "@/lib/calculationEngine";

const EMPTY_TOTALS: KPITotals = { arboles: 0, co2: 0, energia: 0, agua: 0, kgBrutos: 0, kgNetos: 0, economicImpact: 0 };

export function useDashboardFilter() {
  const { user, catalog, catalogLoading } = useEcoMetrics();

  const [dashYear, setDashYear] = useState(new Date().getFullYear());
  // null = "all months" (default / cumulative mode)
  const [selectedMonths, setSelectedMonths] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Raw confirmed captures from DB
  const [captures, setCaptures] = useState<Array<{
    material_code: string;
    month: number;
    kg_brutos: number;
    kg_netos: number;
    is_confirmed: boolean;
    result_arboles: number;
    result_co2: number;
    result_energia: number;
    result_agua: number;
    result_economic_impact: number;
    cost_per_kg_applied: number;
  }>>([]);

  const loadDashboardCaptures = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("material_captures")
        .select("material_code, month, kg_brutos, kg_netos, is_confirmed, result_arboles, result_co2, result_energia, result_agua, result_economic_impact, cost_per_kg_applied")
        .eq("user_id", user.id)
        .eq("year", dashYear)
        .eq("is_confirmed", true);

      if (error) {
        console.error("Error loading dashboard captures:", error);
        return;
      }
      setCaptures((data ?? []).map(r => ({
        material_code: r.material_code,
        month: r.month,
        kg_brutos: Number(r.kg_brutos ?? 0),
        kg_netos: Number(r.kg_netos ?? 0),
        is_confirmed: r.is_confirmed ?? false,
        result_arboles: Number(r.result_arboles ?? 0),
        result_co2: Number(r.result_co2 ?? 0),
        result_energia: Number(r.result_energia ?? 0),
        result_agua: Number(r.result_agua ?? 0),
        result_economic_impact: Number(r.result_economic_impact ?? 0),
        cost_per_kg_applied: Number(r.cost_per_kg_applied ?? 0),
      })));
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [user, dashYear]);

  useEffect(() => {
    if (user && catalog.length > 0) loadDashboardCaptures();
  }, [user, catalog, loadDashboardCaptures]);

  // Filter captures by selected months (null = all)
  const filteredCaptures = useMemo(() => {
    if (!selectedMonths) return captures;
    return captures.filter(c => selectedMonths.includes(c.month));
  }, [captures, selectedMonths]);

  // Confirmed totals from filtered captures
  const confirmedTotals: KPITotals = useMemo(() =>
    filteredCaptures.reduce(
      (acc, s) => ({
        arboles: acc.arboles + s.result_arboles,
        co2: acc.co2 + s.result_co2,
        energia: acc.energia + s.result_energia,
        agua: acc.agua + s.result_agua,
        kgBrutos: acc.kgBrutos + s.kg_brutos,
        kgNetos: acc.kgNetos + s.kg_netos,
        economicImpact: acc.economicImpact + s.result_economic_impact,
      }),
      { ...EMPTY_TOTALS }
    ),
    [filteredCaptures]
  );

  // Build materialEntries from filtered captures (aggregated by material_code)
  const materialEntries: MaterialEntry[] = useMemo(() => {
    const byCode: Record<string, { kg: number; confirmed: boolean; kpis: { arboles: number; co2: number; energia: number; agua: number; kg_netos: number; economic_impact: number } }> = {};

    filteredCaptures.forEach(c => {
      if (!byCode[c.material_code]) {
        byCode[c.material_code] = { kg: 0, confirmed: false, kpis: { arboles: 0, co2: 0, energia: 0, agua: 0, kg_netos: 0, economic_impact: 0 } };
      }
      const entry = byCode[c.material_code];
      entry.kg += c.kg_brutos;
      entry.confirmed = true;
      entry.kpis.arboles += c.result_arboles;
      entry.kpis.co2 += c.result_co2;
      entry.kpis.energia += c.result_energia;
      entry.kpis.agua += c.result_agua;
      entry.kpis.kg_netos += c.kg_netos;
      entry.kpis.economic_impact += c.result_economic_impact;
    });

    return catalog.map(m => {
      const agg = byCode[m.code];
      if (agg) {
        return {
          material: m,
          kg: agg.kg,
          isConfirmed: true,
          kpis: {
            arboles: agg.kpis.arboles,
            co2: agg.kpis.co2,
            energia: agg.kpis.energia,
            agua: agg.kpis.agua,
            kg_netos: agg.kpis.kg_netos,
            kg_brutos: agg.kg,
            economic_impact: agg.kpis.economic_impact,
            uses_arboles: m.uses_arboles,
            uses_co2: m.uses_co2,
            uses_energia: m.uses_energia,
            uses_agua: m.uses_agua,
          },
        };
      }
      return {
        material: m,
        kg: 0,
        isConfirmed: false,
        kpis: calculateIndicators(m, 0, m.default_cost_per_kg ?? 0),
      };
    });
  }, [catalog, filteredCaptures]);

  const confirmedEntries = useMemo(() =>
    materialEntries.filter(e => e.isConfirmed && e.kg > 0),
    [materialEntries]
  );

  const toggleMonth = useCallback((month: number) => {
    setSelectedMonths(prev => {
      if (!prev) {
        // Switching from "all" mode to just this one month
        return [month];
      }
      if (prev.includes(month)) {
        const next = prev.filter(m => m !== month);
        // If no months selected, go back to "all" mode
        return next.length === 0 ? null : next;
      }
      return [...prev, month].sort((a, b) => a - b);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMonths(null);
  }, []);

  const isAllMonths = selectedMonths === null;

  return {
    dashYear,
    setDashYear,
    selectedMonths,
    toggleMonth,
    clearSelection,
    isAllMonths,
    confirmedTotals,
    materialEntries,
    confirmedEntries,
    loading,
    lastUpdated,
    refreshData: loadDashboardCaptures,
    catalogLoading,
  };
}
