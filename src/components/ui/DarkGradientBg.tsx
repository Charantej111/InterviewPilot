import React from 'react';
import { cn } from '../../lib/utils';

export interface DarkGradientBgProps {
  children?: React.ReactNode;
  className?: string;
}

export const DarkGradientBg: React.FC<DarkGradientBgProps> = ({ children, className }) => {
  return (
    <div className={cn('relative min-h-screen w-full bg-slate-50 dark:bg-[#090a0f] text-foreground transition-colors overflow-hidden', className)}>
      <div className="absolute inset-0 pointer-events-none">
        {/* Dark mode atmospheric streaks */}
        <div
          className="absolute inset-0 hidden dark:block opacity-100"
          style={{
            background: 'radial-gradient(100% 100% at 0% 0%, rgb(30, 30, 45) 0%, rgb(9, 10, 15) 100%)',
            mask: 'radial-gradient(125% 100% at 0% 0%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.224) 88.2883%, rgba(0, 0, 0, 0) 100%)',
            WebkitMask: 'radial-gradient(125% 100% at 0% 0%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.224) 88.2883%, rgba(0, 0, 0, 0) 100%)',
          }}
        >
          {/* Skewed fading cyan/blue streaks */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(rgb(0, 207, 255) 0%, rgba(0, 207, 255, 0) 100%)',
              mask: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0) 36%, rgb(0, 0, 0) 55%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 78%, rgba(0, 0, 0, 0) 97%)',
              WebkitMask: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0) 36%, rgb(0, 0, 0) 55%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 78%, rgba(0, 0, 0, 0) 97%)',
              transform: 'skewX(45deg)',
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(rgb(0, 207, 255) 0%, rgba(0, 207, 255, 0) 100%)',
              mask: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 11%, rgb(0, 0, 0) 25%, rgba(0, 0, 0, 0.55) 41%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 78%, rgba(0, 0, 0, 0) 97%)',
              WebkitMask: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 11%, rgb(0, 0, 0) 25%, rgba(0, 0, 0, 0.55) 41%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 78%, rgba(0, 0, 0, 0) 97%)',
              transform: 'skewX(45deg)',
            }}
          />
        </div>

        {/* Light mode subtle gradient halo */}
        <div className="absolute inset-0 block dark:hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))]" />
      </div>

      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full min-h-screen">{children}</div>
    </div>
  );
};

export default DarkGradientBg;
