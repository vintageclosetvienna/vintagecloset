'use client';

import { cn } from '@/lib/utils';

interface FormToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function FormToggle({ label, description, checked, onChange, className }: FormToggleProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && (
          <p className="text-xs text-muted mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          checked ? "bg-gradient-to-r from-accent-start to-accent-end" : "bg-hairline"
        )}
      >
        <span
          className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

