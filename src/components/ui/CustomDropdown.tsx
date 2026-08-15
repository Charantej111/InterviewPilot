import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DropdownOption<T = string | number> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export interface CustomDropdownProps<T = string | number> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomDropdown<T extends string | number>({
  options,
  value,
  onChange,
  label,
  icon: HeaderIcon,
  placeholder = 'Select option',
  disabled = false,
  className,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative w-full space-y-1.5 text-left', className)} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
          {HeaderIcon && <HeaderIcon size={12} className="text-zinc-400" />}
          <span>{label}</span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs',
          'bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-foreground',
          'hover:border-zinc-400 dark:hover:border-zinc-600',
          isOpen && 'ring-2 ring-zinc-500/20 border-zinc-400 dark:border-zinc-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon size={14} className="text-zinc-500 shrink-0" />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            'text-zinc-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-foreground'
          )}
        />
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white dark:bg-[#13121d] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1.5 space-y-0.5 animate-fadeIn max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value;
            const OptionIcon = option.icon;

            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer',
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {OptionIcon && (
                    <OptionIcon
                      size={14}
                      className={cn(
                        'shrink-0',
                        isSelected
                          ? 'text-white dark:text-zinc-950'
                          : 'text-zinc-400'
                      )}
                    />
                  )}
                  <div className="truncate">
                    <div>{option.label}</div>
                    {option.description && (
                      <div
                        className={cn(
                          'text-[10px] font-normal leading-tight mt-0.5',
                          isSelected
                            ? 'text-white/80 dark:text-zinc-950/80'
                            : 'text-foreground-muted'
                        )}
                      >
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check
                    size={13}
                    className="shrink-0 ml-2 text-white dark:text-zinc-950"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;
