import { PageContainer } from '../ui/PageContainer';
import { SkeletonBlock } from '../ui/SkeletonBlock';

export function DestinationPageSkeleton() {
  return (
    <PageContainer className="space-y-10">
      <section className="overflow-hidden rounded-[2.25rem] bg-ink p-6 shadow-soft sm:p-8 lg:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.08fr,0.92fr]">
          <div>
            <SkeletonBlock className="h-4 w-40 bg-white/20" />
            <SkeletonBlock className="mt-5 h-14 w-3/4 bg-white/20" />
            <SkeletonBlock className="mt-4 h-5 w-32 bg-white/20" />
            <SkeletonBlock className="mt-8 h-4 w-full bg-white/20" />
            <SkeletonBlock className="mt-3 h-4 w-11/12 bg-white/20" />
            <SkeletonBlock className="mt-3 h-4 w-4/5 bg-white/20" />
            <div className="mt-6 flex flex-wrap gap-2">
              <SkeletonBlock className="h-8 w-20 rounded-full bg-white/20" />
              <SkeletonBlock className="h-8 w-24 rounded-full bg-white/20" />
              <SkeletonBlock className="h-8 w-16 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-28 bg-white/15" />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-5 h-10 w-36" />
            <SkeletonBlock className="mt-4 h-4 w-full" />
            <SkeletonBlock className="mt-3 h-4 w-5/6" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-5 h-10 w-40" />
            <SkeletonBlock className="mt-4 h-4 w-full" />
            <SkeletonBlock className="mt-3 h-4 w-11/12" />
            <SkeletonBlock className="mt-3 h-4 w-4/5" />
          </div>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="mt-5 h-4 w-full" />
        <SkeletonBlock className="mt-3 h-4 w-11/12" />
        <SkeletonBlock className="mt-3 h-4 w-4/5" />
        <div className="mt-6 grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-14 w-full" />
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
