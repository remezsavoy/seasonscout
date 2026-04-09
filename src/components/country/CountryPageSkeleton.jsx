import { PageContainer } from '../ui/PageContainer';
import { SkeletonBlock } from '../ui/SkeletonBlock';

export function CountryPageSkeleton() {
  return (
    <PageContainer className="space-y-10">
      <section className="overflow-hidden rounded-[2.25rem] bg-ink p-6 shadow-soft sm:p-8 lg:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.08fr,0.92fr]">
          <div>
            <SkeletonBlock className="h-4 w-32 bg-white/20" />
            <SkeletonBlock className="mt-5 h-14 w-2/3 bg-white/20" />
            <SkeletonBlock className="mt-4 h-5 w-28 bg-white/20" />
            <SkeletonBlock className="mt-8 h-4 w-full bg-white/20" />
            <SkeletonBlock className="mt-3 h-4 w-11/12 bg-white/20" />
            <SkeletonBlock className="mt-3 h-4 w-4/5 bg-white/20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-24 bg-white/15" />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-5 h-10 w-52" />
            <SkeletonBlock className="mt-4 h-4 w-full" />
            <SkeletonBlock className="mt-3 h-4 w-11/12" />
            <SkeletonBlock className="mt-3 h-4 w-4/5" />
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="h-10 w-80" />
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-panel p-6">
              <SkeletonBlock className="h-8 w-24 rounded-full" />
              <SkeletonBlock className="mt-6 h-10 w-36" />
              <SkeletonBlock className="mt-4 h-4 w-full" />
              <SkeletonBlock className="mt-2 h-4 w-5/6" />
              <SkeletonBlock className="mt-6 h-24 w-full" />
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
