import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StepIndicatorProps {
  currentStep: number; // 1, 2, 3, 4
  onSelectStep?: (step: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onSelectStep }) => {
  const steps = [
    { num: 1, label: 'Resume' },
    { num: 2, label: 'Job Description' },
    { num: 3, label: 'Preferences' },
    { num: 4, label: 'Ready' },
  ];

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        {/* Horizontal Connector Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-border z-0" />
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-[2px] bg-primary transition-all duration-300 z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 90}%` }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <button
              key={step.num}
              type="button"
              disabled={!isCompleted && !isCurrent}
              onClick={() => onSelectStep && isCompleted && onSelectStep(step.num)}
              className={cn(
                'relative z-10 flex flex-col items-center gap-1.5 focus:outline-none transition-all group',
                isCompleted || isCurrent ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 border',
                  isCompleted
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : isCurrent
                    ? 'bg-surface text-primary border-primary ring-4 ring-primary/15'
                    : 'bg-surface text-foreground-muted border-border'
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : `0${step.num}`}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium transition-colors hidden sm:block',
                  isCurrent
                    ? 'text-foreground font-semibold'
                    : isCompleted
                    ? 'text-foreground-muted'
                    : 'text-foreground-subtle'
                )}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
