import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'glass-primary' | 'glass-secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99] cursor-pointer';

    const variants = {
      // 1. High-Contrast Product Primary (Vercel / Linear / Stripe benchmark)
      primary:
        'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-sm border border-zinc-900/10 dark:border-white/10 font-semibold',

      'glass-primary':
        'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-sm border border-zinc-900/10 dark:border-white/10 font-semibold',

      // 2. High-Contrast Product Secondary
      secondary:
        'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 shadow-xs',

      'glass-secondary':
        'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 shadow-xs',

      glass:
        'bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800/70 dark:hover:bg-zinc-700/80 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/50 backdrop-blur-md shadow-xs',

      outline:
        'border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70',

      ghost:
        'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70',

      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-xs font-semibold',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
      md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 rounded-xl',
      lg: 'text-sm sm:text-base px-5 py-3 gap-2.5 font-semibold rounded-xl',
      icon: 'h-10 w-10 p-0 rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
