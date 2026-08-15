import React from 'react';
import { cn, getScoreColor } from '../../lib/utils';

export interface ScoreIndicatorProps {
  label: string;
  score: number; // 0 to 10
  maxScore?: number;
  showBar?: boolean;
  benchmark?: number; // e.g. 7.0 benchmark
  className?: string;
}

export const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({
  label,
  score,
  maxScore = 10,
  showBar = true,
  benchmark,
  className,
}) => {
  const percentage = (score / maxScore) * 100;
  const colors = getScoreColor(score);

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex items-baseline gap-1 font-mono">
          <span className={cn('font-semibold text-sm', colors.text)}>
            {score.toFixed(1)}
          </span>
          <span className="text-[11px] text-foreground-subtle">/{maxScore}</span>
        </div>
      </div>

      {showBar && (
        <div className="relative h-2 w-full bg-surface-subtle border border-border/50 rounded-full overflow-hidden">
          {/* Benchmark line if provided */}
          {benchmark && (
            <div
              className="absolute top-0 bottom-0 w-[1.5px] bg-foreground-muted/40 z-10"
              style={{ left: `${(benchmark / maxScore) * 100}%` }}
              title={`Benchmark: ${benchmark}`}
            />
          )}

          <div
            className={cn('h-full rounded-full transition-all duration-500 ease-out', {
              'bg-emerald-500': score >= 8.0,
              'bg-blue-500': score >= 6.5 && score < 8.0,
              'bg-amber-500': score >= 5.0 && score < 6.5,
              'bg-rose-500': score < 5.0,
            })}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};
