import { MapPin } from 'lucide-react';

function AttributionLink({ href, children }) {
  if (!href) {
    return <span className="font-medium text-ink/70">{children}</span>;
  }

  return (
    <a
      className="font-medium text-ink/70 underline decoration-ink/20 underline-offset-4 transition hover:text-ink"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export function HomeHeroMediaPanel() {
  return (
    <article className="rounded-[1.75rem] bg-ink/92 p-6 text-white shadow-soft ring-1 ring-white/10 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-white/60">Phase 1 focus</p>
      <p className="mt-3 text-3xl font-semibold">
        Destination search, climate context, live weather, and saved favorites.
      </p>
      <p className="mt-4 max-w-xl text-sm leading-7 text-white/78">
        The UI stays presentation-first while services keep the door open for RPC aggregation, weather normalization,
        and data-quality rules.
      </p>
    </article>
  );
}

export function HomeHeroImageMeta({ heroContent }) {
  const attributionName = heroContent?.heroImageAttributionName || null;
  const attributionUrl = heroContent?.heroImageAttributionUrl || null;
  const sourceName = heroContent?.heroImageSourceName || null;
  const sourceUrl = heroContent?.heroImageSourceUrl || null;
  const locationLabel = heroContent?.heroImageLocationLabel || null;

  if (!locationLabel && !attributionName && !sourceName) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1.5 px-1 text-right text-xs leading-6 text-ink/52">
      {locationLabel ? (
        <p className="inline-flex items-center gap-1.5 text-ink/58">
          <MapPin className="h-3.5 w-3.5 text-lagoon/70" strokeWidth={2} />
          <span>{locationLabel}</span>
        </p>
      ) : null}

      {attributionName || sourceName ? (
        <p>
          {sourceName === 'SeasonScout' && attributionName === 'SeasonScout' && !attributionUrl && !sourceUrl ? (
            <>
              Artwork by <span className="font-medium text-ink/70">SeasonScout</span>.
            </>
          ) : (
            <>
              Photo by{' '}
              <AttributionLink href={attributionUrl}>
                {attributionName || 'the photographer'}
              </AttributionLink>
              {sourceName ? (
                <>
                  {' '}on{' '}
                  <AttributionLink href={sourceUrl}>
                    {sourceName}
                  </AttributionLink>
                </>
              ) : null}
              .
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
