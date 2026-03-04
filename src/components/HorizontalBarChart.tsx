import { useMemo } from "react";

interface BarData {
  name: string;
  value: number;
}

interface HorizontalBarChartProps {
  title: string;
  data: BarData[];
  gradient: [string, string];
}

const HorizontalBarChart = ({ title, data, gradient }: HorizontalBarChartProps) => {
  const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
  const maxVal = useMemo(() => Math.max(...sorted.map(d => d.value), 1), [sorted]);

  const barH = 18;
  const gap = 4;
  const labelW = 90;
  const chartW = 300;
  const totalH = sorted.length * (barH + gap);

  return (
    <div className="fluent-card p-5">
      <h3 className="text-sm font-heading font-bold mb-3">{title}</h3>
      <svg width="100%" viewBox={`0 0 ${labelW + chartW + 60} ${totalH + 10}`} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${title.replace(/\s/g, "")}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
        {sorted.map((d, i) => {
          const y = i * (barH + gap);
          const w = d.value > 0 ? (d.value / maxVal) * chartW * 0.9 : 0;
          return (
            <g key={d.name}>
              <text x={labelW - 4} y={y + barH / 2 + 4} textAnchor="end" fontSize="9" fill="currentColor" className="text-foreground">
                {d.name}
              </text>
              {d.value > 0 ? (
                <>
                  <rect
                    x={labelW}
                    y={y}
                    width={w}
                    height={barH}
                    rx="4"
                    fill={`url(#grad-${title.replace(/\s/g, "")})`}
                    className="animate-bar-grow"
                  />
                  <text x={labelW + w + 4} y={y + barH / 2 + 4} fontSize="9" fontWeight="bold" fill={gradient[0]}>
                    {d.value.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                  </text>
                </>
              ) : (
                <>
                  <rect x={labelW} y={y} width={30} height={barH} rx="4" fill="#e0e0e0" />
                  <text x={labelW + 34} y={y + barH / 2 + 4} fontSize="8" fill="#999">Sin factor</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default HorizontalBarChart;
