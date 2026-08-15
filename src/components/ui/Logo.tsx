import React from 'react';
import { cn } from '../../lib/utils';
import logoImg from '../../assets/logo.png';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  roundBg?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  size = 'md',
  showText = true,
  roundBg = true,
}) => {
  const circleSizeMap = {
    sm: 'w-7 h-7 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2',
    xl: 'w-12 h-12 p-2.5',
  };

  const imgSizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const textMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl',
  };

  return (
    <div className={cn('inline-flex items-center gap-2.5 group select-none', className)}>
      {roundBg ? (
        <div
          className={cn(
            'relative rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-200/60 dark:border-white/20 transition-transform duration-300 group-hover:scale-105',
            circleSizeMap[size]
          )}
        >
          <img
            src={logoImg || '/logo.png'}
            alt="InterviewPilot Logo"
            className={cn('object-contain', imgSizeMap[size])}
          />
        </div>
      ) : (
        <div
          className={cn(
            'relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105',
            circleSizeMap[size]
          )}
        >
          <img
            src={logoImg || '/logo.png'}
            alt="InterviewPilot Logo"
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
      )}

      {showText && (
        <span className={cn('font-extrabold tracking-tight text-foreground flex items-center gap-1', textMap[size])}>
          InterviewPilot
        </span>
      )}
    </div>
  );
};

export default Logo;
