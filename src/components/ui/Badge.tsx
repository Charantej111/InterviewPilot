import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-medium rounded-full transition-colors select-none';

  const variants = {
    default:
      'bg-primary-subtle text-primary border border-primary/20',
    neutral:
      'bg-surface-subtle text-foreground-muted border border-border',
    success:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
    warning:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
    danger:
      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
    accent:
      'bg-accent-subtle text-accent border border-accent/20',
    outline:
      'bg-transparent text-foreground-muted border border-border hover:border-foreground/30',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
