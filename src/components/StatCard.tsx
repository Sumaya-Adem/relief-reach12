import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'unaided' | 'partial' | 'aided' | 'duplicate';
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-card border-border',
  unaided: 'bg-status-unaided/10 border-status-unaided/30',
  partial: 'bg-status-partial/10 border-status-partial/30',
  aided: 'bg-status-aided/10 border-status-aided/30',
  duplicate: 'bg-status-duplicate/10 border-status-duplicate/30',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  unaided: 'bg-status-unaided/20 text-status-unaided',
  partial: 'bg-status-partial/20 text-status-partial',
  aided: 'bg-status-aided/20 text-status-aided',
  duplicate: 'bg-status-duplicate/20 text-status-duplicate',
};

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'default', onClick }: StatCardProps) {
  return (
    <div 
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconVariantStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
