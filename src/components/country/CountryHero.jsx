import { cn } from '../../lib/cn';
import {
  sharedHeroImageBaseClassName,
  sharedHeroImageContainerClassName,
  sharedHeroImageFallbackClassName,
  sharedHeroImageOverlayClassName,
} from '../ui/heroImageStyles';
import { HeroImageAttribution } from '../ui/HeroImageAttribution';

export function CountryHero({ country }) {
  const optimizedHeroUrl = country.heroImageUrl
    ? country.heroImageUrl.replace(/w=\d+/, 'w=1600').replace(/q=\d+/, 'q=80')
    : null;
  const backgroundStyle = optimizedHeroUrl
    ? { backgroundImage: `url(${optimizedHeroUrl})` }
    : undefined;

  return (
    <div className="space-y-3">
      <section className={sharedHeroImageContainerClassName}>
        <div
          className={cn(
            sharedHeroImageBaseClassName,
            country.heroImageUrl ? null : sharedHeroImageFallbackClassName,
          )}
          style={backgroundStyle}
        />
        <div className={sharedHeroImageOverlayClassName} />

        <div className="relative grid gap-10 px-6 py-6 text-white sm:px-8 sm:py-10 lg:grid-cols-[1.08fr,0.92fr] lg:px-12 lg:py-14">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sunrise">Country guide</p>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">{country.name}</h1>
            <p className="mt-3 text-lg text-white/72">{country.continent || 'Travel planning overview'}</p>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/84 sm:leading-8">{country.summary}</p>
          </div>

          <div className="hidden gap-4 self-end sm:grid-cols-3 lg:grid lg:grid-cols-1">
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

      {country.overviewItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {country.overviewItems.map((item) => (
            <article
              key={item.label}
              className="rounded-[1.5rem] border border-ink/10 bg-white/80 p-4 shadow-soft dark:border-slate-800 dark:bg-white/[0.04]"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-ink/45 dark:text-slate-400">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-ink dark:text-slate-100">{item.value}</p>
            </article>
          ))}
        </div>
      ) : null}

      <HeroImageAttribution attribution={country.heroImageAttribution} />
    </div>
  );
}
