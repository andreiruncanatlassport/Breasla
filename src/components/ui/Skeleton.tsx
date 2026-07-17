import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-shimmer rounded-lg", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="block-base p-5">
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-2.5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <div className="block-base mt-8 space-y-4 p-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
