import { cn } from '../../lib/cn';
import {
  sharedHeroImageBaseClassName,
  sharedHeroImageContainerClassName,
  sharedHeroImageFallbackClassName,
  sharedHeroImageOverlayClassName,
} from '../ui/heroImageStyles';
import { HeroImageAttribution } from '../ui/HeroImageAttribution';

export function DestinationHero({ destination, topRightAction = null }) {
  const optimizedHeroUrl = destination.heroImageUrl
    ? destination.heroImageUrl.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=75')
    : null;
  const backgroundStyle = optimizedHeroUrl
    ? { backgroundImage: `url(${optimizedHeroUrl})` }
    : undefined;
  const heroImageAttribution = destination.heroImageAttribution;

  return (
    <div className="space-y-3">
      <section className={sharedHeroImageContainerClassName}>
        <div
          className={cn(
            sharedHeroImageBaseClassName,
            destination.heroImageUrl ? null : sharedHeroImageFallbackClassName,
          )}
          style={backgroundStyle}
        />
        <div className={sharedHeroImageOverlayClassName} />
        {topRightAction ? <div className="absolute right-6 top-3 z-10 sm:right-8 sm:top-5 lg:right-10 lg:top-7">{topRightAction}</div> : null}

        <div className="relative grid gap-10 px-6 py-6 text-white sm:px-8 sm:py-10 lg:grid-cols-[1.08fr,0.92fr] lg:px-12 lg:py-14">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sunrise">{destination.heroTag}</p>
            <h1 className="mt-4 font-display text-4xl leading-tight drop-shadow-md sm:text-5xl lg:text-6xl">{destination.name}</h1>
            <p className="mt-3 text-lg capitalize text-white/72 drop-shadow-md">
              {destination.country}
              {destination.continent ? ` / ${destination.continent}` : ''}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/84 drop-shadow-md sm:leading-8">{destination.summary}</p>

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

          <div className="hidden gap-4 self-end sm:grid-cols-3 lg:grid lg:grid-cols-1">
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

      {destination.heroHighlights.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 lg:hidden">
          {destination.heroHighlights.map((item) => (
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

      <HeroImageAttribution attribution={heroImageAttribution} />
    </div>
  );
}
