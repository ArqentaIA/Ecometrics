import { create } from "zustand";

export type RouteStatus = "programada" | "en_transito" | "en_proceso" | "finalizada";
export type PointStatus = "pendiente" | "en_atencion" | "completado";

export interface TrackingPoint {
  id: string;
  centro_id: string;
  nombre: string;
  lat: number;
  lng: number;
  status: PointStatus;
  evidencia_url?: string;
  completed_at?: number;
}

export interface TrackingLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface TrackingRoute {
  id: string;
  nombre: string;
  operador: string;
  token: string;
  status: RouteStatus;
  points: TrackingPoint[];
  trail: TrackingLocation[];
  started_at?: number;
  finished_at?: number;
  last_update?: number;
  current_lat?: number;
  current_lng?: number;
}

interface TrackingState {
  routes: TrackingRoute[];
  getRoute: (id: string) => TrackingRoute | undefined;
  startRoute: (id: string) => void;
  finishRoute: (id: string) => void;
  pushLocation: (id: string, loc: TrackingLocation) => void;
  setPointStatus: (routeId: string, pointId: string, status: PointStatus) => void;
  setEvidence: (routeId: string, pointId: string, url: string) => void;
}

// Seed data: simulated coordinates around Mexico City as mock
const seedRoutes: TrackingRoute[] = [
  {
    id: "R-001",
    nombre: "Ruta Norte CDMX",
    operador: "Juan Pérez",
    token: "demo-token-001",
    status: "programada",
    trail: [],
    points: [
      { id: "P1", centro_id: "C-101", nombre: "Centro Vallejo",     lat: 19.4978, lng: -99.1500, status: "pendiente" },
      { id: "P2", centro_id: "C-102", nombre: "Centro Azcapotzalco", lat: 19.4845, lng: -99.1820, status: "pendiente" },
      { id: "P3", centro_id: "C-103", nombre: "Centro Tlalnepantla", lat: 19.5400, lng: -99.1950, status: "pendiente" },
      { id: "P4", centro_id: "C-104", nombre: "Centro GAM",          lat: 19.4830, lng: -99.1100, status: "pendiente" },
    ],
  },
  {
    id: "R-002",
    nombre: "Ruta Sur CDMX",
    operador: "María López",
    token: "demo-token-002",
    status: "programada",
    trail: [],
    points: [
      { id: "P1", centro_id: "C-201", nombre: "Centro Coyoacán", lat: 19.3500, lng: -99.1620, status: "pendiente" },
      { id: "P2", centro_id: "C-202", nombre: "Centro Tlalpan",  lat: 19.2920, lng: -99.1670, status: "pendiente" },
      { id: "P3", centro_id: "C-203", nombre: "Centro Xochimilco", lat: 19.2670, lng: -99.1050, status: "pendiente" },
    ],
  },
];

export const useTrackingStore = create<TrackingState>((set, get) => ({
  routes: seedRoutes,
  getRoute: (id) => get().routes.find((r) => r.id === id),
  startRoute: (id) =>
    set((s) => ({
      routes: s.routes.map((r) =>
        r.id === id
          ? { ...r, status: "en_transito", started_at: Date.now(), last_update: Date.now() }
          : r,
      ),
    })),
  finishRoute: (id) =>
    set((s) => ({
      routes: s.routes.map((r) =>
        r.id === id ? { ...r, status: "finalizada", finished_at: Date.now() } : r,
      ),
    })),
  pushLocation: (id, loc) =>
    set((s) => ({
      routes: s.routes.map((r) =>
        r.id === id
          ? {
              ...r,
              trail: [...r.trail, loc].slice(-200),
              current_lat: loc.lat,
              current_lng: loc.lng,
              last_update: loc.timestamp,
            }
          : r,
      ),
    })),
  setPointStatus: (routeId, pointId, status) =>
    set((s) => ({
      routes: s.routes.map((r) =>
        r.id === routeId
          ? {
              ...r,
              status: status === "en_atencion" ? "en_proceso" : r.status,
              points: r.points.map((p) =>
                p.id === pointId
                  ? { ...p, status, completed_at: status === "completado" ? Date.now() : p.completed_at }
                  : p,
              ),
            }
          : r,
      ),
    })),
  setEvidence: (routeId, pointId, url) =>
    set((s) => ({
      routes: s.routes.map((r) =>
        r.id === routeId
          ? {
              ...r,
              points: r.points.map((p) => (p.id === pointId ? { ...p, evidencia_url: url } : p)),
            }
          : r,
      ),
    })),
}));
