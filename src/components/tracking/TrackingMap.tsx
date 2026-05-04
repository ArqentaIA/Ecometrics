import { useMemo } from "react";
import type { TrackingRoute } from "@/stores/useTrackingStore";

interface Props {
  route: TrackingRoute;
  height?: number;
}

/**
 * Mock map (SVG-based). Projects lat/lng to a normalized canvas.
 * Replace with Google Maps when MAPS_API_KEY is wired in production.
 */
const TrackingMap = ({ route, height = 480 }: Props) => {
  const { points, trail, current_lat, current_lng } = route;

  const { project, viewBox } = useMemo(() => {
    const allLats = [
      ...points.map((p) => p.lat),
      ...trail.map((t) => t.lat),
      ...(current_lat ? [current_lat] : []),
    ];
    const allLngs = [
      ...points.map((p) => p.lng),
      ...trail.map((t) => t.lng),
      ...(current_lng ? [current_lng] : []),
    ];
    const minLat = Math.min(...allLats) - 0.01;
    const maxLat = Math.max(...allLats) + 0.01;
    const minLng = Math.min(...allLngs) - 0.01;
    const maxLng = Math.max(...allLngs) + 0.01;
    const W = 1000, H = 600;
    const project = (lat: number, lng: number) => ({
      x: ((lng - minLng) / (maxLng - minLng)) * W,
      y: H - ((lat - minLat) / (maxLat - minLat)) * H,
    });
    return { project, viewBox: `0 0 ${W} ${H}` };
  }, [points, trail, current_lat, current_lng]);

  const trailPath = trail
    .map((t, i) => {
      const { x, y } = project(t.lat, t.lng);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-border bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner"
      style={{ height }}
    >
      {/* Grid background */}
      <svg className="w-full h-full" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Trail polyline */}
        {trail.length > 1 && (
          <path
            d={trailPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0"
            opacity="0.8"
          />
        )}

        {/* Points */}
        {points.map((p, idx) => {
          const { x, y } = project(p.lat, p.lng);
          const color =
            p.status === "completado" ? "#16a34a" : p.status === "en_atencion" ? "#f59e0b" : "#94a3b8";
          return (
            <g key={p.id}>
              <circle cx={x} cy={y} r="14" fill={color} opacity="0.25" />
              <circle cx={x} cy={y} r="9" fill={color} stroke="white" strokeWidth="2.5" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
                {idx + 1}
              </text>
              <text
                x={x}
                y={y - 18}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="hsl(var(--foreground))"
              >
                {p.nombre}
              </text>
            </g>
          );
        })}

        {/* Operator current position */}
        {current_lat && current_lng && (
          <g filter="url(#glow)">
            {(() => {
              const { x, y } = project(current_lat, current_lng);
              return (
                <>
                  <circle cx={x} cy={y} r="22" fill="#3b82f6" opacity="0.2">
                    <animate attributeName="r" values="18;30;18" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r="10" fill="#3b82f6" stroke="white" strokeWidth="3" />
                </>
              );
            })()}
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 text-[11px] shadow-md border border-border">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Operador</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Completado</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> En atención</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Pendiente</span>
        </div>
      </div>

    </div>
  );
};

export default TrackingMap;
