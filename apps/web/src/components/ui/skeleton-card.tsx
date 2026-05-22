import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-[24px] p-6 bg-surface border border-border animate-pulse', className)}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-surface-raised" />
        <div className="h-4 bg-surface-raised rounded w-24" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-surface-raised rounded mb-2"
          style={{ width: `${85 - i * 15}%`, opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function SkeletonMetric({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-[24px] p-6 bg-surface border border-border animate-pulse', className)}>
      <div className="flex items-start justify-between mb-5">
        <div className="w-10 h-10 rounded-xl bg-surface-raised" />
        <div className="h-5 bg-surface-raised rounded w-14" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-surface-raised rounded w-16" />
        <div className="h-9 bg-surface-raised rounded w-28" />
      </div>
    </div>
  );
}

export function SkeletonText({ className, width = '100%' }: { className?: string; width?: string }) {
  return (
    <div
      className={cn('h-4 bg-surface-raised rounded animate-pulse', className)}
      style={{ width }}
    />
  );
}
