import React from 'react';
import { CustomDropdown, DropdownOption } from './CustomDropdown';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  onValueChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  onValueChange,
  error,
  helperText,
  placeholder,
  disabled,
  className,
}) => {
  const dropdownOptions: DropdownOption<string>[] = options.map((opt) => ({
    value: opt.value,
    label: opt.label,
    description: opt.description,
  }));

  const currentValue = value || options[0]?.value || '';

  const handleDropdownChange = (newVal: string) => {
    onValueChange?.(newVal);
    onChange?.({ target: { value: newVal } } as any);
  };

  return (
    <div className={className}>
      <CustomDropdown
        label={label}
        options={dropdownOptions}
        value={currentValue}
        onChange={handleDropdownChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error ? (
        <p className="text-xs text-rose-500 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-foreground-muted mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Select;
