import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  characterCount?: {
    current: number;
    max?: number;
  };
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, characterCount, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        <div className="flex justify-between items-center">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted"
            >
              {label}
            </label>
          )}
          {characterCount && (
            <span className="text-xs text-foreground-subtle">
              {characterCount.current}
              {characterCount.max ? ` / ${characterCount.max}` : ' words'}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-lg bg-surface border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle transition-all duration-150',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
            'disabled:opacity-50 disabled:bg-surface-subtle disabled:cursor-not-allowed resize-y min-h-[120px]',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-500 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-foreground-muted mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
