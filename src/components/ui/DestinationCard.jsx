import { Link } from 'react-router-dom';

export function DestinationCard({ destination, footerAction = null }) {
  const tags = destination.tags ?? [];

  return (
    <article className="glass-panel flex h-full flex-col overflow-hidden p-6">
      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full bg-sunrise/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">
          {destination.region}
        </span>
        <span className="text-sm text-ink/55">{destination.country}</span>
      </div>

      <div className="mt-6">
        <h3 className="font-display text-3xl text-ink">{destination.name}</h3>
        <p className="mt-3 text-sm leading-7 text-ink/70">{destination.summary}</p>
      </div>

      <dl className="mt-6 grid gap-4 rounded-[1.5rem] bg-ink/5 p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.22em] text-ink/45">Best window</dt>
          <dd className="mt-2 text-sm font-semibold text-ink">{destination.bestWindow}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.22em] text-ink/45">Climate cue</dt>
          <dd className="mt-2 text-sm font-semibold text-ink">{destination.climateCue}</dd>
        </div>
      </dl>

      {tags.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-lagoon/15 bg-white/80 px-3 py-1 text-xs font-medium text-ink/70"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          className="inline-flex items-center text-sm font-semibold text-lagoon transition hover:text-lagoon/80"
          to={`/destinations/${destination.slug}`}
        >
          Open destination profile
        </Link>
        {footerAction}
      </div>
    </article>
  );
}
