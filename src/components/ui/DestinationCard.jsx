import { useNavigate } from 'react-router-dom';

export function DestinationCard({ destination, photoUrl = null, topRightAction = null }) {
  const navigate = useNavigate();
  const tags = destination.tags ?? [];
  const isCountryCard = destination.type === 'country' || destination.typeLabel === 'Country';
  const isDestinationCard = destination.type === 'destination';
  const destinationHref = isCountryCard
    ? `/country/${destination.slug}`
    : isDestinationCard
      ? `/destination/${destination.slug}`
      : destination.href || `/destinations/${destination.slug}`;
  const heroImageAttribution = destination.heroImageAttribution ?? null;
  const imageUrl = destination.heroImageUrl;
  const optimizedImageUrl = imageUrl
    ? imageUrl.replace(/w=\d+/, 'w=600').replace(/q=\d+/, 'q=70')
    : '';
  const creditHref = photoUrl || heroImageAttribution?.photographerUrl;
  const title = destination.name;
  const subtitle = isCountryCard ? '' : destination.country || destination.subtitle || '';

  return (
    <div
      className="glass-panel group relative flex h-full w-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-md dark:border dark:border-slate-800 dark:bg-black/40 dark:shadow-none dark:backdrop-blur-md"
      onClick={() => navigate(destinationHref)}
    >
      <div className="relative z-10 pointer-events-none">
        {imageUrl ? (
          <div className="relative aspect-video w-full">
            <img
              alt={`${destination.name} overview`}
              className="w-full h-full object-cover object-center"
              src={optimizedImageUrl}
              loading="lazy"
              decoding="async"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />
            {topRightAction ? (
              <div
                className="absolute right-3 top-3 z-10 pointer-events-auto"
                onClick={(event) => event.stopPropagation()}
              >
                {topRightAction}
              </div>
            ) : null}
            {heroImageAttribution ? (
              <div className="absolute bottom-0 right-0 pointer-events-auto">
                <a
                  className="rounded-tl-md bg-black/30 px-1.5 py-0.5 text-[10px] text-white/70 transition hover:text-white"
                  href={creditHref}
                  onClick={(e) => e.stopPropagation()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {heroImageAttribution.photographerName} / Unsplash
                </a>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="aspect-video w-full bg-gradient-to-br from-sand/70 via-white to-lagoon/10" />
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-4 pointer-events-none">
          <span className="rounded-full bg-sunrise/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/70 dark:bg-sunrise/15 dark:text-slate-200">
            {destination.region}
          </span>
          {isCountryCard ? (
            <span className="rounded-full border border-ink/10 bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/62 dark:border-slate-800 dark:bg-white/[0.04] dark:text-slate-300">
              Country
            </span>
          ) : null}
        </div>

        <div className="pointer-events-none">
          <h3 className="font-display text-3xl text-ink dark:text-slate-50">{title}</h3>
          {subtitle ? <p className="mt-2 text-sm text-ink/55 dark:text-slate-300/80">{subtitle}</p> : null}
          <p className="mt-5 line-clamp-2 text-sm leading-7 text-ink/70 dark:text-slate-300/80">{destination.summary}</p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <dl className="relative grid gap-4 rounded-[1.5rem] bg-ink/5 p-5 pointer-events-none sm:grid-cols-2 dark:bg-white/5 dark:backdrop-blur-md">
            <div>
              <dt className="text-xs uppercase tracking-[0.22em] text-ink/45 dark:text-slate-400">Best window</dt>
              <dd className="mt-2 text-sm font-semibold text-ink dark:text-slate-100">{destination.bestWindow}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.22em] text-ink/45 dark:text-slate-400">Climate cue</dt>
              <dd className="mt-2 text-sm font-semibold text-ink dark:text-slate-100">{destination.climateCue}</dd>
            </div>
          </dl>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 pointer-events-none">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-lagoon/15 bg-white/80 px-3 py-1 text-xs font-medium text-ink/70 dark:border-slate-800 dark:bg-white/[0.04] dark:text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
