import React from 'react';
import { Question } from '../../types/interview';
import { Sparkles } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

export interface QuestionBlockProps {
  question: Question;
  isAdaptiveFollowUp?: boolean;
}

export const QuestionBlock: React.FC<QuestionBlockProps> = ({
  question,
}) => {
  return (
    <div className="space-y-4">
      {/* AI Interviewer Avatar Badge */}
      <div className="flex items-center gap-2.5">
        <Avatar name="AI" size="sm" isAI={true} isLive={true} />
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <span>AI Interviewer</span>
          <Sparkles size={13} className="text-primary" />
        </div>
      </div>

      {/* Main Question Text */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
          {question.text}
        </h1>

        <p className="text-xs sm:text-sm text-foreground-muted">
          {question.contextExplanation || 'Focus on your thought process and the outcome.'}
        </p>
      </div>
    </div>
  );
};
