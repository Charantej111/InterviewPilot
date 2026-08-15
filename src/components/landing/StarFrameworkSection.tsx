import React, { useState } from 'react';
import { Target, CheckCircle2, TrendingUp, Award } from 'lucide-react';

export const StarFrameworkSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<'s' | 't' | 'a' | 'r'>('a');

  const starSteps = [
    {
      id: 's',
      letter: 'S',
      title: 'Situation',
      tagline: 'Context & problem scope',
      icon: <Target className="w-5 h-5 text-indigo-500" />,
      description: 'Clearly define the organizational context, user challenge, or technical bottleneck without getting lost in unnecessary background details.',
      goodExample: '"Our checkout page conversion had dropped 18% following the v2 mobile payment SDK rollout across iOS users."'
    },
    {
      id: 't',
      letter: 'T',
      title: 'Task',
      tagline: 'Your specific responsibility',
      icon: <Award className="w-5 h-5 text-blue-500" />,
      description: 'Highlight your individual ownership rather than just saying "we". Define what target metric or deliverable you were responsible for.',
      goodExample: '"I was tasked with diagnosing the failure points in the checkout funnel and shipping a fix within the 2-week sprint cycle."'
    },
    {
      id: 'a',
      letter: 'A',
      title: 'Action',
      tagline: 'Tactical execution & leadership',
      icon: <CheckCircle2 className="w-5 h-5 text-purple-500" />,
      description: 'The core of your answer. Walk through the trade-offs you evaluated, tools you leveraged, and cross-functional alignment you achieved.',
      goodExample: '"I segmented Datadog error logs by device OS, identified an ApplePay iframe timeout, and worked with backend engineers to implement a fallback payment flow with guided auto-retry."'
    },
    {
      id: 'r',
      letter: 'R',
      title: 'Result',
      tagline: 'Quantifiable business impact',
      icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
      description: 'Conclude with verifiable metrics, business impact, and long-term learnings that show you deliver measurable results.',
      goodExample: '"Checkout completion increased by 22%, recovering an estimated $140K in monthly GMV with zero regression errors reported."'
    }
  ];

  const current = starSteps.find((s) => s.id === activeStep) || starSteps[0];

  return (
    <section className="py-20 border-t border-border bg-surface-subtle/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="eyebrow">Evaluation Framework</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            How InterviewPilot grades your answers
          </h2>
          <p className="text-sm sm:text-base text-foreground-muted">
            Hiring managers at top tech companies evaluate candidates using the STAR methodology. Our adaptive engine checks every answer against these 4 pillars.
          </p>
        </div>

        {/* 4 Step Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {starSteps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id as any)}
              className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                activeStep === step.id
                  ? 'bg-surface border-primary shadow-md shadow-primary/10 ring-1 ring-primary'
                  : 'bg-surface/60 border-border hover:border-primary/40 hover:bg-surface'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg font-mono font-bold text-sm flex items-center justify-center shrink-0 ${
                  activeStep === step.id
                    ? 'bg-primary text-white'
                    : 'bg-surface-subtle text-foreground-muted'
                }`}
              >
                {step.letter}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground truncate">{step.title}</div>
                <div className="text-[11px] text-foreground-muted truncate">{step.tagline}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Active Step Showcase Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {current.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {current.letter} · {current.title}
                  </h3>
                  <span className="text-xs text-foreground-muted">{current.tagline}</span>
                </div>
              </div>

              <p className="text-sm text-foreground-muted leading-relaxed">
                {current.description}
              </p>
            </div>

            <div className="md:col-span-6 p-5 rounded-xl bg-surface-subtle border border-border space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                ✓ Ideal Response Phrasing:
              </span>
              <p className="text-xs sm:text-sm font-medium text-foreground italic leading-relaxed">
                {current.goodExample}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
