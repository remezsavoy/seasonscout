import { SkeletonBlock } from '../ui/SkeletonBlock';

export function FavoritesGridSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <article key={`favorite-skeleton-${index}`} className="glass-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <SkeletonBlock className="h-8 w-28 rounded-full" />
            <SkeletonBlock className="h-4 w-20" />
          </div>

          <div className="mt-6 space-y-3">
            <SkeletonBlock className="h-10 w-44" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-11/12" />
          </div>

          <div className="mt-6 grid gap-4 rounded-[1.5rem] bg-ink/5 p-4 sm:grid-cols-2">
            <SkeletonBlock className="h-16 w-full" />
            <SkeletonBlock className="h-16 w-full" />
          </div>

          <div className="mt-8 flex items-center gap-4">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-5 w-20" />
          </div>
        </article>
      ))}
    </div>
  );
}
