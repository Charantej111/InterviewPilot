import React from 'react';
import { Check, FileText, Briefcase, Building2, GitCompare, Sliders, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SetupStage = 'resume' | 'jd' | 'company' | 'match' | 'settings' | 'ready';

export interface SetupProgressHeaderProps {
  currentStage: SetupStage;
  onSelectStage?: (stage: SetupStage) => void;
  completedStages: SetupStage[];
}

const STAGES: { id: SetupStage; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'jd', label: 'Target Job', icon: Briefcase },
  { id: 'company', label: 'Company Context', icon: Building2 },
  { id: 'match', label: 'Gap Analysis', icon: GitCompare },
  { id: 'settings', label: 'Calibration', icon: Sliders },
  { id: 'ready', label: 'Interview Ready', icon: Sparkles },
];

export const SetupProgressHeader: React.FC<SetupProgressHeaderProps> = ({
  currentStage,
  onSelectStage,
  completedStages,
}) => {
  const currentIdx = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xs">
      <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isCompleted = completedStages.includes(stage.id);
          const isCurrent = stage.id === currentStage;
          const isClickable = isCompleted || idx <= currentIdx;

          return (
            <React.Fragment key={stage.id}>
              <button
                type="button"
                onClick={() => isClickable && onSelectStage?.(stage.id)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 select-none text-left',
                  isCurrent
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : isCompleted
                    ? 'text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-pointer'
                    : 'text-foreground-subtle opacity-50 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors shrink-0',
                    isCurrent
                      ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                      : isCompleted
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-foreground-muted'
                  )}
                >
                  {isCompleted && !isCurrent ? <Check size={11} className="stroke-[3]" /> : idx + 1}
                </div>
                <Icon size={13} className="hidden sm:inline opacity-70" />
                <span className="hidden md:inline">{stage.label}</span>
              </button>

              {idx < STAGES.length - 1 && (
                <div
                  className={cn(
                    'h-[1px] w-3 sm:w-6 shrink-0 transition-colors',
                    idx < currentIdx ? 'bg-emerald-500/40' : 'bg-zinc-200 dark:bg-zinc-800'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
