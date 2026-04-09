export function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-3xl text-ink sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-sm leading-7 text-ink/70 sm:text-base">{description}</p> : null}
    </div>
  );
}
