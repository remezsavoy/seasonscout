import { Link } from 'react-router-dom';

export function SearchResultCard({ result }) {
  return (
    <Link
      className="group rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-lagoon/20"
      to={result.href}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lagoon">{result.typeLabel}</p>
          <h3 className="mt-3 text-2xl font-semibold text-ink">{result.name}</h3>
          <p className="mt-2 text-sm text-ink/58">{result.subtitle}</p>
        </div>
        {result.badge ? (
          <span className="rounded-full bg-lagoon/10 px-3 py-1.5 text-xs font-semibold text-lagoon">
            {result.badge}
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-7 text-ink/70">{result.summary}</p>

      {result.tags?.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {result.tags.map((tag) => (
            <span
              key={`${result.key}-${tag}`}
              className="rounded-full border border-lagoon/15 bg-sand/60 px-3 py-1 text-xs font-medium text-ink/70"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <span className="mt-6 inline-flex items-center text-sm font-semibold text-lagoon transition group-hover:text-lagoon/80">
        {result.ctaLabel}
      </span>
    </Link>
  );
}
