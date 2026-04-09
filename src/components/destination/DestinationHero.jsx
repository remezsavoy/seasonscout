import { cn } from '../../lib/cn';
import { HeroImageAttribution } from '../ui/HeroImageAttribution';

export function DestinationHero({ destination, action = null, actionMessage = '' }) {
  const backgroundStyle = destination.heroImageUrl
    ? {
        backgroundImage: `linear-gradient(120deg, rgba(16, 32, 51, 0.88), rgba(16, 32, 51, 0.48)), url(${destination.heroImageUrl})`,
      }
    : undefined;
  const heroImageAttribution = destination.heroImageAttribution;

  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-[2.25rem] shadow-soft">
        <div
          className={cn(
            'absolute inset-0 bg-hero-glow bg-cover bg-center',
            destination.heroImageUrl
              ? 'bg-cover bg-center'
              : 'bg-[radial-gradient(circle_at_top_left,_rgba(244,201,139,0.32),_transparent_30%),linear-gradient(135deg,_#17344a_0%,_#102033_50%,_#2d6f6d_100%)]',
          )}
          style={backgroundStyle}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/30 to-transparent" />

        <div className="relative grid gap-10 px-6 py-8 text-white sm:px-8 sm:py-10 lg:grid-cols-[1.08fr,0.92fr] lg:px-12 lg:py-14">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sunrise">{destination.heroTag}</p>
            <h1 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">{destination.name}</h1>
            <p className="mt-3 text-lg text-white/72">
              {destination.country}
              {destination.continent ? ` / ${destination.continent}` : ''}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/84">{destination.summary}</p>

            {action || actionMessage ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                {action}
                {actionMessage ? <p className="text-sm text-white/74">{actionMessage}</p> : null}
              </div>
            ) : null}

            {destination.travelTags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {destination.travelTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 self-end sm:grid-cols-3 lg:grid-cols-1">
            {destination.heroHighlights.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">{item.label}</p>
                <p className="mt-3 text-xl font-semibold text-white">{item.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HeroImageAttribution attribution={heroImageAttribution} />
    </div>
  );
}
