import { cn } from '../../lib/cn';

const toneClasses = {
  neutral: 'border-ink/10 bg-white/80 text-ink',
  error: 'border-coral/25 bg-coral/10 text-ink',
  success: 'border-lagoon/20 bg-lagoon/10 text-ink',
};

export function StatusPanel({
  title,
  description,
  action,
  tone = 'neutral',
  className,
}) {
  return (
    <div className={cn('rounded-[1.75rem] border p-6 shadow-soft', toneClasses[tone], className)}>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-2 max-w-xl text-sm leading-7 text-ink/70">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
