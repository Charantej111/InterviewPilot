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
        <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
          {question.text}
        </h1>
      </div>
    </div>
  );
};
