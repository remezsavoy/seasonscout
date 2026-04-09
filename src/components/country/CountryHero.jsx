import { cn } from '../../lib/cn';
import { HeroImageAttribution } from '../ui/HeroImageAttribution';

export function CountryHero({ country }) {
  const backgroundStyle = country.heroImageUrl
    ? {
        backgroundImage: `linear-gradient(120deg, rgba(16, 32, 51, 0.9), rgba(16, 32, 51, 0.42)), url(${country.heroImageUrl})`,
      }
    : undefined;

  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-[2.25rem] shadow-soft">
        <div
          className={cn(
            'absolute inset-0 bg-cover bg-center',
            country.heroImageUrl
              ? 'bg-cover bg-center'
              : 'bg-[radial-gradient(circle_at_top_left,_rgba(244,201,139,0.28),_transparent_28%),linear-gradient(135deg,_#17344a_0%,_#102033_48%,_#2d6f6d_100%)]',
          )}
          style={backgroundStyle}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/58 via-ink/32 to-transparent" />

        <div className="relative grid gap-10 px-6 py-8 text-white sm:px-8 sm:py-10 lg:grid-cols-[1.08fr,0.92fr] lg:px-12 lg:py-14">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sunrise">Country guide</p>
            <h1 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">{country.name}</h1>
            <p className="mt-3 text-lg text-white/72">{country.continent || 'Travel planning overview'}</p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/84">{country.summary}</p>
          </div>

          <div className="grid gap-4 self-end sm:grid-cols-3 lg:grid-cols-1">
            {country.overviewItems.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">{item.label}</p>
                <p className="mt-3 text-lg font-semibold leading-7 text-white">{item.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HeroImageAttribution attribution={country.heroImageAttribution} />
    </div>
  );
}
