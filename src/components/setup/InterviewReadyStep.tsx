import React from 'react';
import { Button } from '../ui/Button';
import { ShiningText } from '../ui/ShiningText';
import { Question, InterviewDifficulty, InterviewDuration, InterviewStyle } from '../../types/interview';
import { 
  CheckCircle2, 
  ArrowLeft, 
  Play, 
  Flame, 
  Clock, 
  Target,
  Zap
} from 'lucide-react';

export interface InterviewReadyStepProps {
  role: string;
  company: string;
  difficulty: InterviewDifficulty;
  duration: InterviewDuration;
  style: InterviewStyle;
  focusAreas: string[];
  questions: Question[];
  onStartInterview: () => void;
  onBack: () => void;
}

export const InterviewReadyStep: React.FC<InterviewReadyStepProps> = ({
  role,
  company,
  difficulty,
  duration,
  style,
  focusAreas,
  questions,
  onStartInterview,
  onBack,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Section Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Stage 6 of 6 • Simulation Ready</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          <ShiningText text="Your Personalized Interview is Ready" />
        </h2>
        <p className="text-xs sm:text-sm text-foreground-muted">
          Calibrated specifically for your background, {company}'s real products, and the target {role} hiring bar.
        </p>
      </div>

      {/* Dossier Summary Card */}
      <div className="space-y-5">
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
          {/* Header Title & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-foreground">{role}</h3>
                <span className="text-sm font-semibold text-foreground-muted">•</span>
                <span className="text-base font-bold text-foreground-muted">{company}</span>
              </div>
              <p className="text-xs text-foreground-muted">
                {questions.length} Tailored Anchor Question Slots with Adaptive Probe Triggers
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold capitalize border border-zinc-200 dark:border-zinc-700">
                <Flame size={12} className="inline mr-1 text-amber-500" />
                {difficulty}
              </span>
              <span className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                <Clock size={12} className="inline mr-1 text-blue-500" />
                {duration} Mins
              </span>
              <span className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold capitalize border border-zinc-200 dark:border-zinc-700">
                {style} Style
              </span>
            </div>
          </div>

          {/* Verification Badges Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {[
              { label: 'Resume Profile Analyzed', detail: 'Anchored on real past deliverables' },
              { label: 'Target Job Decomposed', detail: 'Core competencies extracted' },
              { label: 'Live Company Intelligence', detail: 'Verified facts & business model' },
              { label: 'Actionable Gaps Formulated', detail: 'Targeted probe opportunities' },
            ].map((chk, i) => (
              <div key={i} className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 size={13} />
                  <span>{chk.label}</span>
                </div>
                <p className="text-[10px] text-foreground-muted pl-4.5">{chk.detail}</p>
              </div>
            ))}
          </div>

          {/* Focus Areas Tags */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Evaluated Focus Areas ({focusAreas.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((fa, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700"
                >
                  {fa}
                </span>
              ))}
            </div>
          </div>

          {/* Questions Outline Preview (No sample answers) */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
              <Target size={14} className="text-purple-500" />
              <span>Prepared Question Slots ({questions.length})</span>
            </h4>
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-foreground text-xs uppercase tracking-wide">
                        {q.category}
                      </span>
                    </div>
                    {q.adaptiveFollowUpTriggers && q.adaptiveFollowUpTriggers.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                        <Zap size={10} />
                        {q.adaptiveFollowUpTriggers.length} Adaptive Triggers
                      </span>
                    )}
                  </div>

                  <p className="text-foreground font-semibold text-sm leading-snug">
                    "{q.text}"
                  </p>

                  {q.intent && (
                    <p className="text-foreground-muted text-[11px]">
                      <strong className="text-foreground">Interviewer Intent:</strong> {q.intent}
                    </p>
                  )}

                  {q.expectedSignals && q.expectedSignals.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {q.expectedSignals.slice(0, 2).map((sig, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium"
                        >
                          ✓ {sig}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" size="md" onClick={onBack} leftIcon={<ArrowLeft size={15} />}>
            Back to Calibration
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={onStartInterview}
            rightIcon={<Play size={16} className="fill-current" />}
            className="w-full sm:w-auto shadow-md"
          >
            Start Interview Simulation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewReadyStep;
