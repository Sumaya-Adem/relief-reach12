import { AreaStatus } from '@/types/aid';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: AreaStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig: Record<AreaStatus, { label: string; icon: React.ElementType; className: string }> = {
  'not-aided': {
    label: 'Not Aided',
    icon: Circle,
    className: 'status-unaided',
  },
  'partially-aided': {
    label: 'Partially Aided',
    icon: AlertCircle,
    className: 'status-partial',
  },
  'fully-aided': {
    label: 'Fully Aided',
    icon: CheckCircle,
    className: 'status-aided bg-green-100 text-green-800',
  },
  'duplicate-warning': {
    label: 'Duplicate Warning',
    icon: AlertTriangle,
    className: 'status-duplicate',
  },
};

export function StatusBadge({ status, size = 'md', showLabel = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span className={cn('status-badge', config.className, sizeClasses[size])}>
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
