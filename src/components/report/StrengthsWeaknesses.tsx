import React from 'react';
import { CheckCircle2, TrendingUp } from 'lucide-react';

export interface StrengthsWeaknessesProps {
  topStrengths: string[];
  priorityImprovements: string[];
}

export const StrengthsWeaknesses: React.FC<StrengthsWeaknessesProps> = ({
  topStrengths,
  priorityImprovements,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top Strengths */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <h3>Top Strengths</h3>
        </div>
        <div className="space-y-3">
          {topStrengths.map((strength, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-surface-subtle/50 border border-border/60">
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                0{index + 1}
              </span>
              <p className="text-xs text-foreground leading-relaxed">
                {strength}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Improvements */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
          <TrendingUp className="w-4 h-4" />
          <h3>Key Improvement Areas</h3>
        </div>
        <div className="space-y-3">
          {priorityImprovements.map((improvement, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-surface-subtle/50 border border-border/60">
              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                0{index + 1}
              </span>
              <p className="text-xs text-foreground leading-relaxed">
                {improvement}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
