import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, MoonStar } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={cn(
        'relative inline-flex items-center h-8 w-[58px] rounded-full p-[3px] cursor-pointer select-none transition-colors duration-200 outline-none',
        'bg-[#16161e] dark:bg-[#101017] border border-white/15 dark:border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <Sun
          className={cn(
            'w-3.5 h-3.5 transition-opacity duration-200',
            !isDark ? 'opacity-0' : 'opacity-40 text-slate-400'
          )}
        />
        <MoonStar
          className={cn(
            'w-3.5 h-3.5 transition-opacity duration-200',
            isDark ? 'opacity-0' : 'opacity-40 text-slate-400'
          )}
        />
      </div>

      {/* Tactile Sliding Beveled Knob (Matching Screenshot) */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 550,
          damping: 32,
        }}
        className={cn(
          'relative z-10 w-6 h-6 rounded-full flex items-center justify-center',
          'bg-gradient-to-b from-[#2a2a38] to-[#1e1e2a] border border-white/20',
          'shadow-[0_2px_8px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.25)]',
          isDark ? 'ml-auto' : 'mr-auto'
        )}
      >
        {isDark ? (
          <MoonStar className="w-3.5 h-3.5 text-white drop-shadow-xs" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-300 drop-shadow-xs" />
        )}
      </motion.div>
    </button>
  );
};
