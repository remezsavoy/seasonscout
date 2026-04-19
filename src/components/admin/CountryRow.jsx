import { ExternalLink, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { DestinationList } from './DestinationList';
import { EditableImageThumbnail } from './EditableImageThumbnail';
import { StatusBadge } from './StatusBadge';

function formatDate(value) {
  if (!value) {
    return 'Not enriched yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function CountryRow({
  country,
  destinations,
  isRegenerating,
  isDeleting,
  onDeleteDestination,
  onRegenerateDestination,
  onEditCountryImage,
  onEditDestinationImage,
  onRegenerate,
  onDelete,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="rounded-[1.75rem] border border-ink/10 bg-white/82 shadow-soft transition-[box-shadow,border-color] duration-200">
      <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.3fr),repeat(3,minmax(0,0.55fr)),auto]">
        <div className="flex min-w-0 items-center gap-4 rounded-[1.5rem] text-left">
          <button
            aria-expanded={isExpanded}
            className="mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand/55 text-ink ring-1 ring-ink/10 transition duration-300 hover:bg-sand/75"
            onClick={(event) => {
              event.stopPropagation();
              setIsExpanded((currentState) => !currentState);
            }}
            type="button"
          >
            <Plus className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-45' : 'rotate-0'}`} />
          </button>
          <EditableImageThumbnail
            alt={`${country.name} hero`}
            className="h-20 w-24 shrink-0"
            imageUrl={country.hero_image_url}
            onClick={(event) => {
              event.stopPropagation();
              onEditCountryImage(country);
            }}
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold capitalize text-ink">{country.name}</p>
            <p className="mt-1 text-sm text-ink/60">{country.code}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={country.status} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Destinations</p>
          <p className="mt-3 text-2xl font-semibold text-ink">{country.destination_count}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Published</p>
          <p className="mt-3 text-2xl font-semibold text-ink">{country.published_destination_count}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Last enriched</p>
          <p className="mt-3 text-sm font-semibold text-ink">{formatDate(country.last_enriched_at)}</p>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
          <a
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-ink/10 transition hover:bg-white/80"
            href={`/countries/${country.slug}`}
            onClick={(event) => event.stopPropagation()}
            rel="noreferrer"
            target="_blank"
          >
            View
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button
            className="min-w-[8.5rem]"
            disabled={isRegenerating}
            onClick={(event) => {
              event.stopPropagation();
              onRegenerate();
            }}
            size="sm"
            variant="secondary"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Running...' : 'Re-generate'}
          </Button>
          <Button
            className="min-w-[6.5rem] bg-coral hover:bg-coral/90"
            disabled={isDeleting}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            size="sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="border-t border-ink/8 bg-sand/18 px-5 py-5 sm:px-6">
          <DestinationList
            countryName={country.name}
            destinations={destinations}
            onDeleteDestination={onDeleteDestination}
            onEditImage={onEditDestinationImage}
            onRegenerateDestination={onRegenerateDestination}
          />
        </div>
      </div>
    </article>
  );
}
