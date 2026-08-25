import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BoxLoader } from './BoxLoader';
import { LetterLoader } from './LetterLoader';

export interface LoadingStep {
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface AILoaderProps {
  title?: string;
  stage?: string;
  steps?: LoadingStep[];
  variant?: 'lottie' | 'box' | 'plasma';
  className?: string;
}

export const AILoader: React.FC<AILoaderProps> = ({
  title = 'Calibrating Simulation Engine',
  stage = 'Analyzing signals & matching requirements...',
  steps,
  variant = 'lottie',
  className,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 sm:p-8 text-center transition-all max-w-md w-full mx-auto',
        'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl',
        'border border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl',
        className
      )}
    >
      {/* Dynamic ambient glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl pointer-events-none animate-pulse" />

      <div className="relative z-10 space-y-5">
        {/* Visual Loader Animation */}
        <div className="mx-auto flex items-center justify-center min-h-[90px]">
          {variant === 'box' ? (
            <BoxLoader size="md" />
          ) : variant === 'plasma' ? (
            <LetterLoader text="Analyzing" size="sm" />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto flex items-center justify-center">
              <DotLottieReact
                src="https://lottie.host/62c7d048-2882-4ac7-bf30-5e33816b4ec4/a2PgmTbjDh.lottie"
                loop
                autoplay
              />
            </div>
          )}
        </div>

        {/* Title & Stage Details */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-foreground-muted font-medium max-w-[320px] mx-auto leading-relaxed">
            {stage}
          </p>
        </div>

        {/* Live Stepped Progress Checklist */}
        {steps && steps.length > 0 && (
          <div className="pt-2 text-left space-y-2 border-t border-zinc-100 dark:border-zinc-800/80">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-2.5 text-xs py-1 transition-all duration-300',
                  step.status === 'completed'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : step.status === 'in_progress'
                    ? 'text-foreground font-bold animate-fadeIn'
                    : 'text-zinc-400 dark:text-zinc-600 font-normal'
                )}
              >
                {step.status === 'completed' ? (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                ) : step.status === 'in_progress' ? (
                  <Loader2 size={14} className="text-primary animate-spin shrink-0" />
                ) : (
                  <Circle size={14} className="text-zinc-300 dark:text-zinc-700 shrink-0" />
                )}
                <span className="truncate">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pulsing status indicator bar */}
        <div className="w-20 h-1 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-zinc-800 dark:bg-zinc-200 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default AILoader;
