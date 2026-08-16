import React, { useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  hasError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value = '',
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  autoFocus = true,
  className,
  hasError = false,
}) => {
  // If the value passed in has more digits (e.g. 8 digits pasted), adapt length
  const effectiveLength = Math.max(length, value.length > 6 ? 8 : 6);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Array of digits from value padded up to effectiveLength
  const digits = Array.from({ length: effectiveLength }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const cleanDigit = rawVal.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    const combined = newDigits.join('').slice(0, effectiveLength);

    onChange(combined);

    if (cleanDigit && index < effectiveLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (combined.length === effectiveLength && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        const combined = newDigits.join('');
        onChange(combined);
        inputRefs.current[index - 1]?.focus();
      } else if (digits[index]) {
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index] = '';
        const combined = newDigits.join('');
        onChange(combined);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < effectiveLength - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    const rawPasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!rawPasted) return;

    const targetLen = rawPasted.length === 8 ? 8 : effectiveLength;
    const cleanPasted = rawPasted.slice(0, targetLen);

    onChange(cleanPasted);

    const targetFocusIndex = Math.min(cleanPasted.length, targetLen - 1);
    inputRefs.current[targetFocusIndex]?.focus();

    if (cleanPasted.length === targetLen && onComplete) {
      onComplete(cleanPasted);
    }
  };

  return (
    <div className={cn('flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap', className)}>
      {Array.from({ length: effectiveLength }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[index]}
            disabled={disabled}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              'w-10 h-13 sm:w-12 sm:h-14 text-center text-2xl font-mono font-extrabold rounded-xl transition-all duration-150 outline-none',
              // High contrast background and text in all themes:
              'bg-slate-100 dark:bg-zinc-900 border text-slate-950 dark:text-white shadow-xs',
              isFilled
                ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary dark:text-purple-300 ring-2 ring-primary/40'
                : 'border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600',
              'focus:border-primary focus:ring-2 focus:ring-primary/40 focus:bg-white dark:focus:bg-zinc-800',
              hasError && 'border-rose-500 text-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              disabled && 'opacity-50 cursor-not-allowed bg-surface-subtle'
            )}
            aria-label={`Digit ${index + 1} of ${effectiveLength}`}
          />
        );
      })}
    </div>
  );
};

export default OtpInput;
