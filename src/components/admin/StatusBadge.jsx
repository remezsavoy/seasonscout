import { cn } from '../../lib/cn';

const badgeStyles = {
  published: 'border-lagoon/20 bg-lagoon/10 text-lagoon',
  enriched: 'border-sky-200 bg-sky-50 text-sky-700',
  importing: 'border-sky-200 bg-sky-50 text-sky-700',
  enriching: 'border-sky-200 bg-sky-50 text-sky-700',
  imported: 'border-lagoon/20 bg-lagoon/10 text-lagoon',
  pending: 'border-sunrise/35 bg-sunrise/20 text-ink',
  draft: 'border-sunrise/35 bg-sunrise/20 text-ink',
  failed: 'border-coral/25 bg-coral/10 text-coral',
};

function labelize(status) {
  if (!status) {
    return 'Unknown';
  }

  return status.replace(/_/g, ' ');
}

export function StatusBadge({ status, className }) {
  const normalizedStatus = status?.toLowerCase?.() ?? 'pending';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize tracking-[0.16em]',
        badgeStyles[normalizedStatus] ?? badgeStyles.pending,
        className,
      )}
    >
      {labelize(normalizedStatus)}
    </span>
  );
}
