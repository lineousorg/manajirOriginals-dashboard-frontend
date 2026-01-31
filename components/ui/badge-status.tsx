import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'featured' | 'best';
  className?: string;
}

const statusStyles = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  featured: 'bg-accent/10 text-accent border-accent/20',
  best: 'bg-info/10 text-info border-info/20',
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  featured: 'Featured',
  best: 'Best Seller',
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
};
