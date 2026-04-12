import { ArrowRight, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProgressPanel } from './ProgressPanel';

const maxDestinationOptions = [5, 6, 7, 8];

export function AddCountrySection({
  countryName,
  maxDestinations,
  isSubmitting,
  progressSteps,
  result,
  errorMessage,
  onCountryNameChange,
  onMaxDestinationsChange,
  onSubmit,
  onRetry,
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/55 bg-ink shadow-soft">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,201,139,0.28),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(133,221,198,0.16),transparent_28%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/95 to-lagoon/80" />

      <div className="relative grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr,0.85fr] lg:px-10 lg:py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Admin dashboard</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-white sm:text-5xl">
            Compose a full country package from one admin workflow.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-white sm:text-base">
            This is the backend pipeline control surface for `compose-country-full`: country editorial, destination
            discovery, image selection, climate import, and publish-readiness refreshes in one run.
          </p>

          <form
            className="mt-8 space-y-4 rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur"
            onSubmit={onSubmit}
          >
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Country</span>
              <input
                className="mt-3 w-full rounded-[1.35rem] border border-white/25 bg-white/90 px-5 py-4 text-base text-ink outline-none transition placeholder:text-ink/38 focus:border-white"
                disabled={isSubmitting}
                onChange={(event) => onCountryNameChange(event.target.value)}
                placeholder="Enter country name..."
                value={countryName}
              />
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <label className="block sm:w-52">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Max destinations</span>
                <select
                  className="mt-3 w-full rounded-[1.35rem] border border-white/25 bg-white/90 px-5 py-4 text-base text-ink outline-none transition focus:border-white"
                  disabled={isSubmitting}
                  onChange={(event) => onMaxDestinationsChange(Number(event.target.value))}
                  value={maxDestinations}
                >
                  {maxDestinationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <Button className="min-w-[13rem]" disabled={isSubmitting} size="lg" type="submit">
                {isSubmitting ? 'Generating...' : 'Generate Country'}
              </Button>
            </div>

            <p className="text-sm leading-7 text-white/80">
              The current backend contract accepts 5-8 generated destinations per run.
            </p>
          </form>

          {errorMessage ? (
            <div className="mt-5 rounded-[1.5rem] border border-coral/30 bg-coral/10 p-4 text-sm leading-7 text-white">
              <p className="font-semibold text-white">Generation failed</p>
              <p className="mt-2 text-white/90">{errorMessage}</p>
              <div className="mt-4">
                <Button onClick={onRetry} size="sm" variant="secondary">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retry last request
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          {progressSteps?.length ? <ProgressPanel errorMessage={errorMessage} steps={progressSteps} /> : null}

          {result ? (
            <article className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/85 shadow-soft">
              <div className="h-48 bg-ink/10">
                {result.country.hero_image_url ? (
                  <img
                    alt={`${result.country.name} hero`}
                    className="h-full w-full object-cover"
                    src={result.country.hero_image_url}
                  />
                ) : null}
              </div>

              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Latest run</p>
                <h3 className="mt-3 text-2xl font-semibold text-ink">{result.country.name}</h3>
                <p className="mt-3 text-sm leading-7 text-ink/68">
                  {result.stats.destinations_created} destinations created, {result.stats.destinations_published} published,
                  and {result.stats.climate_imports_completed} climate imports completed.
                </p>

                <a
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-lagoon"
                  href={`/countries/${result.country.slug}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  View country
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          ) : (
            <article className="rounded-[1.75rem] border border-white/18 bg-white/10 p-6 text-white/85 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Pipeline outcome</p>
              <p className="mt-4 text-2xl font-semibold text-white">Ready for the next country run</p>
              <p className="mt-4 text-sm leading-7 text-white/78">
                Successful runs return the country hero image, publication state, destination totals, and the generated
                country route.
              </p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
