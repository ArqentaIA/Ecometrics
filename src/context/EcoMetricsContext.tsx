import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { MATERIALS, Material, calculateKPIs, MaterialKPIs, KPI_TARGETS, generateMonthlyHistory } from "@/data/materials";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface MaterialEntry {
  material: Material;
  kg: number;
  kpis: MaterialKPIs;
}

interface EcoMetricsState {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (m: number) => void;
  setCurrentYear: (y: number) => void;
  materialEntries: MaterialEntry[];
  setMaterialKg: (code: string, kg: number) => void;
  clearAll: () => void;
  kpiTotals: MaterialKPIs;
  totalKg: number;
  targets: typeof KPI_TARGETS;
  monthlyHistory: ReturnType<typeof generateMonthlyHistory>;
  refreshData: () => void;
  lastUpdated: Date;
  savingCapture: boolean;
  saveCapture: (code: string) => Promise<{ error: string | null }>;
  loadCaptures: () => Promise<void>;
  loadingCaptures: boolean;
}

const EcoMetricsContext = createContext<EcoMetricsState | null>(null);

export function EcoMetricsProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [kgMap, setKgMap] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [savingCapture, setSavingCapture] = useState(false);
  const [loadingCaptures, setLoadingCaptures] = useState(false);

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        setUser(session?.user ?? null);
        setSessionReady(true);
      }
    );
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isLoggedIn = !!user;

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setKgMap({});
  }, []);

  const setMaterialKg = useCallback((code: string, kg: number) => {
    setKgMap(prev => ({ ...prev, [code]: kg }));
  }, []);

  const clearAll = useCallback(() => {
    setKgMap(prev => {
      const map: Record<string, number> = {};
      Object.keys(prev).forEach(k => { map[k] = 0; });
      return map;
    });
  }, []);

  // Load captures from Supabase for current month/year
  const loadCaptures = useCallback(async () => {
    if (!user) return;
    setLoadingCaptures(true);
    try {
      // month in DB is 1-indexed
      const { data, error } = await supabase
        .from("material_captures")
        .select("material_code, kg_brutos")
        .eq("user_id", user.id)
        .eq("month", currentMonth + 1)
        .eq("year", currentYear);

      if (error) {
        console.error("Error loading captures:", error);
        return;
      }

      const map: Record<string, number> = {};
      MATERIALS.forEach(m => { map[m.code] = 0; });
      data?.forEach(row => {
        map[row.material_code] = Number(row.kg_brutos);
      });
      setKgMap(map);
      setLastUpdated(new Date());
    } finally {
      setLoadingCaptures(false);
    }
  }, [user, currentMonth, currentYear]);

  // Auto-load when user/month/year changes
  useEffect(() => {
    if (user) {
      loadCaptures();
    }
  }, [user, currentMonth, currentYear, loadCaptures]);

  // Save a single capture to Supabase (upsert)
  const saveCapture = useCallback(async (code: string) => {
    if (!user) return { error: "No autenticado" };
    setSavingCapture(true);
    try {
      const kg = kgMap[code] ?? 0;
      const { error } = await supabase
        .from("material_captures")
        .upsert({
          user_id: user.id,
          material_code: code,
          kg_brutos: kg,
          month: currentMonth + 1, // 1-indexed in DB
          year: currentYear,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,material_code,month,year",
        });
      if (error) return { error: error.message };
      return { error: null };
    } finally {
      setSavingCapture(false);
    }
  }, [user, kgMap, currentMonth, currentYear]);

  const materialEntries = useMemo(() =>
    MATERIALS.map(m => ({
      material: m,
      kg: kgMap[m.code] ?? 0,
      kpis: calculateKPIs(m, kgMap[m.code] ?? 0),
    })),
    [kgMap]
  );

  const kpiTotals = useMemo(() =>
    materialEntries.reduce(
      (acc, e) => ({
        arboles: acc.arboles + e.kpis.arboles,
        co2: acc.co2 + e.kpis.co2,
        energia: acc.energia + e.kpis.energia,
        agua: acc.agua + e.kpis.agua,
        costo: acc.costo + e.kpis.costo,
        materiasPrimas: 0,
      }),
      { arboles: 0, co2: 0, energia: 0, agua: 0, costo: 0, materiasPrimas: 0 }
    ),
    [materialEntries]
  );

  const totalKg = useMemo(() => materialEntries.reduce((s, e) => s + e.kg, 0), [materialEntries]);

  const monthlyHistory = useMemo(() => generateMonthlyHistory(kgMap), [kgMap]);

  const refreshData = useCallback(() => {
    loadCaptures();
  }, [loadCaptures]);

  // Don't render children until session is checked
  if (!sessionReady) return null;

  return (
    <EcoMetricsContext.Provider value={{
      isLoggedIn, user,
      login, logout,
      currentMonth, currentYear, setCurrentMonth, setCurrentYear,
      materialEntries, setMaterialKg, clearAll, kpiTotals, totalKg,
      targets: KPI_TARGETS, monthlyHistory, refreshData, lastUpdated,
      savingCapture, saveCapture, loadCaptures, loadingCaptures,
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
