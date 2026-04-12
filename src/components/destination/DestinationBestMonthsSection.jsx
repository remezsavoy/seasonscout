import { EmptyState } from '../ui/EmptyState';
import { SectionHeading } from '../ui/SectionHeading';

function splitHighlightValue(value) {
  const [primary, ...rest] = String(value ?? '').split(' - ');

  return {
    primary: primary || '',
    secondary: rest.join(' - ') || '',
  };
}

export function DestinationBestMonthsSection({
  bestMonths,
  bestMonthsLabel,
  peakSeason,
  description,
  climateHighlights,
}) {
  return (
    <section className="flex h-full flex-col space-y-8">
      <SectionHeading
        eyebrow="Best months to visit"
        title="Recommended travel window"
      />

      <div className="flex flex-1 items-stretch">
        <div className="grid flex-1 gap-8 lg:grid-cols-[0.9fr,1.1fr]">
        <article className="flex h-full flex-col rounded-[1.75rem] bg-ink p-5 text-white shadow-soft sm:p-6">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/55">Peak season</p>
              <h3 className="mt-2 text-2xl font-semibold">{peakSeason || 'Peak timing pending'}</h3>
              <p className="mt-2 text-sm leading-6 text-white/68">When the destination is typically busiest.</p>
            </div>

            <div className="my-4 h-px bg-white/10" />

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/55">Optimal weather</p>
              <h3 className="mt-2 text-2xl font-semibold">{bestMonthsLabel}</h3>
              <p className="mt-2 text-sm leading-6 text-white/68">The strongest climate window from stored weather patterns.</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-white/75">{description}</p>

          {bestMonths.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
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
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {climateHighlights.map((item) => {
              const { primary, secondary } = splitHighlightValue(item.value);

              return (
              <div
                key={item.label}
                className="flex min-h-[7.5rem] flex-col items-center justify-center rounded-[1.25rem] bg-ink/5 p-3 text-center"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-ink/45">{item.label}</p>
                <div className="mt-3 space-y-1">
                  <p className="text-base font-medium text-ink">{primary}</p>
                  {secondary ? <p className="text-lg font-semibold text-ink">{secondary}</p> : null}
                </div>
              </div>
            )})}
          </div>
        </article>
        </div>
      </div>
    </section>
  );
}
