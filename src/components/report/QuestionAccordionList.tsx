import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageSquare, Sparkles } from 'lucide-react';
import { getScoreColor } from '../../lib/utils';

export interface QuestionBreakdownItem {
  questionId: string;
  questionText: string;
  category: string;
  score: number;
  userAnswer: string;
  keyCritique: string;
}

export interface QuestionAccordionListProps {
  questions: QuestionBreakdownItem[];
}

export const QuestionAccordionList: React.FC<QuestionAccordionListProps> = ({ questions }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-subtle space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Question-by-Question Audit
          </h3>
          <p className="text-xs text-foreground-muted">
            Expand each prompt to review your transcript and the examiner's specific notes.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const isExpanded = expandedIndex === idx;
          const colors = getScoreColor(q.score);

          return (
            <div
              key={q.questionId}
              className="rounded-xl border border-border/80 bg-surface-subtle/30 overflow-hidden transition-colors"
            >
              {/* Question summary trigger */}
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full p-4 text-left flex items-start sm:items-center justify-between gap-4 hover:bg-surface-subtle transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="font-mono text-xs font-bold text-foreground-muted bg-surface border border-border px-2 py-1 rounded shrink-0">
                    Q0{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">
                      {q.questionText}
                    </h4>
                    <span className="text-[11px] text-foreground-muted block mt-0.5">
                      {q.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className={`text-sm font-bold ${colors.text}`}>
                      {q.score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-foreground-subtle">/10</span>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-foreground-subtle transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Expanded transcript and critique */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-t border-border/60 bg-surface p-4 sm:p-5 space-y-4"
                  >
                    {/* User Answer */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted">
                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                        <span>Your Answer Transcript:</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed p-3.5 rounded-xl bg-surface-subtle/50 border border-border/60 italic">
                        "{q.userAnswer}"
                      </p>
                    </div>

                    {/* AI Critique */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Examiner's Calibration Note:</span>
                      </div>
                      <p className="text-xs text-foreground-muted leading-relaxed p-3.5 rounded-xl bg-accent-subtle/30 border border-accent/20">
                        {q.keyCritique}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
