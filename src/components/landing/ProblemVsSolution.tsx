import React from 'react';
import { X, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProblemVsSolution: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 border-y border-border bg-surface-subtle/30 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Why InterviewPilot Is Different
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Generic question lists don't get you hired.
          </h2>
          <p className="text-sm text-foreground-muted leading-relaxed">
            Real interviewers don't read off static question banks. They read your resume, compare it to the role requirements, and challenge your specific claims.
          </p>
        </div>

        {/* 2-Column Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Problem Card (Generic Chatbots / Flashcards) */}
          <div className="p-7 sm:p-8 rounded-2xl bg-surface border border-rose-500/20 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                Generic AI & Question Banks
              </span>
              <h3 className="text-xl font-bold text-foreground">
                Surface-level practice
              </h3>
            </div>

            <ul className="space-y-4 text-xs text-foreground-muted">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <X size={12} />
                </div>
                <span>
                  <strong className="text-foreground">Ignores your resume:</strong> Asks generic questions like "Tell me about a time you led a team" regardless of your actual experience.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <X size={12} />
                </div>
                <span>
                  <strong className="text-foreground">Accepts vague answers:</strong> Moves on without challenging incomplete answers or missing metric evidence.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <X size={12} />
                </div>
                <span>
                  <strong className="text-foreground">No hiring rubric:</strong> Gives generic summaries like "Good answer!" instead of scoring STAR structure and evidence depth.
                </span>
              </li>
            </ul>
          </div>

          {/* Solution Card (InterviewPilot Engine) */}
          <div className="p-7 sm:p-8 rounded-2xl bg-surface border border-primary/40 shadow-lg shadow-primary/5 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1 rounded-bl-xl bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
              InterviewPilot Engine
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Personalized Preparation
              </span>
              <h3 className="text-xl font-bold text-foreground">
                Deep context-aware challenges
              </h3>
            </div>

            <ul className="space-y-4 text-xs text-foreground-muted">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} />
                </div>
                <span>
                  <strong className="text-foreground">Pairs resume claims with target JD:</strong> Connects line 14 of your resume to requirement #3 of the job description.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} />
                </div>
                <span>
                  <strong className="text-foreground">Adaptive counter-questions:</strong> Probes your response in real-time if metrics, scope, or individual contributions are unclear.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} />
                </div>
                <span>
                  <strong className="text-foreground">Hiring manager rubric scoring:</strong> Scores STAR framework alignment, clarity, evidence, and provides exact rewrite suggestions.
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={() => navigate('/setup')}
                className="btn-vibrant text-xs py-2 px-4 w-full sm:w-auto"
              >
                <span>Build your interview in 60 seconds</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
