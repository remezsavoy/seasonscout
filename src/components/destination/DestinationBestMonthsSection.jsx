import { EmptyState } from '../ui/EmptyState';
import { SectionHeading } from '../ui/SectionHeading';

export function DestinationBestMonthsSection({
  bestMonths,
  bestMonthsLabel,
  description,
  climateHighlights,
}) {
  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Best months to visit"
        title="Recommended travel window"
        description="The recommended months come from prepared destination data. The frontend only presents them and avoids owning the ranking logic."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <article className="rounded-[1.75rem] bg-ink p-6 text-white shadow-soft">
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">Best window</p>
          <h3 className="mt-3 text-3xl font-semibold">{bestMonthsLabel}</h3>
          <p className="mt-5 text-sm leading-7 text-white/75">{description}</p>

          {bestMonths.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {bestMonths.map((month) => (
                <span key={month} className="rounded-full bg-white/12 px-3 py-2 text-sm font-semibold">
                  {month}
                </span>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Recommendation pending"
              description="Best-month recommendations will appear here once the backend data is available."
              className="mt-6 border-white/10 bg-white/5 text-left shadow-none"
            />
          )}
        </article>

        <article className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Climate highlights</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {climateHighlights.map((item) => (
              <div key={item.label} className="rounded-[1.25rem] bg-ink/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-ink/45">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
