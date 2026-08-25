import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, MoonStar } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, size = 'md' }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isSmall = size === 'sm';

  const trackWidth = isSmall ? 'w-[48px] h-7' : 'w-[58px] h-8';
  const knobSize = isSmall ? 'w-5 h-5' : 'w-6 h-6';
  const knobTravel = isSmall ? 20 : 26;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        toggleTheme();
      }}
      type="button"
      className={cn(
        'relative inline-flex items-center rounded-full p-[3px] cursor-pointer select-none transition-colors duration-200 outline-none shrink-0',
        'bg-[#16161e] dark:bg-[#101017] border border-white/15 dark:border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]',
        trackWidth,
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Background Track Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <Sun
          className={cn(
            'transition-opacity duration-200',
            isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5',
            !isDark ? 'opacity-0' : 'opacity-40 text-amber-400'
          )}
        />
        <MoonStar
          className={cn(
            'transition-opacity duration-200',
            isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5',
            isDark ? 'opacity-0' : 'opacity-40 text-indigo-300'
          )}
        />
      </div>

      {/* Tactile Sliding Beveled Knob */}
      <motion.div
        animate={{ x: isDark ? knobTravel : 0 }}
        transition={{
          type: 'spring',
          stiffness: 550,
          damping: 32,
        }}
        className={cn(
          'relative z-10 rounded-full flex items-center justify-center',
          'bg-gradient-to-b from-[#2a2a38] to-[#1e1e2a] border border-white/20',
          'shadow-[0_2px_8px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.25)]',
          knobSize
        )}
      >
        {isDark ? (
          <MoonStar className={cn(isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5', 'text-white drop-shadow-xs')} />
        ) : (
          <Sun className={cn(isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5', 'text-amber-300 drop-shadow-xs')} />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
