import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateIndicators, type CatalogMaterial } from "@/lib/calculationEngine";

interface KPITotals {
  arboles: number;
  co2: number;
  energia: number;
  agua: number;
  kgBrutos: number;
  kgNetos: number;
  economicImpact: number;
}

export interface PublicMaterialEntry {
  material: CatalogMaterial;
  kg: number;
  isConfirmed: boolean;
  kpis: {
    arboles: number;
    co2: number;
    energia: number;
    agua: number;
    kg_netos: number;
    economic_impact: number;
    yield_applied: number;
    uses_arboles: boolean;
    uses_co2: boolean;
    uses_energia: boolean;
    uses_agua: boolean;
    factor_arboles: number | null;
    factor_co2: number | null;
    factor_energia: number | null;
    factor_agua: number | null;
  };
}

const EMPTY_TOTALS: KPITotals = { arboles: 0, co2: 0, energia: 0, agua: 0, kgBrutos: 0, kgNetos: 0, economicImpact: 0 };

export function usePublicDashboardFilter(token: string | null) {
  const [dashYear, setDashYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [catalog, setCatalog] = useState<CatalogMaterial[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

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
  }>>([]);

  // Load catalog via secure RPC (no pricing data exposed, token-gated)
  useEffect(() => {
    if (!token) return;
    const loadCatalog = async () => {
      const { data } = await supabase.rpc("get_public_material_catalog" as any, { _token: token });
      setCatalog(((data as any[]) ?? []).map((r: any) => ({
        id: 0,
        code: r.code,
        name: r.name,
        family: r.family,
        default_yield: r.default_yield,
        yield_min: r.yield_min,
        yield_max: r.yield_max,
        yield_loss_reason: r.yield_loss_reason,
        factor_arboles: r.factor_arboles,
        factor_co2: r.factor_co2,
        factor_energia: r.factor_energia,
        factor_agua: r.factor_agua,
        uses_arboles: r.uses_arboles,
        uses_co2: r.uses_co2,
        uses_energia: r.uses_energia,
        uses_agua: r.uses_agua,
        is_active: r.is_active,
        display_order: r.display_order,
        yield_source: r.yield_source,
        factors_source: r.factors_source,
        default_cost_per_kg: 0,
        impacto_valido: true,
      })));
      setCatalogLoading(false);
    };
    loadCatalog();
  }, [token]);

  const loadCaptures = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_confirmed_captures_summary" as any, { _year: dashYear, _token: token });

    if (!error && data) {
      setCaptures((data as any[]).map((r: any) => ({
        material_code: r.material_code,
        month: r.month,
        kg_brutos: Number(r.kg_brutos ?? 0),
        kg_netos: Number(r.kg_netos ?? 0),
        is_confirmed: true,
        result_arboles: Number(r.result_arboles ?? 0),
        result_co2: Number(r.result_co2 ?? 0),
        result_energia: Number(r.result_energia ?? 0),
        result_agua: Number(r.result_agua ?? 0),
        result_economic_impact: Number(r.result_economic_impact ?? 0),
      })));
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, [dashYear]);

  useEffect(() => {
    if (catalog.length > 0) loadCaptures();
  }, [catalog, loadCaptures]);

  const filteredCaptures = useMemo(() => {
    if (!selectedMonths) return captures;
    return captures.filter(c => selectedMonths.includes(c.month));
  }, [captures, selectedMonths]);

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

  const materialEntries: PublicMaterialEntry[] = useMemo(() => {
    const byCode: Record<string, { kg: number; kpis: { arboles: number; co2: number; energia: number; agua: number; kg_netos: number; economic_impact: number } }> = {};
    filteredCaptures.forEach(c => {
      if (!byCode[c.material_code]) {
        byCode[c.material_code] = { kg: 0, kpis: { arboles: 0, co2: 0, energia: 0, agua: 0, kg_netos: 0, economic_impact: 0 } };
      }
      const entry = byCode[c.material_code];
      entry.kg += c.kg_brutos;
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
          material: m, kg: agg.kg, isConfirmed: true,
          kpis: { ...agg.kpis, yield_applied: m.default_yield, uses_arboles: m.uses_arboles, uses_co2: m.uses_co2, uses_energia: m.uses_energia, uses_agua: m.uses_agua, factor_arboles: m.factor_arboles, factor_co2: m.factor_co2, factor_energia: m.factor_energia, factor_agua: m.factor_agua },
        };
      }
      return { material: m, kg: 0, isConfirmed: false, kpis: calculateIndicators(m, 0, m.default_cost_per_kg ?? 0) };
    });
  }, [catalog, filteredCaptures]);

  const confirmedEntries = useMemo(() => materialEntries.filter(e => e.isConfirmed && e.kg > 0), [materialEntries]);

  const buildMonthlyHelper = (data: typeof filteredCaptures, field: string, months: number[]) => {
    const byMonth: Record<number, number> = {};
    data.forEach(c => { byMonth[c.month] = (byMonth[c.month] ?? 0) + (c as any)[field]; });
    return months.map(m => ({ month: m, value: byMonth[m] ?? 0 }));
  };

  const allMonths12 = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const activeMonths = selectedMonths ?? allMonths12;

  const monthlyEconomic = useMemo(() => buildMonthlyHelper(filteredCaptures, "result_economic_impact", activeMonths), [filteredCaptures, activeMonths]);
  const allMonthsEconomic = useMemo(() => buildMonthlyHelper(captures, "result_economic_impact", allMonths12), [captures, allMonths12]);
  const monthlyCo2 = useMemo(() => buildMonthlyHelper(filteredCaptures, "result_co2", activeMonths), [filteredCaptures, activeMonths]);
  const allMonthsCo2 = useMemo(() => buildMonthlyHelper(captures, "result_co2", allMonths12), [captures, allMonths12]);
  const monthlyEnergia = useMemo(() => buildMonthlyHelper(filteredCaptures, "result_energia", activeMonths), [filteredCaptures, activeMonths]);
  const allMonthsEnergia = useMemo(() => buildMonthlyHelper(captures, "result_energia", allMonths12), [captures, allMonths12]);
  const monthlyArboles = useMemo(() => buildMonthlyHelper(filteredCaptures, "result_arboles", activeMonths), [filteredCaptures, activeMonths]);
  const allMonthsArboles = useMemo(() => buildMonthlyHelper(captures, "result_arboles", allMonths12), [captures, allMonths12]);
  const monthlyAgua = useMemo(() => buildMonthlyHelper(filteredCaptures, "result_agua", activeMonths), [filteredCaptures, activeMonths]);
  const allMonthsAgua = useMemo(() => buildMonthlyHelper(captures, "result_agua", allMonths12), [captures, allMonths12]);
  const monthlyKgNetos = useMemo(() => buildMonthlyHelper(filteredCaptures, "kg_netos", activeMonths), [filteredCaptures, activeMonths]);
  const allMonthsKgNetos = useMemo(() => buildMonthlyHelper(captures, "kg_netos", allMonths12), [captures, allMonths12]);

  const toggleMonth = useCallback((month: number) => {
    setSelectedMonths(prev => {
      if (!prev) return [month];
      if (prev.includes(month)) { const next = prev.filter(m => m !== month); return next.length === 0 ? null : next; }
      return [...prev, month].sort((a, b) => a - b);
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedMonths(null), []);

  return {
    dashYear, setDashYear, selectedMonths, toggleMonth, clearSelection,
    isAllMonths: selectedMonths === null,
    confirmedTotals, materialEntries, confirmedEntries,
    monthlyEconomic, allMonthsEconomic,
    monthlyCo2, allMonthsCo2,
    monthlyEnergia, allMonthsEnergia,
    monthlyArboles, allMonthsArboles,
    monthlyAgua, allMonthsAgua,
    monthlyKgNetos, allMonthsKgNetos,
    loading, lastUpdated, catalogLoading,
  };
}
