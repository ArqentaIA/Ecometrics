import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { MATERIALS, Material, calculateKPIs, MaterialKPIs, KPI_TARGETS, generateMonthlyHistory } from "@/data/materials";

interface MaterialEntry {
  material: Material;
  kg: number;
  kpis: MaterialKPIs;
}

interface EcoMetricsState {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
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
}

const EcoMetricsContext = createContext<EcoMetricsState | null>(null);

export function EcoMetricsProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(1); // Feb = 1 (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025);
  const [kgMap, setKgMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    MATERIALS.forEach(m => { map[m.code] = m.mockKg; });
    return map;
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

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
    setKgMap(prev => {
      const newMap: Record<string, number> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const delta = 1 + (Math.random() * 0.05 - 0.025);
        newMap[k] = Math.round(v * delta * 100) / 100;
      });
      return newMap;
    });
    setLastUpdated(new Date());
  }, []);

  return (
    <EcoMetricsContext.Provider value={{
      isLoggedIn, login: () => setIsLoggedIn(true), logout: () => setIsLoggedIn(false),
      currentMonth, currentYear, setCurrentMonth, setCurrentYear,
      materialEntries, setMaterialKg, clearAll, kpiTotals, totalKg,
      targets: KPI_TARGETS, monthlyHistory, refreshData, lastUpdated,
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
