import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md shimmer",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-bg-card border border-border">
      <Skeleton className="aspect-[59/86] w-full" />
      <div className="p-2 space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2.5 w-2/3" />
      </div>
    </div>
  );
}
