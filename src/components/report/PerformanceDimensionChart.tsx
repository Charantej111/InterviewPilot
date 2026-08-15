import React from 'react';
import { ScoreIndicator } from '../ui/ScoreIndicator';

export interface PerformanceDimensionChartProps {
  dimensions: {
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
}

export const PerformanceDimensionChart: React.FC<PerformanceDimensionChartProps> = ({
  dimensions,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-subtle space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Performance Overview by Dimension
          </h3>
          <p className="text-xs text-foreground-muted">
            Calibrated against candidate benchmarks for this specific role level.
          </p>
        </div>
        <span className="text-xs text-foreground-muted font-mono hidden sm:inline">
          Benchmark: 7.0 / 10
        </span>
      </div>

      <div className="space-y-4">
        {dimensions.map((dim) => (
          <div key={dim.name} className="space-y-1">
            <ScoreIndicator
              label={dim.name}
              score={dim.score}
              maxScore={dim.maxScore}
              benchmark={7.0}
            />
            <p className="text-[11px] text-foreground-muted leading-relaxed pl-0.5">
              {dim.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
