import React, { useEffect, useState } from 'react';
import { Clock, LogOut } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import { Progress } from '../ui/Progress';

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
  const [timeLeft, setTimeLeft] = useState(1476); // 24:36 in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full border-b border-white/[0.08] bg-[#0E0F17]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      {/* Question Count & Horizontal Progress Line */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-white">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <div className="w-28 sm:w-36">
          <Progress value={currentQuestion} max={totalQuestions} className="h-1 bg-white/10" />
        </div>
      </div>

      {/* Right: Time Remaining & Exit */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <Clock size={14} />
          <span className="font-mono text-white font-medium">{formatTime(timeLeft)}</span>
          <span className="hidden sm:inline text-foreground-subtle">Time remaining</span>
        </div>

        <button
          type="button"
          onClick={onExitClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground-muted hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
        >
          <LogOut size={14} />
          <span>Exit interview</span>
        </button>
      </div>
    </header>
  );
};
