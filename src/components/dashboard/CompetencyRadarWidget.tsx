import React from 'react';
import { Target, TrendingUp } from 'lucide-react';

export interface CompetencyDimension {
  name: string;
  score: number; // 0 - 10
  benchmark: number; // 0 - 10
}

export interface CompetencyRadarWidgetProps {
  dimensions?: CompetencyDimension[];
  targetCompany?: string;
}

const DEFAULT_DIMENSIONS: CompetencyDimension[] = [
  { name: 'Relevance', score: 8.4, benchmark: 8.0 },
  { name: 'Clarity', score: 7.8, benchmark: 7.5 },
  { name: 'Tech Depth', score: 8.8, benchmark: 8.2 },
  { name: 'STAR Structure', score: 7.2, benchmark: 8.0 },
  { name: 'Evidence & Metrics', score: 6.9, benchmark: 7.8 },
  { name: 'Role Alignment', score: 8.6, benchmark: 8.0 },
];

export const CompetencyRadarWidget: React.FC<CompetencyRadarWidgetProps> = ({
  dimensions = DEFAULT_DIMENSIONS,
  targetCompany = 'Target Tier-1 Bar',
}) => {
  const size = 260;
  const center = size / 2;
  const radius = 88;
  const totalAxes = dimensions.length;

  // Compute (x, y) coordinates for a given axis index and value (0-10)
  const getCoordinates = (index: number, value: number, maxVal = 10) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (value / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Polygon points for candidate score
  const candidatePoints = dimensions
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.score);
      return `${x},${y}`;
    })
    .join(' ');

  // Polygon points for hiring bar benchmark
  const benchmarkPoints = dimensions
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.benchmark);
      return `${x},${y}`;
    })
    .join(' ');

  // Grid levels (2.5, 5.0, 7.5, 10.0)
  const levels = [2.5, 5.0, 7.5, 10.0];

  const avgScore =
    Math.round((dimensions.reduce((acc, d) => acc + d.score, 0) / dimensions.length) * 10) / 10;
  const avgBenchmark =
    Math.round((dimensions.reduce((acc, d) => acc + d.benchmark, 0) / dimensions.length) * 10) / 10;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-left flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
            Competency Calibration
          </span>
          <h3 className="text-sm font-bold text-foreground mt-0.5">6-Dimension Radar</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
            <span className="text-foreground font-semibold">Your Score ({avgScore})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-zinc-400 dark:bg-zinc-600" />
            <span className="text-foreground-muted">Hiring Bar ({avgBenchmark})</span>
          </div>
        </div>
      </div>

      {/* SVG Radar Chart */}
      <div className="relative py-2 flex items-center justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Concentric grid rings */}
          {levels.map((level) => {
            const ringPoints = dimensions
              .map((_, i) => {
                const { x, y } = getCoordinates(i, level);
                return `${x},${y}`;
              })
              .join(' ');

            return (
              <polygon
                key={level}
                points={ringPoints}
                fill="none"
                stroke="currentColor"
                className="text-zinc-100 dark:text-zinc-800"
                strokeWidth={1}
              />
            );
          })}

          {/* Radial axis lines */}
          {dimensions.map((_, i) => {
            const { x, y } = getCoordinates(i, 10);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="currentColor"
                className="text-zinc-100 dark:text-zinc-800"
                strokeWidth={1}
              />
            );
          })}

          {/* Benchmark Polygon */}
          <polygon
            points={benchmarkPoints}
            fill="none"
            stroke="currentColor"
            className="text-zinc-400 dark:text-zinc-600"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* Candidate Score Polygon */}
          <polygon
            points={candidatePoints}
            fill="rgba(99, 102, 241, 0.18)"
            stroke="#6366f1"
            strokeWidth={2}
            className="transition-all duration-500"
          />

          {/* Vertex Points & Labels */}
          {dimensions.map((d, i) => {
            const point = getCoordinates(i, d.score);
            const labelPos = getCoordinates(i, 12.2);

            return (
              <g key={d.name}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={3.5}
                  className="fill-primary stroke-white dark:stroke-zinc-900"
                  strokeWidth={1.5}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[9.5px] font-bold fill-zinc-600 dark:fill-zinc-400"
                >
                  {d.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Summary Bar */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-foreground-muted">
        <div className="flex items-center gap-1.5">
          <Target size={13} className="text-primary" />
          <span>Benchmark: {targetCompany}</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
          <TrendingUp size={13} />
          <span>Strongest: Tech Depth (8.8)</span>
        </div>
      </div>
    </div>
  );
};

export default CompetencyRadarWidget;
