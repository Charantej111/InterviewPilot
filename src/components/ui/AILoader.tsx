import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '../../lib/utils';

export interface AILoaderProps {
  title?: string;
  stage?: string;
  className?: string;
}

export const AILoader: React.FC<AILoaderProps> = ({
  title = 'Calibrating Simulation Engine',
  stage = 'Analyzing signals & matching requirements...',
  className,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl p-8 text-center transition-all max-w-sm w-full mx-auto',
        'bg-white/70 dark:bg-zinc-900/65 backdrop-blur-xl',
        'border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl',
        className
      )}
    >
      {/* Dynamic ambient glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl pointer-events-none animate-pulse" />

      <div className="relative z-10 space-y-5">
        {/* Professional Lottie Animation */}
        <div className="w-28 h-28 mx-auto flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/62c7d048-2882-4ac7-bf30-5e33816b4ec4/a2PgmTbjDh.lottie"
            loop
            autoplay
          />
        </div>

        {/* Title & Stage Details */}
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] sm:text-xs text-foreground-muted font-medium max-w-[280px] mx-auto leading-relaxed">
            {stage}
          </p>
        </div>

        {/* Pulsing status indicator bar */}
        <div className="w-20 h-1 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-zinc-800 dark:bg-zinc-200 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default AILoader;
