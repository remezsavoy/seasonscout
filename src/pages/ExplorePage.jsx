import { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { useSearchParams } from 'react-router-dom';
import { DestinationCard } from '../components/ui/DestinationCard';
import { EmptyState } from '../components/ui/EmptyState';
import { PageContainer } from '../components/ui/PageContainer';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { StatusPanel } from '../components/ui/StatusPanel';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { searchService } from '../services/searchService';
import { destinationsService } from '../services/destinationsService';

const COLLECTION_CONTENT = {
  'tropical-beach': {
    title: 'Tropical Beaches',
    description: 'Trade busy routines for warm water, long coastlines, and easy beach days with reliable sunshine.',
  },
  'city-break': {
    title: 'City Breaks',
    description: 'Plan a short, high-reward escape around walkable neighborhoods, standout food, and strong city energy.',
  },
  'winter-sun': {
    title: 'Warm Winter Sun',
    description: 'Escape the frost in these sun-drenched getaways built for bright days and easy winter warmth.',
  },
  'mild-summer': {
    title: 'Mild Summer Escapes',
    description: 'Skip the punishing heat and find summer destinations that stay comfortable for long days out.',
  },
  'year-round': {
    title: 'Year-Round Destinations',
    description: 'These places stay consistently appealing across the calendar, with flexible timing and broad travel appeal.',
  },
  'culture-history': {
    title: 'Culture & History',
    description: 'Choose destinations where historic layers, local identity, and cultural landmarks shape the trip.',
  },
  'food-capital': {
    title: 'Food Capitals',
    description: 'Follow the table to places known for memorable dining, local specialties, and strong street-to-fine-dining range.',
  },
  'nature-wildlife': {
    title: 'Nature & Wildlife',
    description: 'Find landscapes, outdoor drama, and wildlife-rich travel moments worth building a whole itinerary around.',
  },
  'winter-sports': {
    title: 'Winter Sports',
    description: 'Compare cold-season destinations suited to snow-focused trips, mountain time, and active winter travel.',
  },
  'backpacking-budget': {
    title: 'Backpacking & Budget',
    description: 'Stretch your travel budget further with destinations that reward flexibility, curiosity, and longer stays.',
  },
  'romantic-getaway': {
    title: 'Romantic Getaways',
    description: 'Browse destinations that naturally lend themselves to slower pacing, atmospheric stays, and shared highlights.',
  },
  'family-friendly': {
    title: 'Family-Friendly',
    description: 'These picks balance practical travel ease with enough variety to keep different ages engaged.',
  },
  'adventure-active': {
    title: 'Adventure & Active',
    description: 'Choose destinations that reward movement, outdoor challenge, and travelers who want more than passive sightseeing.',
  },
  'wellness-retreat': {
    title: 'Wellness Retreats',
    description: 'Slow down with destinations suited to restorative routines, calmer pacing, and space to reset.',
  },
};

const collectionSlugs = Object.keys(COLLECTION_CONTENT);

function parseActiveCollections(value) {
  if (!value) {
    return [];
  }

  return [...new Set(
    value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => collectionSlugs.includes(part)),
  )];
}

function buildCollectionParam(activeCollections) {
  if (activeCollections.length === 0) {
    return '';
  }

  return collectionSlugs.filter((slug) => activeCollections.includes(slug)).join(',');
}

function ExploreResultsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-soft">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="mt-4 h-7 w-40" />
          <SkeletonBlock className="mt-3 h-4 w-full" />
          <SkeletonBlock className="mt-2 h-4 w-5/6" />
          <div className="mt-6 flex flex-wrap gap-2">
            <SkeletonBlock className="h-8 w-20 rounded-full" />
            <SkeletonBlock className="h-8 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const collection = searchParams.get('collection') ?? '';
  const activeCollections = parseActiveCollections(collection);
  const activeContent = activeCollections.length === 1
    ? COLLECTION_CONTENT[activeCollections[0]]
    : activeCollections.length > 1
      ? {
        title: 'Filtered Destinations',
        description: 'Layer multiple categories together to find destinations that fit more than one travel mood.',
      }
      : {
        title: 'All Destinations',
        description: 'Browse the full published catalog and jump into the categories that fit your trip style.',
      };

  useEffect(() => {
    if (!collection) {
      return;
    }

    const normalizedCollection = buildCollectionParam(activeCollections);

    if (collection === normalizedCollection) {
      return;
    }

    if (!normalizedCollection) {
      setSearchParams({}, { replace: true });
      return;
    }

    setSearchParams({ collection: normalizedCollection }, { replace: true });
  }, [activeCollections, collection, setSearchParams]);

  const { data: results, error, isLoading } = useAsyncResource(
    () => (activeCollections.length > 0 ? searchService.getPlacesByCollection(activeCollections) : destinationsService.getAllDestinations()),
    [activeCollections.join(',')]
  );

  return (
    <PageContainer className="space-y-12 py-10">
      <section className="space-y-8">
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-3">
          {collectionSlugs.map((slug) => {
            const isActive = activeCollections.includes(slug);

            return (
              <button
                key={slug}
                className={[
                  'rounded-full px-3.5 py-2 text-sm font-semibold transition duration-200',
                  'transform-gpu hover:-translate-y-0.5',
                  isActive
                    ? 'bg-ink text-white shadow-[0_14px_28px_-18px_rgba(16,32,51,0.8)]'
                    : 'border border-ink/10 bg-white/82 text-ink/68 hover:border-lagoon/20 hover:bg-sand/45 hover:text-ink dark:border-slate-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/[0.08] dark:hover:text-slate-100',
                ].join(' ')}
                onClick={() => {
                  const nextCollections = isActive
                    ? activeCollections.filter((value) => value !== slug)
                    : [...activeCollections, slug];
                  const nextParam = buildCollectionParam(nextCollections);

                  setSearchParams(nextParam ? { collection: nextParam } : {});
                }}
                type="button"
              >
                {COLLECTION_CONTENT[slug].title}
              </button>
            );
          })}
        </div>

        <div className="max-w-3xl">
          <h1 className="font-display text-5xl text-ink dark:text-slate-100 sm:text-6xl">{activeContent.title}</h1>
          <p className="mt-6 text-lg leading-8 text-ink/72 dark:text-slate-300/85">{activeContent.description}</p>
        </div>
      </section>

      {isLoading ? <ExploreResultsSkeleton /> : null}

      {error ? (
        <StatusPanel
          title="Discovery unavailable"
          description={error.message || 'We could not load destinations for this collection right now.'}
          tone="error"
        />
      ) : null}

      {!isLoading && !error && results?.length === 0 ? (
        <section className="flex min-h-[22rem] items-center justify-center py-10">
          <div className="w-full rounded-[2rem] bg-sand/40 px-6 py-16 text-center dark:border dark:border-slate-800 dark:bg-white/[0.04] sm:px-10">
            <h2 className="font-display text-3xl text-ink dark:text-slate-100">Want to see more?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink/70 dark:text-slate-300/85">
              No destinations match this specific combination of filters. Try removing one or exploring all.
            </p>
            <div className="mt-8">
              <Button onClick={() => setSearchParams({})} size="md">
                View All Destinations
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {!isLoading && !error && results?.length > 0 ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/60 dark:text-slate-100">
              {results.length} {results.length === 1 ? 'result' : 'results'} in this collection
            </p>
            <p className="text-sm text-ink/50 dark:text-slate-400">Countries and destinations are mixed below.</p>
          </div>
          <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <DestinationCard key={result.key} destination={result} />
          ))}
          </div>
        </div>
      ) : null}

      {!isLoading && !error && results?.length > 0 ? (
        <div className="mt-16 rounded-[2rem] bg-sand/40 p-10 text-center dark:border dark:border-slate-800 dark:bg-white/[0.04]">
          <h2 className="font-display text-3xl text-ink dark:text-slate-100">Want to see more?</h2>
          <p className="mt-4 text-ink/70 dark:text-slate-300/85">
            Switch categories above to compare very different travel moods without leaving the page.
          </p>
        </div>
      ) : null}
    </PageContainer>
  );
}
