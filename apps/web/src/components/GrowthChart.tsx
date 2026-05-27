import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface DataPoint {
  month: string;
  value: number;
  label: string;
}

interface GrowthChartProps {
  data?: DataPoint[];
  height?: number;
  accentColor?: string;
}

export function GrowthChart({ data, height = 280, accentColor = '#FF6B2C' }: GrowthChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="relative w-full">
        <div className="flex items-baseline gap-4 mb-6">
          <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-[0.15em]">Engagement Growth</h3>
        </div>
        <div className="rounded-[24px] border border-border bg-surface flex flex-col items-center justify-center" style={{ height }}>
          <TrendingUp className="w-8 h-8 text-text-tertiary mb-3" />
          <p className="text-sm font-semibold text-text-secondary">Aún no hay datos de crecimiento</p>
          <p className="text-xs text-text-tertiary mt-1">Analizá tu canal para trackear tu engagement</p>
        </div>
      </div>
    );
  }

  const { pathD, areaD, points, maxValue } = useMemo(() => {
    const padding = { top: 20, right: 0, bottom: 30, left: 0 };
    const chartWidth = 1000;
    const chartHeight = height - padding.top - padding.bottom;
    const rawMax = Math.max(...data.map(d => d.value));
    const max = rawMax === 0 ? 1 : rawMax * 1.15;
    const min = 0;

    const getX = (i: number) => padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right);
    const getY = (v: number) => padding.top + chartHeight - ((v - min) / (max - min)) * chartHeight;

    const linePoints = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

    let d = `M ${linePoints[0].x} ${linePoints[0].y}`;
    for (let i = 0; i < linePoints.length - 1; i++) {
      const p0 = linePoints[i];
      const p1 = linePoints[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) * 0.4;
      const cp1y = p0.y;
      const cp2x = p1.x - (p1.x - p0.x) * 0.4;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${d} L ${linePoints[linePoints.length - 1].x} ${padding.top + chartHeight} L ${linePoints[0].x} ${padding.top + chartHeight} Z`;

    return { pathD: d, areaD, points: linePoints, maxValue: max };
  }, [data, height]);

  return (
    <div className="relative w-full">
      <div className="flex items-baseline gap-4 mb-6">
        <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-[0.15em]">Engagement Growth</h3>
      </div>

      <div className="relative" style={{ height }}>
        <svg viewBox="0 0 1000 280" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
              <stop offset="60%" stopColor={accentColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.6" />
              <stop offset="50%" stopColor={accentColor} stopOpacity="1" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1="0"
              y1={20 + ratio * (height - 50)}
              x2="1000"
              y2={20 + ratio * (height - 50)}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Area fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === i ? 6 : 4}
                fill={hoveredIndex === i ? accentColor : '#030305'}
                stroke={accentColor}
                strokeWidth={hoveredIndex === i ? 3 : 2}
                className="transition-all duration-200"
              />
              <rect
                x={point.x - 40}
                y="0"
                width="80"
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-crosshair"
              />
            </g>
          ))}

          {/* X axis labels */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 1000;
            return (
              <text
                key={i}
                x={x}
                y={height - 5}
                textAnchor="middle"
                className="text-[10px] fill-text-tertiary"
                style={{ fontSize: 10 }}
              >
                {d.month}
              </text>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-0 pointer-events-none bg-surface-raised border border-border rounded-xl px-3 py-2 shadow-xl"
            style={{
              left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-xs font-semibold text-text">{data[hoveredIndex].label}</p>
            <p className="text-[10px] text-text-tertiary">{data[hoveredIndex].month}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
