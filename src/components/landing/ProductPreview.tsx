import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mic, Sparkles, Check, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface RolePreview {
  role: string;
  tag: string;
  question: string;
  initialAnswer: string;
  score: number;
  feedback: string;
  followUp: string;
}

const PREVIEW_ROLES: RolePreview[] = [
  {
    role: 'Product Manager',
    tag: 'PM Intern / Associate · Stripe',
    question: 'Your resume mentions that you improved user onboarding. How did you identify the biggest friction point?',
    initialAnswer: 'We analyzed the funnel in Amplitude and noticed a 42% drop-off at document upload. After 15 user interviews, we realized photo glare was the issue, so we added guided auto-crop which recovered 28% of dropped users.',
    score: 8.4,
    feedback: 'Strong STAR structure with clear metrics (42% drop-off, 28% recovery).',
    followUp: 'How did you prioritize this fix against other feature requests on your roadmap?'
  },
  {
    role: 'Software Engineer',
    tag: 'Frontend / Fullstack · Vercel',
    question: 'You noted you optimized client-side bundle size by 35%. What tools and architectural changes did you implement?',
    initialAnswer: 'We used Webpack Bundle Analyzer to find heavy unused lodash modules, replaced moment.js with date-fns, and implemented route-level code splitting with dynamic import() for heavy dashboard widgets.',
    score: 8.8,
    feedback: 'Excellent technical depth and concrete tooling examples.',
    followUp: 'How did you ensure code splitting didn’t introduce cumulative layout shifts (CLS)?'
  },
  {
    role: 'Data Analyst',
    tag: 'Product Analytics · Airbnb',
    question: 'Tell me about an A/B test result that was counter-intuitive and how you diagnosed the root cause.',
    initialAnswer: 'A checkout page redesign increased clicks by 14% but reduced completed bookings by 6%. Segmenting by device type revealed that mobile users experienced input validation errors on the new form.',
    score: 8.2,
    feedback: 'Great analytical intuition showing data segmentation skills.',
    followUp: 'What metric did you recommend tracking as a guardrail metric going forward?'
  }
];

export const ProductPreview: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const current = PREVIEW_ROLES[selectedRoleIndex];

  const handleRoleChange = (idx: number) => {
    setSelectedRoleIndex(idx);
    setSubmitted(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
      <section className="rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-2xl shadow-2xl shadow-purple-500/5 dark:shadow-black/50 overflow-hidden transition-all">
        {/* Top Header with Role Switcher & Live Session Tag */}
        <div className="preview-top border-b border-border/80 bg-surface-subtle/50 px-5 py-3.5 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="font-bold text-xs sm:text-sm text-foreground">Live Simulation</span>
            <span className="text-foreground-subtle hidden sm:inline">·</span>
            <span className="text-foreground-muted text-xs hidden sm:inline">{current.tag}</span>
          </div>

          {/* Role Pills */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border text-xs">
            {PREVIEW_ROLES.map((r, idx) => (
              <button
                key={r.role}
                onClick={() => handleRoleChange(idx)}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  selectedRoleIndex === idx
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-subtle'
                }`}
              >
                {r.role}
              </button>
            ))}
          </div>
        </div>

        {/* Main Question Area */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-3">
            <span className="interviewer flex items-center gap-1.5 text-xs font-bold text-primary tracking-wider uppercase">
              <Sparkles size={13} /> AI Interviewer
            </span>
            <span className="text-xs font-mono font-semibold text-foreground-muted">04 / 10</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
            {current.question}
          </h3>
        </div>

        {/* Answer & Feedback Area */}
        {submitted ? (
          <div className="p-6 border-t border-border bg-emerald-500/5 dark:bg-emerald-500/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check size={16} />
                <span>Response Evaluated · Score: {current.score} / 10</span>
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-medium text-foreground-muted hover:text-foreground flex items-center gap-1"
              >
                <RefreshCw size={12} /> Reset
              </button>
            </div>

            <p className="text-xs text-foreground-muted bg-surface p-3.5 rounded-xl border border-border">
              <strong className="text-foreground font-semibold">Rubric Feedback:</strong> {current.feedback}
            </p>

            <div className="p-3.5 rounded-xl bg-surface border border-emerald-500/20 text-xs">
              <strong className="text-emerald-600 dark:text-emerald-400 block mb-1">Adaptive Follow-Up:</strong>
              <p className="text-foreground font-medium">{current.followUp}</p>
            </div>

            <div className="flex justify-end pt-1">
              <Button onClick={() => navigate('/setup')} className="text-xs py-2 px-4 shadow-sm">
                <span>Start Full Interview</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="preview-answer border-t border-border/80 bg-surface-subtle/50 px-5 py-3.5 flex items-center gap-3">
            <div className="answer-placeholder text-xs sm:text-sm text-foreground-muted line-clamp-1">
              "{current.initialAnswer}"
            </div>
            <button className="mic-small shrink-0" aria-label="Voice input" title="Voice mode">
              <Mic size={16} />
            </button>
            <Button onClick={() => setSubmitted(true)} className="shrink-0 text-xs py-2 px-4">
              <span>Evaluate</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};
