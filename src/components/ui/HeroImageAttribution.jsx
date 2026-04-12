function AttributionLink({ href, children }) {
  if (!href) {
    return <span className="font-medium text-ink/70 dark:text-slate-400">{children}</span>;
  }

  return (
    <a
      className="font-medium text-ink/70 underline decoration-ink/20 underline-offset-4 transition hover:text-ink dark:text-slate-400 dark:decoration-slate-700 dark:hover:text-slate-200"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export function HeroImageAttribution({ attribution }) {
  if (!attribution) {
    return null;
  }

  return (
    <p className="px-1 text-right text-xs leading-6 text-ink/52 dark:text-slate-400">
      Photo by{' '}
      <AttributionLink href={attribution.photographerUrl}>
        {attribution.photographerName}
      </AttributionLink>{' '}
      on{' '}
      <AttributionLink href={attribution.sourceUrl}>
        {attribution.sourceName}
      </AttributionLink>
      .
    </p>
  );
}
