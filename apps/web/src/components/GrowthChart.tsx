import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

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

const defaultData: DataPoint[] = [
  { month: 'Jan', value: 2.1, label: '2.1%' },
  { month: 'Feb', value: 2.3, label: '2.3%' },
  { month: 'Mar', value: 2.8, label: '2.8%' },
  { month: 'Apr', value: 3.2, label: '3.2%' },
  { month: 'May', value: 3.8, label: '3.8%' },
  { month: 'Jun', value: 4.1, label: '4.1%' },
  { month: 'Jul', value: 4.5, label: '4.5%' },
  { month: 'Aug', value: 4.9, label: '4.9%' },
  { month: 'Sep', value: 5.2, label: '5.2%' },
  { month: 'Oct', value: 5.6, label: '5.6%' },
  { month: 'Nov', value: 6.1, label: '6.1%' },
  { month: 'Dec', value: 6.5, label: '6.5%' },
];

export function GrowthChart({ data = defaultData, height = 280, accentColor = '#FF6B2C' }: GrowthChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { pathD, areaD, points, maxValue } = useMemo(() => {
    const padding = { top: 20, right: 0, bottom: 30, left: 0 };
    const chartWidth = 1000;
    const chartHeight = height - padding.top - padding.bottom;
    const max = Math.max(...data.map(d => d.value)) * 1.15;
    const min = 0;

    const getX = (i: number) => padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right);
    const getY = (v: number) => padding.top + chartHeight - ((v - min) / (max - min)) * chartHeight;

    // Smooth curve using cubic bezier
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

    // Area path
    const areaD = `${d} L ${linePoints[linePoints.length - 1].x} ${padding.top + chartHeight} L ${linePoints[0].x} ${padding.top + chartHeight} Z`;

    return { pathD: d, areaD, points: linePoints, maxValue: max };
  }, [data, height]);

  return (
    <div className="relative w-full">
      <div className="flex items-baseline gap-4 mb-6">
        <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-[0.15em]">Engagement Growth</h3>
        <span className="text-xs text-accent font-medium">+209% YoY</span>
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
              {/* Invisible hit area */}
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
            <p className="text-[10px] text-text-tertiary">{data[hoveredIndex].month} 2024</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
