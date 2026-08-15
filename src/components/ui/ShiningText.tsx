import React from 'react';
import { cn } from '../../lib/utils';

export interface ShiningTextProps {
  text: string;
  className?: string;
}

export const ShiningText: React.FC<ShiningTextProps> = ({ text, className }) => {
  return (
    <span
      className={cn(
        'inline-flex bg-gradient-to-r from-zinc-600 via-zinc-200 to-zinc-600 dark:from-zinc-400 dark:via-white dark:to-zinc-400 bg-[200%_auto] bg-clip-text text-transparent animate-shimmer font-semibold',
        className
      )}
      style={{
        animation: 'shimmerSweep 3s linear infinite',
      }}
    >
      {text}
    </span>
  );
};

export default ShiningText;
