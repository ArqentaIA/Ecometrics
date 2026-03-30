import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEcoMetrics, type KPITotals, type MaterialEntry } from "@/context/EcoMetricsContext";
import { calculateIndicators, type CatalogMaterial, type VersionedFactor } from "@/lib/calculationEngine";

const POLLING_INTERVAL = 10_000; // 10s fallback polling

const EMPTY_TOTALS: KPITotals = { arboles: 0, co2: 0, energia: 0, agua: 0, kgBrutos: 0, kgNetos: 0, economicImpact: 0 };

/** Raw capture row — only transactional facts, no legacy result_* fields */
interface RawCapture {
  material_code: string;
  month: number;
  kg_brutos: number;
  cost_per_kg_applied: number;
  proveedor: string | null;
  confirmed_at: string | null;
}

/** A capture enriched with recalculated KPIs from catalog + factors */
interface EnrichedCapture extends RawCapture {
  kpis: ReturnType<typeof calculateIndicators>;
}

export function useDashboardFilter() {
  const { user, catalog, catalogLoading, versionedFactors, userRole, captureVersion } = useEcoMetrics();

  const [dashYear, setDashYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Raw confirmed captures — only factual fields
  const [rawCaptures, setRawCaptures] = useState<RawCapture[]>([]);

  const isGlobalRole = userRole === 'admin' || userRole === 'administrador' || userRole === 'direccion';

  const loadDashboardCaptures = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Use OR logic: is_confirmed = true OR confirmed_at IS NOT NULL
      // to avoid dropping records where only one flag was set
      let query = supabase
        .from("material_captures")
        .select("material_code, month, kg_brutos, cost_per_kg_applied, proveedor, confirmed_at, is_confirmed")
        .eq("year", dashYear)
        .eq("is_confirmed", true);

      if (!isGlobalRole) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error loading dashboard captures:", error);
        return;
      }

      // DEBUG: log pipeline counts
      console.log("DASHBOARD_DEBUG", {
        step: "raw_query",
        year: dashYear,
        totalConfirmed: data?.length ?? 0,
        records: data?.map(r => ({ code: r.material_code, month: r.month, kg: r.kg_brutos, confirmed_at: r.confirmed_at })),
      });

      setRawCaptures((data ?? []).map(r => ({
        material_code: r.material_code,
        month: r.month,
        kg_brutos: Number(r.kg_brutos ?? 0),
        cost_per_kg_applied: Number(r.cost_per_kg_applied ?? 0),
        proveedor: (r as any).proveedor ?? null,
        confirmed_at: (r as any).confirmed_at ?? null,
      })));
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [user, dashYear, isGlobalRole]);

  useEffect(() => {
    if (user && catalog.length > 0) loadDashboardCaptures();
  }, [user, catalog, loadDashboardCaptures, captureVersion]);

  // Hybrid: always-on polling + realtime subscription + focus/visibility refresh
  useEffect(() => {
    if (!user) return;

    // Silent poll every 5 minutes for accumulated KPI refresh
    const pollId = setInterval(() => {
      loadDashboardCaptures();
    }, 5 * 60 * 1000);

    // Realtime subscription (best-effort accelerator)
    const channel = supabase
      .channel('dashboard-captures-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'material_captures' },
        () => {
          console.log('DASHBOARD_DEBUG: realtime change detected');
          loadDashboardCaptures();
        }
      )
      .subscribe((status) => {
        console.log('DASHBOARD_DEBUG: realtime status', status);
      });

    // Visibility change: refresh when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('DASHBOARD_DEBUG: tab visible, refreshing...');
        loadDashboardCaptures();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Window focus: force refresh on every focus
    const handleFocus = () => {
      console.log('DASHBOARD_DEBUG: window focus, refreshing...');
      loadDashboardCaptures();
    };
    window.addEventListener('focus', handleFocus);

    // Cross-route capture-confirmed event
    const handleCaptureConfirmed = () => {
      console.log('DASHBOARD_DEBUG: capture-confirmed event received');
      loadDashboardCaptures();
    };
    window.addEventListener('capture-confirmed', handleCaptureConfirmed);

    return () => {
      clearInterval(pollId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('capture-confirmed', handleCaptureConfirmed);
      supabase.removeChannel(channel);
    };
  }, [user, loadDashboardCaptures]);

  // Build catalog + factors lookup maps
  const catalogMap = useMemo(() => {
    const map: Record<string, CatalogMaterial> = {};
    catalog.forEach(m => { map[m.code] = m; });
    return map;
  }, [catalog]);

  // Enrich each raw capture with recalculated KPIs
  const enrichedCaptures: EnrichedCapture[] = useMemo(() => {
    // Keep ALL captures, even if no catalog match (LEFT JOIN logic)
    const results = rawCaptures
      .filter(c => c.kg_brutos > 0)
      .map(c => {
        const mat = catalogMap[c.material_code];
        if (!mat) {
          console.warn("DASHBOARD_DEBUG: no catalog match for", c.material_code);
          return null;
        }
        const factor = versionedFactors[c.material_code] ?? null;
        const kpis = calculateIndicators(mat, c.kg_brutos, c.cost_per_kg_applied, factor);
        return { ...c, kpis };
      })
      .filter((c): c is EnrichedCapture => c !== null);

    console.log("DASHBOARD_DEBUG", {
      step: "enriched",
      rawCount: rawCaptures.length,
      withKg: rawCaptures.filter(c => c.kg_brutos > 0).length,
      catalogKeys: Object.keys(catalogMap).length,
      factorKeys: Object.keys(versionedFactors).length,
      enrichedCount: results.length,
    });

    return results;
  }, [rawCaptures, catalogMap, versionedFactors]);

  // Filter by selected months
  const filteredCaptures = useMemo(() => {
    if (!selectedMonths) return enrichedCaptures;
    return enrichedCaptures.filter(c => selectedMonths.includes(c.month));
  }, [enrichedCaptures, selectedMonths]);

  // Totals from filtered, recalculated captures
  const confirmedTotals: KPITotals = useMemo(() =>
    filteredCaptures.reduce(
      (acc, c) => ({
        arboles: acc.arboles + c.kpis.arboles,
        co2: acc.co2 + c.kpis.co2,
        energia: acc.energia + c.kpis.energia,
        agua: acc.agua + c.kpis.agua,
        kgBrutos: acc.kgBrutos + c.kg_brutos,
        kgNetos: acc.kgNetos + c.kpis.kg_netos,
        economicImpact: acc.economicImpact + c.kpis.economic_impact,
      }),
      { ...EMPTY_TOTALS }
    ),
    [filteredCaptures]
  );

  // Full-year totals (unaffected by month filter)
  const yearTotals: KPITotals = useMemo(() =>
    enrichedCaptures.reduce(
      (acc, c) => ({
        arboles: acc.arboles + c.kpis.arboles,
        co2: acc.co2 + c.kpis.co2,
        energia: acc.energia + c.kpis.energia,
        agua: acc.agua + c.kpis.agua,
        kgBrutos: acc.kgBrutos + c.kg_brutos,
        kgNetos: acc.kgNetos + c.kpis.kg_netos,
        economicImpact: acc.economicImpact + c.kpis.economic_impact,
      }),
      { ...EMPTY_TOTALS }
    ),
    [enrichedCaptures]
  );

  // Summary counters
  const distinctMaterialsCount = useMemo(() =>
    new Set(enrichedCaptures.map(c => c.material_code)).size,
    [enrichedCaptures]
  );
  const totalConfirmedRecords = rawCaptures.length;

  // Aggregate material entries by code
  const materialEntries: (MaterialEntry & { proveedor?: string; confirmed_at?: string })[] = useMemo(() => {
    const byCode: Record<string, {
      kg: number;
      cost_per_kg_applied: number;
      proveedor: string | null;
      confirmed_at: string | null;
      kpis: { arboles: number; co2: number; energia: number; agua: number; kg_netos: number; economic_impact: number };
    }> = {};

    filteredCaptures.forEach(c => {
      if (!byCode[c.material_code]) {
        byCode[c.material_code] = { kg: 0, cost_per_kg_applied: 0, proveedor: null, confirmed_at: null, kpis: { arboles: 0, co2: 0, energia: 0, agua: 0, kg_netos: 0, economic_impact: 0 } };
      }
      const entry = byCode[c.material_code];
      entry.kg += c.kg_brutos;
      entry.cost_per_kg_applied = c.cost_per_kg_applied;
      if (c.proveedor) entry.proveedor = c.proveedor;
      if (c.confirmed_at) entry.confirmed_at = c.confirmed_at;
      entry.kpis.arboles += c.kpis.arboles;
      entry.kpis.co2 += c.kpis.co2;
      entry.kpis.energia += c.kpis.energia;
      entry.kpis.agua += c.kpis.agua;
      entry.kpis.kg_netos += c.kpis.kg_netos;
      entry.kpis.economic_impact += c.kpis.economic_impact;
    });

    return catalog.map(m => {
      const agg = byCode[m.code];
      const factor = versionedFactors[m.code] ?? null;
      if (agg) {
        return {
          material: m,
          kg: agg.kg,
          isConfirmed: true,
          cost_per_kg_applied: agg.cost_per_kg_applied,
          proveedor: agg.proveedor ?? undefined,
          confirmed_at: agg.confirmed_at ?? undefined,
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
            factor_arboles: factor?.factor_arboles ?? m.factor_arboles,
            factor_co2: factor?.factor_co2 ?? m.factor_co2,
            factor_energia: factor?.factor_energia ?? m.factor_energia,
            factor_agua: factor?.factor_agua ?? m.factor_agua,
            factor_version: factor?.version ?? null,
            impacto_valido: m.impacto_valido !== false,
          },
        };
      }
      return {
        material: m,
        kg: 0,
        isConfirmed: false,
        kpis: calculateIndicators(m, 0, m.default_cost_per_kg ?? 0, factor),
      };
    });
  }, [catalog, filteredCaptures, versionedFactors]);

  const confirmedEntries = useMemo(() =>
    materialEntries.filter(e => e.isConfirmed && e.kg > 0),
    [materialEntries]
  );

  // ── Monthly breakdowns: recalculated from enriched captures ──
  const buildMonthlyKPI = useCallback((
    source: EnrichedCapture[],
    getter: (c: EnrichedCapture) => number,
    monthFilter: number[] | null
  ) => {
    const byMonth: Record<number, number> = {};
    source.forEach(c => {
      byMonth[c.month] = (byMonth[c.month] ?? 0) + getter(c);
    });
    const months = monthFilter ?? Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(m => ({ month: m, value: byMonth[m] ?? 0 }));
  }, []);

  // Full-year (shadow layers)
  const allMonthsEconomic = useMemo(() => buildMonthlyKPI(enrichedCaptures, c => c.kpis.economic_impact, null), [enrichedCaptures, buildMonthlyKPI]);
  const allMonthsCo2 = useMemo(() => buildMonthlyKPI(enrichedCaptures, c => c.kpis.co2, null), [enrichedCaptures, buildMonthlyKPI]);
  const allMonthsEnergia = useMemo(() => buildMonthlyKPI(enrichedCaptures, c => c.kpis.energia, null), [enrichedCaptures, buildMonthlyKPI]);
  const allMonthsArboles = useMemo(() => buildMonthlyKPI(enrichedCaptures, c => c.kpis.arboles, null), [enrichedCaptures, buildMonthlyKPI]);
  const allMonthsAgua = useMemo(() => buildMonthlyKPI(enrichedCaptures, c => c.kpis.agua, null), [enrichedCaptures, buildMonthlyKPI]);
  const allMonthsKgNetos = useMemo(() => buildMonthlyKPI(enrichedCaptures, c => c.kpis.kg_netos, null), [enrichedCaptures, buildMonthlyKPI]);

  // Filtered monthly
  const monthlyEconomic = useMemo(() => buildMonthlyKPI(filteredCaptures, c => c.kpis.economic_impact, selectedMonths), [filteredCaptures, selectedMonths, buildMonthlyKPI]);
  const monthlyCo2 = useMemo(() => buildMonthlyKPI(filteredCaptures, c => c.kpis.co2, selectedMonths), [filteredCaptures, selectedMonths, buildMonthlyKPI]);
  const monthlyEnergia = useMemo(() => buildMonthlyKPI(filteredCaptures, c => c.kpis.energia, selectedMonths), [filteredCaptures, selectedMonths, buildMonthlyKPI]);
  const monthlyArboles = useMemo(() => buildMonthlyKPI(filteredCaptures, c => c.kpis.arboles, selectedMonths), [filteredCaptures, selectedMonths, buildMonthlyKPI]);
  const monthlyAgua = useMemo(() => buildMonthlyKPI(filteredCaptures, c => c.kpis.agua, selectedMonths), [filteredCaptures, selectedMonths, buildMonthlyKPI]);
  const monthlyKgNetos = useMemo(() => buildMonthlyKPI(filteredCaptures, c => c.kpis.kg_netos, selectedMonths), [filteredCaptures, selectedMonths, buildMonthlyKPI]);

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

  const clearSelection = useCallback(() => setSelectedMonths(null), []);
  const isAllMonths = selectedMonths === null;

  return {
    dashYear, setDashYear,
    selectedMonths, toggleMonth, clearSelection, isAllMonths,
    confirmedTotals, yearTotals,
    distinctMaterialsCount, totalConfirmedRecords,
    materialEntries, confirmedEntries,
    monthlyEconomic, allMonthsEconomic,
    monthlyCo2, allMonthsCo2,
    monthlyEnergia, allMonthsEnergia,
    monthlyArboles, allMonthsArboles,
    monthlyAgua, allMonthsAgua,
    monthlyKgNetos, allMonthsKgNetos,
    loading, lastUpdated,
    refreshData: loadDashboardCaptures,
    catalogLoading,
  };
}
