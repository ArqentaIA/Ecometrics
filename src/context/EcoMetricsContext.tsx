import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import {
  CatalogMaterial,
  CalculatedKPIs,
  VersionedFactor,
  calculateIndicators,
  buildCaptureSnapshot,
} from "@/lib/calculationEngine";
import { useUserRole, type AppRole, type RolePermissions } from "@/hooks/useUserRole";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface MaterialEntry {
  material: CatalogMaterial;
  kg: number;
  kpis: CalculatedKPIs;
  isConfirmed: boolean;
}

export interface KPITotals {
  arboles: number;
  co2: number;
  energia: number;
  agua: number;
  kgBrutos: number;
  kgNetos: number;
  economicImpact: number;
}

interface EcoMetricsState {
  isLoggedIn: boolean;
  user: User | null;
  userRole: AppRole | null;
  roleLabel: string;
  permissions: RolePermissions;
  roleLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (m: number) => void;
  setCurrentYear: (y: number) => void;
  catalog: CatalogMaterial[];
  catalogLoading: boolean;
  versionedFactors: Record<string, VersionedFactor>;
  materialEntries: MaterialEntry[];
  setMaterialKg: (code: string, kg: number) => void;
  setCostPerKg: (code: string, cost: number) => void;
  costPerKgMap: Record<string, number>;
  proveedorMap: Record<string, string>;
  setProveedor: (code: string, proveedor: string) => void;
  clearAll: () => void;
  kpiTotals: KPITotals;
  totalKg: number;
  refreshData: () => void;
  lastUpdated: Date;
  savingCapture: boolean;
  saveCapture: (code: string) => Promise<{ error: string | null }>;
  loadCaptures: () => Promise<void>;
  loadingCaptures: boolean;
  confirmedTotals: KPITotals;
}

const EcoMetricsContext = createContext<EcoMetricsState | null>(null);

const EMPTY_TOTALS: KPITotals = { arboles: 0, co2: 0, energia: 0, agua: 0, kgBrutos: 0, kgNetos: 0, economicImpact: 0 };

export function EcoMetricsProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [kgMap, setKgMap] = useState<Record<string, number>>({});
  const [costPerKgMap, setCostPerKgMapState] = useState<Record<string, number>>({});
  const [confirmedMap, setConfirmedMap] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [savingCapture, setSavingCapture] = useState(false);
  const [loadingCaptures, setLoadingCaptures] = useState(false);
  const [proveedorMap, setProveedorMapState] = useState<Record<string, string>>({});

  // Catalog state
  const [catalog, setCatalog] = useState<CatalogMaterial[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Versioned factors (keyed by material_code → active factor)
  const [versionedFactors, setVersionedFactors] = useState<Record<string, VersionedFactor>>({});

  // Confirmed capture snapshots from DB (for dashboard)
  const [confirmedSnapshots, setConfirmedSnapshots] = useState<Array<{
    result_arboles: number;
    result_co2: number;
    result_energia: number;
    result_agua: number;
    kg_brutos: number;
    kg_netos: number;
    result_economic_impact: number;
  }>>([]);

  // ─── Auth ───
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        setUser(session?.user ?? null);
        setSessionReady(true);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isLoggedIn = !!user;
  const { role: userRole, roleLabel, permissions, loading: roleLoading } = useUserRole(user);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setKgMap({});
    setCostPerKgMapState({});
    setConfirmedMap({});
    setConfirmedSnapshots([]);
    setProveedorMapState({});
  }, []);

  // ─── Load Catalog + Versioned Factors (Rule 2, 5, 14) ───
  // Fetch ALL active materials without filtering by impact flags.
  // No cache — fresh fetch on every mount.
  useEffect(() => {
    async function loadCatalogAndFactors() {
      setCatalogLoading(true);

      const [catalogRes, factorsRes] = await Promise.all([
        supabase
          .from("material_catalog")
          .select("*")
          .eq("is_active", true)
          .order("code"),
        supabase
          .from("material_factors")
          .select("*")
          .eq("activo", true)
          .order("version", { ascending: false }),
      ]);

      if (catalogRes.error) {
        console.error("Error loading catalog:", catalogRes.error);
        setCatalogLoading(false);
        return;
      }

      const loadedCatalog = (catalogRes.data ?? []) as unknown as CatalogMaterial[];

      // ── AUDIT CAPA 1: Respuesta cruda de BD ──
      console.log("AUDIT_DB_READ", {
        total: loadedCatalog.length,
        materiales: loadedCatalog.map(m => ({
          id: m.code,
          nombre: m.name,
          activo: (m as any).is_active,
        })),
      });

      setCatalog(loadedCatalog);

      // ── AUDIT CAPA 2: Estado asignado al Provider ──
      console.log("AUDIT_PROVIDER_STATE", {
        total: loadedCatalog.length,
        materiales: loadedCatalog.map(m => ({
          id: m.code,
          nombre: m.name,
          activo: (m as any).is_active,
        })),
      });

      // Build map: material_code → latest active factor
      const factorMap: Record<string, VersionedFactor> = {};
      (factorsRes.data ?? []).forEach((f: any) => {
        if (!factorMap[f.material_code]) {
          factorMap[f.material_code] = f as VersionedFactor;
        }
      });
      setVersionedFactors(factorMap);

      setCatalogLoading(false);
    }
    loadCatalogAndFactors();
  }, []);

  // ─── Load Captures ───
  const loadCaptures = useCallback(async () => {
    if (!user) return;
    setLoadingCaptures(true);
    try {
      const { data, error } = await supabase
        .from("material_captures")
        .select("material_code, kg_brutos, is_confirmed, result_arboles, result_co2, result_energia, result_agua, kg_netos, cost_per_kg_applied, result_economic_impact, proveedor")
        .eq("user_id", user.id)
        .eq("month", currentMonth + 1)
        .eq("year", currentYear);

      if (error) {
        console.error("Error loading captures:", error);
        return;
      }

      const kgs: Record<string, number> = {};
      const costs: Record<string, number> = {};
      const confirmed: Record<string, boolean> = {};
      const proveedores: Record<string, string> = {};
      const snapshots: typeof confirmedSnapshots = [];

      catalog.forEach(m => { kgs[m.code] = 0; costs[m.code] = m.default_cost_per_kg ?? 0; });

      data?.forEach(row => {
        kgs[row.material_code] = Number(row.kg_brutos);
        const savedCost = Number(row.cost_per_kg_applied ?? 0);
        const catalogMat = catalog.find(c => c.code === row.material_code);
        costs[row.material_code] = savedCost > 0 ? savedCost : (catalogMat?.default_cost_per_kg ?? 0);
        confirmed[row.material_code] = row.is_confirmed ?? false;
        if ((row as any).proveedor) proveedores[row.material_code] = (row as any).proveedor;
        if (row.is_confirmed) {
          snapshots.push({
            result_arboles: Number(row.result_arboles ?? 0),
            result_co2: Number(row.result_co2 ?? 0),
            result_energia: Number(row.result_energia ?? 0),
            result_agua: Number(row.result_agua ?? 0),
            kg_brutos: Number(row.kg_brutos ?? 0),
            kg_netos: Number(row.kg_netos ?? 0),
            result_economic_impact: Number(row.result_economic_impact ?? 0),
          });
        }
      });

      setKgMap(kgs);
      setCostPerKgMapState(costs);
      setConfirmedMap(confirmed);
      setConfirmedSnapshots(snapshots);
      setProveedorMapState(proveedores);
      setLastUpdated(new Date());
    } finally {
      setLoadingCaptures(false);
    }
  }, [user, currentMonth, currentYear, catalog]);

  useEffect(() => {
    if (user && catalog.length > 0) loadCaptures();
  }, [user, currentMonth, currentYear, loadCaptures, catalog]);

  // ─── Setters ───
  const setMaterialKg = useCallback((code: string, kg: number) => {
    setKgMap(prev => ({ ...prev, [code]: kg }));
    setConfirmedMap(prev => ({ ...prev, [code]: false }));
  }, []);

  const clearAll = useCallback(() => {
    setKgMap(prev => {
      const map: Record<string, number> = {};
      Object.keys(prev).forEach(k => { map[k] = 0; });
      return map;
    });
    setCostPerKgMapState(() => {
      const map: Record<string, number> = {};
      catalog.forEach(m => { map[m.code] = m.default_cost_per_kg ?? 0; });
      return map;
    });
    setConfirmedMap({});
  }, [catalog]);

  const setCostPerKg = useCallback((code: string, cost: number) => {
    setCostPerKgMapState(prev => ({ ...prev, [code]: cost }));
    setConfirmedMap(prev => ({ ...prev, [code]: false }));
  }, []);

  // ─── Save Capture (with full snapshot + versioned factors) ───
  const saveCapture = useCallback(async (code: string) => {
    if (!user) return { error: "No autenticado" };
    const material = catalog.find(m => m.code === code);
    if (!material) return { error: "Material no encontrado en catálogo" };

    const kg = kgMap[code] ?? 0;
    const cost = costPerKgMap[code] ?? material.default_cost_per_kg ?? 0;

    // Validations (Rule 20)
    if (kg <= 0) return { error: "El peso capturado debe ser mayor a cero" };
    if (cost < 0) return { error: "El costo por kg no puede ser negativo" };
    if (material.default_yield <= 0 || material.default_yield > 100)
      return { error: "Yield no válido para este material" };

    // Get active versioned factor
    const factor = versionedFactors[code] ?? null;

    // Validate factors exist when required (Rule 20)
    if (material.impacto_valido !== false) {
      if (material.uses_co2 && (factor?.factor_co2 ?? material.factor_co2) == null)
        return { error: "Factor CO₂ requerido pero no definido" };
      if (material.uses_energia && (factor?.factor_energia ?? material.factor_energia) == null)
        return { error: "Factor de energía requerido pero no definido" };
      if (material.uses_agua && (factor?.factor_agua ?? material.factor_agua) == null)
        return { error: "Factor de agua requerido pero no definido" };
      if (material.uses_arboles && (factor?.factor_arboles ?? material.factor_arboles) == null)
        return { error: "Factor de árboles requerido pero no definido" };
    }

    setSavingCapture(true);
    try {
      const snapshot = buildCaptureSnapshot(material, kg, user.id, currentMonth + 1, currentYear, cost, factor);

      const { error } = await supabase
        .from("material_captures")
        .upsert(snapshot, { onConflict: "user_id,material_code,month,year" });

      if (error) return { error: error.message };

      setConfirmedMap(prev => ({ ...prev, [code]: true }));
      await loadCaptures();

      return { error: null };
    } finally {
      setSavingCapture(false);
    }
  }, [user, catalog, kgMap, costPerKgMap, currentMonth, currentYear, loadCaptures, versionedFactors]);

  // ─── Derived: material entries with live KPIs from engine ───
  const materialEntries: MaterialEntry[] = useMemo(() =>
    catalog.map(m => ({
      material: m,
      kg: kgMap[m.code] ?? 0,
      kpis: calculateIndicators(
        m,
        kgMap[m.code] ?? 0,
        costPerKgMap[m.code] ?? m.default_cost_per_kg ?? 0,
        versionedFactors[m.code] ?? null
      ),
      isConfirmed: confirmedMap[m.code] ?? false,
    })),
    [catalog, kgMap, costPerKgMap, confirmedMap, versionedFactors]
  );

  // ─── Live KPI totals (for capture screen) ───
  const kpiTotals: KPITotals = useMemo(() =>
    materialEntries.reduce(
      (acc, e) => ({
        arboles: acc.arboles + e.kpis.arboles,
        co2: acc.co2 + e.kpis.co2,
        energia: acc.energia + e.kpis.energia,
        agua: acc.agua + e.kpis.agua,
        kgBrutos: acc.kgBrutos + e.kg,
        kgNetos: acc.kgNetos + e.kpis.kg_netos,
        economicImpact: acc.economicImpact + e.kpis.economic_impact,
      }),
      { ...EMPTY_TOTALS }
    ),
    [materialEntries]
  );

  const totalKg = kpiTotals.kgBrutos;

  // ─── Dashboard totals: only confirmed snapshots ───
  const confirmedTotals: KPITotals = useMemo(() =>
    confirmedSnapshots.reduce(
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
    [confirmedSnapshots]
  );

  const refreshData = useCallback(() => { loadCaptures(); }, [loadCaptures]);

  // Always render the Provider so children never lose context.
  // Components can check isLoggedIn / catalogLoading for loading states.

  return (
    <EcoMetricsContext.Provider value={{
      isLoggedIn, user, userRole, roleLabel, permissions, roleLoading,
      login, logout,
      currentMonth, currentYear, setCurrentMonth, setCurrentYear,
      catalog, catalogLoading, versionedFactors,
      materialEntries, setMaterialKg, setCostPerKg, costPerKgMap, clearAll,
      kpiTotals, totalKg,
      refreshData, lastUpdated,
      savingCapture, saveCapture, loadCaptures, loadingCaptures,
      confirmedTotals,
    }}>
      {children}
    </EcoMetricsContext.Provider>
  );
}

export function useEcoMetrics() {
  const ctx = useContext(EcoMetricsContext);
  if (!ctx) throw new Error("useEcoMetrics must be used within EcoMetricsProvider");
  return ctx;
}
