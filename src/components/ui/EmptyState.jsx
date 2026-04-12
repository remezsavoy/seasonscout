import { cn } from '../../lib/cn';

export function EmptyState({
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border border-dashed border-ink/15 bg-white/55 p-6 text-center shadow-soft',
        className,
      )}
    >
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-ink/70">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
