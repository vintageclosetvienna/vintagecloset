'use client';

import { cn } from '@/lib/utils';
import { IconProps } from '@phosphor-icons/react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<IconProps>;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl p-6 border border-hairline shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-start/10 to-accent-end/10 flex items-center justify-center">
          <Icon size={20} className="text-accent-start" weight="duotone" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-full",
            trend.positive 
              ? "bg-green-50 text-green-600" 
              : "bg-red-50 text-red-600"
          )}>
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      <p className="text-sm text-muted mb-1">{title}</p>
      <p className="text-2xl font-display font-bold text-ink">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}

