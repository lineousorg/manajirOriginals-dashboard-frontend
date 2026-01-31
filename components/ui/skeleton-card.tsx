import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    className={cn(
      'bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer rounded-md',
      className
    )}
  />
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-4">
    <div className="flex gap-4">
      <Skeleton className="h-10 w-[300px]" />
      <Skeleton className="h-10 w-[180px]" />
    </div>
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 p-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-t">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex gap-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);
