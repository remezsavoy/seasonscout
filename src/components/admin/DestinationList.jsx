import { Link } from 'react-router-dom';
import { ExternalLink, RefreshCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { EditableImageThumbnail } from './EditableImageThumbnail';
import { StatusBadge } from './StatusBadge';

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

function formatMonth(monthNumber) {
  if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  return monthFormatter.format(new Date(Date.UTC(2024, monthNumber - 1, 1)));
}

function formatComfortScore(value) {
  if (value === null || value === undefined) {
    return 'Unavailable';
  }

  return `${Number(value).toFixed(0)}/100`;
}

export function DestinationList({
  countryName,
  destinations,
  onDeleteDestination,
  onRegenerateDestination,
  onEditImage,
}) {
  const [regeneratingId, setRegeneratingId] = useState('');
  const [deletingId, setDeletingId] = useState('');

  if (!destinations?.length) {
    return (
      <EmptyState
        className="bg-sand/35 text-left"
        title="No destinations yet"
        description={`Generated destinations for ${countryName} will appear here once the backend pipeline writes them.`}
      />
    );
  }

  return (
    <div className="space-y-3">
      {destinations.map((destination) => (
        <article
          key={destination.id ?? destination.slug}
          className="grid gap-4 rounded-[1.5rem] border border-ink/8 bg-sand/35 p-4 transition-[background-color,border-color] duration-200 lg:grid-cols-[auto,1fr,auto]"
        >
          <EditableImageThumbnail
            alt={`${destination.name} hero`}
            className="h-20 w-full lg:w-28"
            imageUrl={destination.hero_image_url}
            onClick={() => onEditImage(destination)}
          />

          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-semibold text-ink">{destination.name}</h4>
              <StatusBadge status={destination.enrichment_status} />
              <StatusBadge status={destination.climate_import_status} />
              {destination.is_published ? <StatusBadge status="published" /> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {(destination.best_months ?? []).map((month) => (
                <span
                  key={`${destination.id ?? destination.slug}-${month}`}
                  className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/70"
                >
                  {formatMonth(month)}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(destination.travel_tags ?? []).map((tag) => (
                <span key={tag} className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs text-ink/68">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 lg:items-end">
            <div className="rounded-[1.25rem] bg-white/75 px-4 py-3 text-sm text-ink/68">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Comfort score</p>
              <p className="mt-2 font-semibold text-ink">{formatComfortScore(destination.comfort_score)}</p>
            </div>

            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-lagoon"
              rel="noreferrer"
              target="_blank"
              to={`/destinations/${destination.slug}`}
            >
              View destination
              <ExternalLink className="h-4 w-4" />
            </Link>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                className="min-w-[8.75rem]"
                disabled={!destination.id || regeneratingId === destination.id || deletingId === destination.id}
                onClick={async () => {
                  if (!onRegenerateDestination) {
                    return;
                  }

                  setRegeneratingId(destination.id);

                  try {
                    await onRegenerateDestination(destination);
                  } finally {
                    setRegeneratingId('');
                  }
                }}
                size="sm"
                variant="secondary"
              >
                <RefreshCcw className={`mr-2 h-4 w-4 ${regeneratingId === destination.id ? 'animate-spin' : ''}`} />
                {regeneratingId === destination.id ? 'Re-generating...' : 'Re-generate'}
              </Button>
              <Button
                className="min-w-[7rem] bg-coral hover:bg-coral/90"
                disabled={!destination.id || deletingId === destination.id || regeneratingId === destination.id}
                onClick={async () => {
                  if (!onDeleteDestination) {
                    return;
                  }

                  setDeletingId(destination.id);

                  try {
                    await onDeleteDestination(destination);
                  } finally {
                    setDeletingId('');
                  }
                }}
                size="sm"
              >
                <Trash2 className={`mr-2 h-4 w-4 ${deletingId === destination.id ? 'animate-pulse' : ''}`} />
                {deletingId === destination.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
