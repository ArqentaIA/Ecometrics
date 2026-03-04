interface DataPoint {
  label: string;
  value: number;
}

interface MiniLineChartProps {
  title: string;
  data: DataPoint[];
  color: string;
}

const MiniLineChart = ({ title, data, color }: MiniLineChartProps) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;

  const w = 320;
  const h = 120;
  const px = 30;
  const py = 15;
  const chartW = w - px * 2;
  const chartH = h - py * 2;

  const points = data.map((d, i) => ({
    x: px + (i / (data.length - 1)) * chartW,
    y: py + chartH - ((d.value - minVal) / range) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${py + chartH} L${points[0].x},${py + chartH} Z`;

  const last = data[data.length - 1]?.value ?? 0;
  const prev = data[data.length - 2]?.value ?? last;
  const trendPct = prev > 0 ? ((last / prev - 1) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-heading font-bold">{title}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
          {trendPct >= 0 ? "▲" : "▼"} {Math.abs(trendPct).toFixed(1)}% vs mes anterior
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = py + chartH - f * chartH;
          const val = minVal + f * range;
          return (
            <g key={f}>
              <line x1={px} y1={y} x2={px + chartW} y2={y} stroke="#e0e0e0" strokeWidth="0.5" />
              <text x={px - 4} y={y + 3} textAnchor="end" fontSize="7" fill="#999">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Area */}
        <path d={areaPath} fill={color} opacity="0.1" />
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3} fill={color} stroke="white" strokeWidth="1.5" />
            <text x={p.x} y={py + chartH + 12} textAnchor="middle" fontSize="7" fill="#999">{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default MiniLineChart;
