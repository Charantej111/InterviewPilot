import React from 'react';
import { getScoreColor } from '../../lib/utils';

export interface ScoreMeterProps {
  score: number; // 0 to 10
  headline?: string;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({
  score,
  headline = 'Good direction. Let’s go deeper.',
}) => {
  const colors = getScoreColor(score);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl bg-surface border border-border shadow-subtle gap-4">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Answer Evaluation
        </span>
        <h2 className="text-2xl font-bold text-foreground">
          {headline}
        </h2>
        <p className="text-xs text-foreground-muted">
          Evaluated against role seniority benchmarks and communication structure standards.
        </p>
      </div>

      <div className="flex items-center gap-3 sm:border-l sm:border-border/80 sm:pl-6">
        <div className="space-y-0.5 text-right sm:text-left">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted block">
            Overall Score
          </span>
          <div className="flex items-baseline gap-1 font-mono">
            <span className={`text-3xl font-extrabold ${colors.text}`}>
              {score.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-foreground-subtle">/ 10</span>
          </div>
        </div>
      </div>
    </div>
  );
};
