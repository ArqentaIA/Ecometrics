import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEcoMetrics, type KPITotals, type MaterialEntry } from "@/context/EcoMetricsContext";
import { calculateIndicators, type CatalogMaterial } from "@/lib/calculationEngine";

const EMPTY_TOTALS: KPITotals = { arboles: 0, co2: 0, energia: 0, agua: 0, kgBrutos: 0, kgNetos: 0, economicImpact: 0 };

export function useDashboardFilter() {
  const { user, catalog, catalogLoading, userRole } = useEcoMetrics();

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
    proveedor: string | null;
  }>>([]);

  const isGlobalRole = userRole === 'admin' || userRole === 'administrador' || userRole === 'direccion';

  const loadDashboardCaptures = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from("material_captures")
        .select("material_code, month, kg_brutos, kg_netos, is_confirmed, result_arboles, result_co2, result_energia, result_agua, result_economic_impact")
        .eq("year", dashYear)
        .eq("is_confirmed", true);

      // Only filter by user_id for non-global roles
      if (!isGlobalRole) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

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
      })));
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [user, dashYear, isGlobalRole]);

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
            economic_impact: agg.kpis.economic_impact,
            yield_applied: m.default_yield,
            uses_arboles: m.uses_arboles,
            uses_co2: m.uses_co2,
            uses_energia: m.uses_energia,
            uses_agua: m.uses_agua,
            factor_arboles: m.factor_arboles,
            factor_co2: m.factor_co2,
            factor_energia: m.factor_energia,
            factor_agua: m.factor_agua,
            factor_version: null,
            impacto_valido: (m as any).impacto_valido !== false,
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

  // ── AUDIT CAPA 3: Datos recibidos en UI (Dashboard) ──
  console.log("AUDIT_UI_INPUT_DASHBOARD", {
    total: materialEntries?.length,
    materiales: materialEntries?.map(m => ({
      id: m.material.code,
      nombre: m.material.name,
    })),
  });

  const confirmedEntries = useMemo(() =>
    materialEntries.filter(e => e.isConfirmed && e.kg > 0),
    [materialEntries]
  );

  // ── AUDIT CAPA 4: Resultado final después de filtros ──
  console.log("AUDIT_UI_FINAL_DASHBOARD", {
    total: confirmedEntries?.length,
    materiales: confirmedEntries?.map(m => ({
      id: m.material.code,
      nombre: m.material.name,
    })),
  });

  // Full-year economic breakdown (always 12 months, all captures — for shadow layer)
  const allMonthsEconomic = useMemo(() => {
    const byMonth: Record<number, number> = {};
    captures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.result_economic_impact;
    });
    return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: byMonth[i + 1] ?? 0 }));
  }, [captures]);

  // Monthly economic breakdown for filtered view
  const monthlyEconomic = useMemo(() => {
    const byMonth: Record<number, number> = {};
    filteredCaptures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.result_economic_impact;
    });
    const months = selectedMonths ?? Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(m => ({ month: m, value: byMonth[m] ?? 0 }));
  }, [filteredCaptures, selectedMonths]);

  // Full-year CO2 breakdown (always 12 months — shadow layer)
  const allMonthsCo2 = useMemo(() => {
    const byMonth: Record<number, number> = {};
    captures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.result_co2;
    });
    return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: byMonth[i + 1] ?? 0 }));
  }, [captures]);

  // Monthly CO2 breakdown for filtered view
  const monthlyCo2 = useMemo(() => {
    const byMonth: Record<number, number> = {};
    filteredCaptures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.result_co2;
    });
    const months = selectedMonths ?? Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(m => ({ month: m, value: byMonth[m] ?? 0 }));
  }, [filteredCaptures, selectedMonths]);

  // Full-year energy breakdown (always 12 months — shadow layer)
  const allMonthsEnergia = useMemo(() => {
    const byMonth: Record<number, number> = {};
    captures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.result_energia;
    });
    return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: byMonth[i + 1] ?? 0 }));
  }, [captures]);

  // Monthly energy breakdown for filtered view
  const monthlyEnergia = useMemo(() => {
    const byMonth: Record<number, number> = {};
    filteredCaptures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.result_energia;
    });
    const months = selectedMonths ?? Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(m => ({ month: m, value: byMonth[m] ?? 0 }));
  }, [filteredCaptures, selectedMonths]);

  // Full-year trees breakdown
  const allMonthsArboles = useMemo(() => {
    const byMonth: Record<number, number> = {};
    captures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.result_arboles;
    });
    return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: byMonth[i + 1] ?? 0 }));
  }, [captures]);

  // Monthly trees breakdown for filtered view
  const monthlyArboles = useMemo(() => {
    const byMonth: Record<number, number> = {};
    filteredCaptures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.result_arboles;
    });
    const months = selectedMonths ?? Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(m => ({ month: m, value: byMonth[m] ?? 0 }));
  }, [filteredCaptures, selectedMonths]);
  // Full-year water breakdown
  const allMonthsAgua = useMemo(() => {
    const byMonth: Record<number, number> = {};
    captures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.result_agua;
    });
    return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: byMonth[i + 1] ?? 0 }));
  }, [captures]);

  const monthlyAgua = useMemo(() => {
    const byMonth: Record<number, number> = {};
    filteredCaptures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.result_agua;
    });
    const months = selectedMonths ?? Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(m => ({ month: m, value: byMonth[m] ?? 0 }));
  }, [filteredCaptures, selectedMonths]);

  // Full-year kg netos breakdown (shadow layer)
  const allMonthsKgNetos = useMemo(() => {
    const byMonth: Record<number, number> = {};
    captures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.kg_netos;
    });
    return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: byMonth[i + 1] ?? 0 }));
  }, [captures]);

  // Monthly kg netos breakdown for filtered view
  const monthlyKgNetos = useMemo(() => {
    const byMonth: Record<number, number> = {};
    filteredCaptures.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + c.kg_netos;
    });
    const months = selectedMonths ?? Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(m => ({ month: m, value: byMonth[m] ?? 0 }));
  }, [filteredCaptures, selectedMonths]);

  const toggleMonth = useCallback((month: number) => {
    setSelectedMonths(prev => {
      if (!prev) return [month];
      if (prev.includes(month)) {
        const next = prev.filter(m => m !== month);
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
    monthlyEconomic,
    allMonthsEconomic,
    monthlyCo2,
    allMonthsCo2,
    monthlyEnergia,
    allMonthsEnergia,
    monthlyArboles,
    allMonthsArboles,
    monthlyAgua,
    allMonthsAgua,
    monthlyKgNetos,
    allMonthsKgNetos,
    loading,
    lastUpdated,
    refreshData: loadDashboardCaptures,
    catalogLoading,
  };
}
