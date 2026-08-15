import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { MagicBento } from '../reactbits/MagicBento';

export const FeatureGrid: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    ['Role-specific questions', 'Generated from the job description, not a generic question bank.'],
    ['Resume-aware interviews', 'Your projects and claims become the starting point.'],
    ['Adaptive follow-ups', 'Go past the first answer, like a real interviewer would.'],
    ['Actionable feedback', 'Understand the gap and exactly what to try next.'],
    ['Progress tracking', 'See the patterns that improve across interviews.'],
  ];

  return (
    <>
      <section id="features" className="features">
        <div className="feature-copy">
          <span className="eyebrow">Built for meaningful practice</span>
          <h2>Feedback that turns a good answer into a stronger one.</h2>
          <p>
            Each question connects your experience to the actual role—so every practice session is useful.
          </p>
        </div>

        <div className="feature-list space-y-3">
          {features.map(([title, copy]) => (
            <MagicBento key={title} className="p-4" enableSpotlight={true} enableTilt={false}>
              <div className="flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-xs text-foreground-muted">{copy}</p>
                </div>
              </div>
            </MagicBento>
          ))}
        </div>
      </section>

      <section id="pricing" className="closing">
        <span className="eyebrow">Your next interview starts here</span>
        <h2>Walk in with a clearer answer.</h2>
        <Button onClick={() => navigate('/setup')}>
          Start practicing <ArrowRight size={16} />
        </Button>
      </section>
    </>
  );
};
