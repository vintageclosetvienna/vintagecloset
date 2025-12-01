'use client';

import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface FormCheckboxGroupProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  required?: boolean;
}

export function FormCheckboxGroup({ 
  label, 
  options, 
  value = [], 
  onChange, 
  className,
  required 
}: FormCheckboxGroupProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-ink mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                isSelected
                  ? "bg-gradient-to-r from-accent-start to-accent-end text-white border-transparent shadow-sm"
                  : "bg-white border-hairline text-ink hover:border-muted"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-white/20 border-white/40" 
                  : "border-hairline bg-surface"
              )}>
                {isSelected && <Check size={10} weight="bold" />}
              </div>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

