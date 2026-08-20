import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import { Progress } from '../ui/Progress';
import { useInterview } from '../../context/InterviewContext';
import { ThemeToggle } from '../layout/ThemeToggle';

export interface InterviewHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  company: string;
  role: string;
  onExitClick: () => void;
}

export const InterviewHeader: React.FC<InterviewHeaderProps> = ({
  currentQuestion,
  totalQuestions,
  onExitClick,
}) => {
  const { remainingSeconds } = useInterview();

  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors text-foreground">
      {/* Question Count & Horizontal Progress Line */}
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="text-xs font-bold text-foreground">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <div className="w-24 sm:w-36">
          <Progress value={currentQuestion} max={totalQuestions} className="h-1.5 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Right: Time Remaining, Theme Toggle & Exit */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <Clock size={14} className="text-primary" />
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
