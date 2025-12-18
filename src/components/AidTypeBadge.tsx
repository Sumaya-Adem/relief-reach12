import { AidType, AID_TYPE_LABELS, AID_TYPE_ICONS } from '@/types/aid';
import { cn } from '@/lib/utils';
import { Droplets, Utensils, HeartPulse, Banknote } from 'lucide-react';

interface AidTypeBadgeProps {
  type: AidType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const iconMap: Record<AidType, React.ElementType> = {
  water: Droplets,
  food: Utensils,
  health: HeartPulse,
  cash: Banknote,
};

const colorMap: Record<AidType, string> = {
  water: 'bg-blue-100 text-blue-700',
  food: 'bg-amber-100 text-amber-700',
  health: 'bg-rose-100 text-rose-700',
  cash: 'bg-sky-100 text-sky-700',
};

export function AidTypeBadge({ type, size = 'md', showIcon = true }: AidTypeBadgeProps) {
  const Icon = iconMap[type];
  
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
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      colorMap[type],
      sizeClasses[size]
    )}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{AID_TYPE_LABELS[type]}</span>
    </span>
  );
}
