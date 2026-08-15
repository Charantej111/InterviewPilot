import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Check, ArrowRight } from 'lucide-react';

export const PricingSection: React.FC = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free Trial',
      price: '$0',
      period: 'forever',
      description: 'Test drive InterviewPilot with your resume and a sample mock interview.',
      features: [
        '1 Full AI Mock Interview',
        'Resume & JD parsing',
        'Basic Score Breakdown',
        'Text answer mode',
      ],
      cta: 'Start Free Interview',
      variant: 'secondary' as const,
      popular: false,
    },
    {
      name: 'Job Hunter Pro',
      price: '$29',
      period: 'per month',
      description: 'Unlimited practice for candidates actively preparing for upcoming interview loops.',
      features: [
        'Unlimited AI Mock Interviews',
        'Adaptive voice & microphone mode',
        'Deep Resume Project verification drills',
        'Full STAR rubric & personalized feedback',
        'Comprehensive exportable reports',
        'Readiness analytics & progress tracking',
      ],
      cta: 'Get Pro Access',
      variant: 'primary' as const,
      popular: true,
    },
    {
      name: 'Lifetime Loop',
      price: '$79',
      period: 'one-time',
      description: 'All-inclusive lifetime access for ongoing career progression and promotions.',
      features: [
        'Lifetime unlimited interview practice',
        'All interview categories & senior roles',
        'Direct hiring committee benchmark rubrics',
        'Priority feature access',
      ],
      cta: 'Get Lifetime',
      variant: 'secondary' as const,
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 border-t border-border/80 bg-surface/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Simple Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Invest in landing your dream offer.
          </h2>
          <p className="text-sm text-foreground-muted">
            Less than 0.1% of your target compensation. Practice without limit until you feel 100% confident.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl bg-surface border p-7 flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'border-primary shadow-elevated ring-1 ring-primary/30'
                  : 'border-border/80 shadow-subtle hover:border-foreground/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" size="sm" className="font-semibold shadow-sm">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-foreground-muted mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-foreground font-mono">
                    {plan.price}
                  </span>
                  <span className="text-xs text-foreground-muted">/ {plan.period}</span>
                </div>

                <div className="pt-4 border-t border-border/60 space-y-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Includes:
                  </span>
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2 text-xs text-foreground">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Button
                  variant={plan.variant}
                  className="w-full justify-center"
                  onClick={() => navigate('/setup')}
                  rightIcon={plan.popular ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
