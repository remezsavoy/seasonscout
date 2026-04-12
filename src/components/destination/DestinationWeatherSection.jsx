import { EmptyState } from '../ui/EmptyState';
import { SectionHeading } from '../ui/SectionHeading';

export function DestinationWeatherSection({
  currentWeather,
  forecast,
  note,
  provider,
}) {
  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Live weather"
        title="Current conditions and the next few days"
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <article className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Current weather</p>

          {currentWeather ? (
            <>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-5xl font-semibold text-ink">{currentWeather.temperature}</p>
                  <p className="mt-3 text-xl text-ink/80">{currentWeather.condition}</p>
                </div>
                <p className="max-w-[12rem] text-sm leading-6 text-ink/65">{currentWeather.updatedAt}</p>
              </div>

              <p className="mt-6 text-sm leading-7 text-ink/72">{currentWeather.summary}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {currentWeather.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[1.25rem] bg-ink/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-ink/45">{metric.label}</p>
                    <p className="mt-3 text-lg font-semibold text-ink">{metric.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="Current weather unavailable"
              description="Live conditions could not be prepared for this destination right now."
              className="mt-5 text-left"
            />
          )}
        </article>

        <article className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Short forecast</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">Four-day outlook</h3>
            </div>
            <p className="text-sm text-ink/55">{provider}</p>
          </div>

          {forecast.length > 0 ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {forecast.map((day) => (
                  <div key={day.dayLabel} className="rounded-[1.25rem] bg-sand/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lagoon">{day.dayLabel}</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{day.condition}</p>
                      </div>
                      <p className="text-sm font-medium text-ink/60">{day.precipitationChance} rain</p>
                    </div>
                    <div className="mt-5 flex items-center gap-4 text-sm text-ink/70">
                      <span>High {day.high}</span>
                      <span>Low {day.low}</span>
                    </div>
                  </div>
                ))}
              </div>

              {note ? <p className="mt-5 text-sm leading-7 text-ink/65">{note}</p> : null}
            </>
          ) : (
            <EmptyState
              title="Forecast unavailable"
              description="Short-term outlook data will appear here once the weather service returns forecast rows."
              className="mt-6 text-left"
            />
          )}
        </article>
      </div>
    </section>
  );
}
