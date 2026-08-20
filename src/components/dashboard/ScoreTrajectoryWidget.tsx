import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

export interface ScoreHistoryPoint {
  date: string;
  role: string;
  score: number;
}

export interface ScoreTrajectoryWidgetProps {
  history?: ScoreHistoryPoint[];
}

const DEFAULT_HISTORY: ScoreHistoryPoint[] = [
  { date: 'Aug 12', role: 'System Design', score: 6.8 },
  { date: 'Aug 14', role: 'Product Sense', score: 7.2 },
  { date: 'Aug 16', role: 'Behavioral STAR', score: 7.5 },
  { date: 'Aug 18', role: 'Full Simulation', score: 8.4 },
];

export const ScoreTrajectoryWidget: React.FC<ScoreTrajectoryWidgetProps> = ({
  history = DEFAULT_HISTORY,
}) => {
  const width = 280;
  const height = 120;
  const padding = 20;

  const scores = history.map((h) => h.score);
  const minScore = 5.0;
  const maxScore = 10.0;

  // Generate SVG path coordinates
  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((h.score - minScore) / (maxScore - minScore)) * (height - padding * 2);
    return { x, y, ...h };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} ${height - padding} L ${points[0]?.x || 0} ${height - padding} Z`;

  const latestScore = scores[scores.length - 1] || 0;
  const firstScore = scores[0] || 0;
  const scoreDelta = Math.round((latestScore - firstScore) * 10) / 10;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-left flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
            Readiness Trajectory
          </span>
          <h3 className="text-sm font-bold text-foreground mt-0.5">Historical Growth</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <ArrowUpRight size={13} />
          <span>+{scoreDelta} Lift</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="py-3 flex flex-col items-center justify-center">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background area fill */}
          <path d={areaD} fill="url(#scoreGradient)" />

          {/* Trajectory Line */}
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                className="fill-primary stroke-white dark:stroke-zinc-900"
                strokeWidth={2}
              />
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="text-[9px] font-mono font-bold fill-zinc-700 dark:fill-zinc-300"
              >
                {p.score.toFixed(1)}
              </text>
              <text
                x={p.x}
                y={height - 4}
                textAnchor="middle"
                className="text-[8.5px] font-medium fill-zinc-400 dark:fill-zinc-500"
              >
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Stats Summary */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 gap-2 text-left">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-foreground-muted block font-semibold">Latest Score</span>
          <strong className="text-sm font-mono font-bold text-foreground">{latestScore.toFixed(1)}/10</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-foreground-muted block font-semibold">Practice Loops</span>
          <strong className="text-sm font-mono font-bold text-foreground">{history.length} Sessions</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-foreground-muted block font-semibold">Trajectory</span>
          <strong className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <TrendingUp size={12} />
            Consistently Rising
          </strong>
        </div>
      </div>
    </div>
  );
};

export default ScoreTrajectoryWidget;
