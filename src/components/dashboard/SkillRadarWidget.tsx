import { Badge } from '../ui/Badge';
import { Flame } from 'lucide-react';

export interface SkillRadarWidgetProps {
  streakDays: number;
}

export const SkillRadarWidget: React.FC<SkillRadarWidgetProps> = ({ streakDays }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Competency Health Breakdown */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle md:col-span-2 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/80">
          <h3 className="text-sm font-bold text-foreground">Competency Readiness</h3>
          <span className="text-xs text-foreground-muted">Overall Average: 7.3</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">Communication & Delivery</span>
              <Badge variant="success" size="sm">Strong</Badge>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">8.1</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">Role & Domain Alignment</span>
              <Badge variant="default" size="sm">Proficient</Badge>
            </div>
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">7.5</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">Structure (STAR Frameworks)</span>
              <Badge variant="warning" size="sm">Needs Work</Badge>
            </div>
            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">6.8</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">Quantitative Evidence & Counter-metrics</span>
              <Badge variant="warning" size="sm">Needs Work</Badge>
            </div>
            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">5.9</span>
          </div>
        </div>
      </div>

      {/* Subtle Practice Streak & Target */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Practice Consistency</span>
          </div>
          <h4 className="text-2xl font-bold text-foreground font-mono">
            {streakDays} Days in a row
          </h4>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Candidates who complete at least one 15-minute mock every 2 days convert onsite loops at a 2.4x higher rate.
          </p>
        </div>

        <div className="pt-3 border-t border-border/60 text-xs flex items-center justify-between text-foreground-muted">
          <span>Target this week:</span>
          <span className="font-semibold text-foreground">3 / 5 Sessions</span>
        </div>
      </div>
    </div>
  );
};
