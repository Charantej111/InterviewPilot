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
  isCalibrated?: boolean;
}

const BASELINE_DIMENSIONS: CompetencyDimension[] = [
  { name: 'Relevance', score: 0, benchmark: 8.0 },
  { name: 'Clarity', score: 0, benchmark: 7.5 },
  { name: 'Tech Depth', score: 0, benchmark: 8.0 },
  { name: 'STAR Structure', score: 0, benchmark: 8.0 },
  { name: 'Evidence & Metrics', score: 0, benchmark: 7.5 },
  { name: 'Role Alignment', score: 0, benchmark: 8.0 },
];

export const CompetencyRadarWidget: React.FC<CompetencyRadarWidgetProps> = ({
  dimensions,
  targetCompany = 'Tier-1 Hiring Bar',
  isCalibrated = false,
}) => {
  const activeDimensions = dimensions && dimensions.length > 0 ? dimensions : BASELINE_DIMENSIONS;
  const hasRealData = isCalibrated || (dimensions && dimensions.some((d) => d.score > 0));

  const size = 260;
  const center = size / 2;
  const radius = 88;
  const totalAxes = activeDimensions.length;

  // Compute (x, y) coordinates for a given axis index and value (0-10)
  const getCoordinates = (index: number, value: number, maxVal = 10) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (Math.max(0, value) / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Polygon points for candidate score
  const candidatePoints = activeDimensions
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.score);
      return `${x},${y}`;
    })
    .join(' ');

  // Polygon points for hiring bar benchmark
  const benchmarkPoints = activeDimensions
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.benchmark);
      return `${x},${y}`;
    })
    .join(' ');

  // Grid levels (2.5, 5.0, 7.5, 10.0)
  const levels = [2.5, 5.0, 7.5, 10.0];

  const avgScore = hasRealData
    ? Math.round((activeDimensions.reduce((acc, d) => acc + d.score, 0) / activeDimensions.length) * 10) / 10
    : 0;
  const avgBenchmark =
    Math.round((activeDimensions.reduce((acc, d) => acc + d.benchmark, 0) / activeDimensions.length) * 10) / 10;

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
          {hasRealData ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <span className="text-foreground font-semibold">Your Score ({avgScore})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-zinc-400 dark:bg-zinc-600" />
                <span className="text-foreground-muted">Hiring Bar ({avgBenchmark})</span>
              </div>
            </>
          ) : (
            <span className="text-xs text-foreground-muted font-semibold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              Awaiting First Simulation
            </span>
          )}
        </div>
      </div>

      {/* SVG Radar Chart */}
      <div className="relative py-2 flex items-center justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Concentric grid rings */}
          {levels.map((level) => {
            const ringPoints = activeDimensions
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
          {activeDimensions.map((_, i) => {
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
          {activeDimensions.map((d, i) => {
            const point = getCoordinates(i, d.score);
            const labelPos = getCoordinates(i, 12.2);

            return (
              <g key={d.name}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={3.5}
                  className={hasRealData ? "fill-primary stroke-white dark:stroke-zinc-900" : "fill-zinc-300 dark:fill-zinc-700 stroke-transparent"}
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
        {hasRealData ? (
          (() => {
            const topDim = [...activeDimensions].sort((a, b) => b.score - a.score)[0];
            return (
              <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={13} />
                <span>Strongest: {topDim.name} ({topDim.score})</span>
              </div>
            );
          })()
        ) : (
          <span className="text-[11px] text-foreground-muted">
            Calibrates after 1st interview
          </span>
        )}
      </div>
    </div>
  );
};

export default CompetencyRadarWidget;
