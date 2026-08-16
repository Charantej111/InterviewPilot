import React from 'react';
import { Button } from '../ui/Button';
import { ShiningText } from '../ui/ShiningText';
import { LetterLoader } from '../ui/LetterLoader';
import { InterviewDifficulty, InterviewDuration, InterviewStyle } from '../../types/interview';
import { 
  Sliders, 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  Flame, 
  UserCheck, 
  Layers, 
  Check 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InterviewSettingsStepProps {
  role: string;
  company: string;
  difficulty: InterviewDifficulty;
  duration: InterviewDuration;
  style: InterviewStyle;
  focusAreas: string[];
  isPreparing: boolean;
  onUpdateRole: (role: string) => void;
  onUpdateCompany: (company: string) => void;
  onUpdateDifficulty: (difficulty: InterviewDifficulty) => void;
  onUpdateDuration: (duration: InterviewDuration) => void;
  onUpdateStyle: (style: InterviewStyle) => void;
  onToggleFocusArea: (area: string) => void;
  onPrepareInterview: () => Promise<void>;
  onBack: () => void;
}

const AVAILABLE_FOCUS_AREAS = [
  'Product Sense & User Problem Breakdown',
  'Behavioral & Leadership (STAR Framework)',
  'Execution, Trade-offs & Sprint Delivery',
  'System Architecture & Scalability',
  'Analytical & Metric Decision Making',
  'Cross-Functional Stakeholder Alignment',
];

export const InterviewSettingsStep: React.FC<InterviewSettingsStepProps> = ({
  role,
  company,
  difficulty,
  duration,
  style,
  focusAreas,
  isPreparing,
  onUpdateRole,
  onUpdateCompany,
  onUpdateDifficulty,
  onUpdateDuration,
  onUpdateStyle,
  onToggleFocusArea,
  onPrepareInterview,
  onBack,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Section Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
          <Sliders size={13} className="text-zinc-500" />
          <span>Stage 5 of 6 • Simulation Calibration</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          <ShiningText text="Interview Calibration Settings" />
        </h2>
        <p className="text-xs sm:text-sm text-foreground-muted">
          Difficulty is strictly user-controlled. Calibrate duration, behavioral style, and multi-select the core evaluation areas for this simulation.
        </p>
      </div>

      {isPreparing ? (
        <div className="p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-xs animate-fadeIn">
          <LetterLoader text="Synthesizing Tailored Interview" size="md" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
            <Sparkles size={13} className="text-purple-500 animate-spin" />
            <span>Formulating project deep-dives, gap probes, expected signals, and adaptive triggers...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
            {/* Role & Company Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Target Role Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => onUpdateRole(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Target Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => onUpdateCompany(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground outline-none"
                />
              </div>
            </div>

            {/* Difficulty Level (User Controlled) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-500" />
                  <span>Interview Difficulty (Candidate Controlled)</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'beginner', title: 'Beginner', desc: 'Foundational concepts, structured STAR breakdowns' },
                  { id: 'intermediate', title: 'Intermediate', desc: 'Realistic scale, metrics deep dives, trade-offs' },
                  { id: 'advanced', title: 'Advanced', desc: 'Staff/Principal rigor, edge case pressure, executive influence' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onUpdateDifficulty(item.id as InterviewDifficulty)}
                    className={cn(
                      'p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1',
                      difficulty === item.id
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs ring-2 ring-zinc-400/20'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 text-foreground hover:border-zinc-300 dark:hover:border-zinc-600'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.title}</span>
                      {difficulty === item.id && <Check size={14} className="stroke-[3]" />}
                    </div>
                    <p className={cn('text-[11px] leading-snug', difficulty === item.id ? 'opacity-80' : 'text-foreground-muted')}>
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Duration & Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {/* Duration */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-500" />
                  <span>Simulation Duration</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([10, 20, 30] as InterviewDuration[]).map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => onUpdateDuration(dur)}
                      className={cn(
                        'py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center',
                        duration === dur
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-foreground hover:border-zinc-300'
                      )}
                    >
                      {dur} Mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <UserCheck size={14} className="text-purple-500" />
                  <span>Interviewer Style</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['friendly', 'realistic', 'challenging'] as InterviewStyle[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onUpdateStyle(st)}
                      className={cn(
                        'py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center capitalize',
                        style === st
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-foreground hover:border-zinc-300'
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Focus Areas (Multi-select) */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                <Layers size={14} className="text-zinc-500" />
                <span>Evaluation Focus Areas (Select all that apply)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_FOCUS_AREAS.map((area) => {
                  const isSelected = focusAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => onToggleFocusArea(area)}
                      className={cn(
                        'p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2',
                        isSelected
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 text-foreground hover:border-zinc-300'
                      )}
                    >
                      <span className="text-xs font-semibold">{area}</span>
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center shrink-0 border',
                          isSelected
                            ? 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white border-transparent'
                            : 'border-zinc-300 dark:border-zinc-600'
                        )}
                      >
                        {isSelected && <Check size={10} className="stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" size="md" onClick={onBack} leftIcon={<ArrowLeft size={15} />}>
              Back to Gap Analysis
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={onPrepareInterview}
              leftIcon={<Sparkles size={16} className="text-purple-400" />}
              className="w-full sm:w-auto shadow-sm"
            >
              Prepare Personalized Interview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSettingsStep;
