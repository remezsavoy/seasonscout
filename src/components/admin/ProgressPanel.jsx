import { CheckCircle2, Circle, LoaderCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

function StepIcon({ status }) {
  if (status === 'completed') {
    return <CheckCircle2 className="h-5 w-5 text-lagoon" />;
  }

  if (status === 'active') {
    return <LoaderCircle className="h-5 w-5 animate-spin text-ink" />;
  }

  if (status === 'error') {
    return <XCircle className="h-5 w-5 text-coral" />;
  }

  return <Circle className="h-5 w-5 text-ink/25" />;
}

export function ProgressPanel({ steps, errorMessage }) {
  return (
    <div className="rounded-[1.75rem] border border-white/18 bg-white/10 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Pipeline progress</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Country composition is running</h3>
        </div>
        <div className="rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
          Live status
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {steps.map((step) => (
          <div
            key={step.key}
            className={cn(
              'flex items-center gap-4 rounded-[1.25rem] border px-4 py-4 transition',
              step.status === 'active' && 'border-white/20 bg-white/12',
              step.status === 'completed' && 'border-lagoon/25 bg-lagoon/10',
              step.status === 'pending' && 'border-white/12 bg-white/6',
              step.status === 'error' && 'border-coral/25 bg-coral/10',
            )}
          >
            <StepIcon status={step.status} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{step.label}</p>
              <p className="mt-1 text-sm leading-6 text-white/78">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {errorMessage ? <p className="mt-4 text-sm leading-7 text-white/90">{errorMessage}</p> : null}
    </div>
  );
}
