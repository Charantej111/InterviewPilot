import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import { useInterview } from '../../context/InterviewContext';
import { ThemeToggle } from '../layout/ThemeToggle';

export interface InterviewHeaderProps {
  currentQuestion: number;
  totalQuestions?: number;
  company: string;
  role: string;
  onExitClick: () => void;
}

export const InterviewHeader: React.FC<InterviewHeaderProps> = ({
  currentQuestion,
  onExitClick,
}) => {
  const { remainingSeconds } = useInterview();

  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors text-foreground">
      {/* Adaptive Progress Indicator (Zero total question leak) */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold">Adaptive Simulation</span>
        </div>
        <span className="text-xs font-bold text-foreground">
          Question {currentQuestion}
        </span>
      </div>

      {/* Right: Time Remaining, Theme Toggle & Exit */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <Clock size={14} className="text-emerald-500" />
          <span className="font-mono text-foreground font-bold">{formatTime(remainingSeconds)}</span>
          <span className="hidden sm:inline text-foreground-subtle">remaining</span>
        </div>

        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        <button
          type="button"
          onClick={onExitClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
        >
          <LogOut size={13} />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
};

export default InterviewHeader;
