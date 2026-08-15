import React from 'react';
import { FinalReport } from '../../types/interview';
import { getScoreColor } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Trophy, CheckCircle } from 'lucide-react';

export interface OverallScoreCardProps {
  report: FinalReport;
}

export const OverallScoreCard: React.FC<OverallScoreCardProps> = ({ report }) => {
  const colors = getScoreColor(report.overallScore);

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-subtle space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-border/80">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              <CheckCircle className="w-3 h-3 mr-1 inline" />
              Interview Completed
            </Badge>
            <span className="text-xs text-foreground-muted">{report.createdAt}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Interview Complete
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
            {report.summary}
          </p>
        </div>

        {/* Score Stamp */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between p-4 rounded-xl bg-surface-subtle border border-border/80 shrink-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Overall Score
          </span>
          <div className="flex items-baseline gap-1 font-mono">
            <span className={`text-4xl font-extrabold ${colors.text}`}>
              {report.overallScore.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-foreground-subtle">/ 10</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Readiness: {report.readinessPercentage}% (+8% gain)
          </span>
        </div>
      </div>

      {/* Target Role & Benchmark Context */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-3 rounded-xl bg-surface-subtle/60 border border-border/60">
          <span className="text-foreground-muted block">Target Role</span>
          <span className="font-semibold text-foreground">{report.jobTitle}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-subtle/60 border border-border/60">
          <span className="text-foreground-muted block">Target Company</span>
          <span className="font-semibold text-foreground">{report.company}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-subtle/60 border border-border/60">
          <span className="text-foreground-muted block">Hiring Decision Signal</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            Competitive for Round 2
          </span>
        </div>
      </div>
    </div>
  );
};
