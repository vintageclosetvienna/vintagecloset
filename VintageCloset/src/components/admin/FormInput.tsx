'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, prefix, suffix, className, ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-ink mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-11 px-4 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60",
              "focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20",
              "transition-all",
              prefix && "pl-8",
              suffix && "pr-8",
              error && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

