import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDestinationSearch } from '../../hooks/useDestinationSearch';
import { SearchResultCard } from '../search/SearchResultCard';
import { Button, buttonVariants } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { PageContainer } from '../ui/PageContainer';
import { SkeletonBlock } from '../ui/SkeletonBlock';
import { StatusPanel } from '../ui/StatusPanel';

function SearchResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-soft">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="mt-4 h-7 w-32" />
          <SkeletonBlock className="mt-3 h-4 w-full" />
          <SkeletonBlock className="mt-2 h-4 w-4/5" />
          <div className="mt-5 flex flex-wrap gap-2">
            <SkeletonBlock className="h-8 w-20 rounded-full" />
            <SkeletonBlock className="h-8 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchResultsList({ results }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {results.map((result) => <SearchResultCard key={result.key} result={result} />)}
    </div>
  );
}

export function DestinationSearchSection({ suggestions = [] }) {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const { results, error, isLoading, hasSearched, isShortQuery } = useDestinationSearch(activeQuery);
  const trimmedQuery = query.trim();
  const fallbackDestination = suggestions[0] ?? null;
  const showPrompt = !hasSearched && !trimmedQuery;

  function handleSubmit(event) {
    event.preventDefault();
    setActiveQuery(trimmedQuery);
  }

  function handleSuggestionSelect(destinationName) {
    setQuery(destinationName);
    setActiveQuery(destinationName);
  }

  function handleClearSearch() {
    setQuery('');
    setActiveQuery('');
  }

  return (
    <PageContainer>
      <section className="rounded-[2rem] border border-ink/10 bg-white/80 p-6 shadow-soft sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.85fr,1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lagoon">Search the catalog</p>
            <h2 className="mt-4 font-display text-4xl text-ink sm:text-5xl">
              Search cities and countries, then move into curated travel guidance.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-ink/72">
              Search stays routed through the service layer so mixed city and country results can evolve into prepared
              backend reads later without rewriting the home page.
            </p>

            {suggestions.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {suggestions.map((destination) => (
                  <button
                    key={destination.slug}
                    className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                    onClick={() => handleSuggestionSelect(destination.name)}
                    type="button"
                  >
                    {destination.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.75rem] bg-sand/70 p-5 sm:p-6">
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="destination-search">
                Search for a city or country
              </label>
              <input
                id="destination-search"
                className="w-full rounded-full border border-ink/10 bg-white px-5 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink/40 focus:border-lagoon/30 focus:ring-2 focus:ring-lagoon/15"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Kyoto, Japan, Cape Town, Iceland..."
                type="search"
                value={query}
              />
              <Button className="sm:min-w-[8rem]" size="md" type="submit">
                Search
              </Button>
            </form>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink/60">
              <span>Search by city or country to open a destination profile or a country guide.</span>
              {activeQuery ? (
                <button
                  className="font-semibold text-lagoon transition hover:text-lagoon/80"
                  onClick={handleClearSearch}
                  type="button"
                >
                  Clear search
                </button>
              ) : null}
            </div>

            <div className="mt-6" aria-live="polite">
              {showPrompt ? (
                <StatusPanel
                  className="bg-white/70"
                  title="Search for a city or country"
                  description="Try a featured city or type a country name to load curated destination profiles and country guide foundations."
                />
              ) : null}

              {isShortQuery ? (
                <StatusPanel
                  className="bg-white/70"
                  title="Add a little more detail"
                  description="Use at least two characters so the backend-ready search layer can return useful matches."
                />
              ) : null}

              {isLoading ? <SearchResultsSkeleton /> : null}

              {error ? (
                <StatusPanel
                  title="Search is unavailable"
                  description={error.message || 'Destination search failed. Try again in a moment.'}
                  tone="error"
                />
              ) : null}

              {!isLoading && !error && hasSearched && !isShortQuery && results.length === 0 ? (
                <EmptyState
                  title="No matching places yet"
                  description="The search layer is wired for both destinations and countries, but the current curated dataset does not include a match for that query."
                  action={
                    fallbackDestination ? (
                      <Link
                        className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                        to={`/destinations/${fallbackDestination.slug}`}
                      >
                        Explore {fallbackDestination.name}
                      </Link>
                    ) : null
                  }
                />
              ) : null}

              {!isLoading && !error && results.length > 0 ? <SearchResultsList results={results} /> : null}
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
