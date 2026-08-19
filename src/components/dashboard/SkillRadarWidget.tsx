import React from 'react';
import { Badge } from '../ui/Badge';
import { Flame } from 'lucide-react';

export interface CompetencyMetric {
  name: string;
  score: number;
  status: string;
  variant: 'success' | 'default' | 'warning';
}

export interface SkillRadarWidgetProps {
  streakDays: number;
  averageScore?: number;
  competencies?: CompetencyMetric[];
  completedThisWeek?: number;
  targetThisWeek?: number;
}

export const SkillRadarWidget: React.FC<SkillRadarWidgetProps> = ({
  streakDays = 0,
  averageScore = 0,
  competencies = [],
  completedThisWeek = 0,
  targetThisWeek = 5,
}) => {
  const hasData = competencies.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
      {/* Competency Health Breakdown */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle md:col-span-2 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/80">
          <h3 className="text-sm font-bold text-foreground">Competency Readiness</h3>
          <span className="text-xs text-foreground-muted">
            {averageScore > 0 ? `Overall Average: ${averageScore.toFixed(1)} / 10` : 'No data yet'}
          </span>
        </div>

        {!hasData ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-foreground-muted">
              Complete your first interview to generate an evidence-based competency breakdown across delivery, structure, depth, and evidence.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {competencies.map((comp) => (
              <div key={comp.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">{comp.name}</span>
                  <Badge variant={comp.variant} size="sm">{comp.status}</Badge>
                </div>
                <span className="font-mono text-xs font-bold text-foreground">
                  {comp.score > 0 ? comp.score.toFixed(1) : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Practice Streak & Target */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Practice Consistency</span>
          </div>
          <h4 className="text-2xl font-bold text-foreground font-mono">
            {streakDays} {streakDays === 1 ? 'Day' : 'Days'} in a row
          </h4>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Consistent simulation practice helps eliminate filler words, sharpen STAR structure, and improve metric precision.
          </p>
        </div>

        <div className="pt-3 border-t border-border/60 text-xs flex items-center justify-between text-foreground-muted">
          <span>Target this week:</span>
          <span className="font-semibold text-foreground">{completedThisWeek} / {targetThisWeek} Sessions</span>
        </div>
      </div>
    </div>
  );
};
