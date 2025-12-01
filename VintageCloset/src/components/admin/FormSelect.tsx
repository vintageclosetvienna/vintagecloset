'use client';

import { forwardRef } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-ink mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full h-11 px-4 pr-10 rounded-lg border border-hairline bg-white text-ink appearance-none",
              "focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20",
              "transition-all cursor-pointer",
              error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
              !props.value && "text-muted/60"
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <CaretDown 
            size={16} 
            weight="bold" 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" 
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

