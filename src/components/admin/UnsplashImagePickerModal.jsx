import { LoaderCircle, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';

export function UnsplashImagePickerModal({
  isOpen,
  target,
  isSaving,
  onClose,
  onSearch,
  onSelect,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const defaultQuery = target ? target.defaultQuery?.trim() || target.name : '';

  useEffect(() => {
    if (!isOpen || !target) {
      setQuery('');
      setResults([]);
      setSearchError('');
      setIsSearching(false);
      return;
    }

    setQuery(defaultQuery);
    setSearchError('');
    setResults([]);

    let isActive = true;

    async function loadDefaultResults() {
      setIsSearching(true);

      try {
        const nextResults = await onSearch(defaultQuery);

        if (!isActive) {
          return;
        }

        setResults(nextResults);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setSearchError(error.message || 'Unable to search Unsplash right now.');
      } finally {
        if (isActive) {
          setIsSearching(false);
        }
      }
    }

    loadDefaultResults();

    return () => {
      isActive = false;
    };
  }, [defaultQuery, isOpen, target]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !target) {
    return null;
  }

  async function handleSearch(event) {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setSearchError('Search term is required.');
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const nextResults = await onSearch(normalizedQuery);
      setResults(nextResults);
    } catch (error) {
      setSearchError(error.message || 'Unable to search Unsplash right now.');
    } finally {
      setIsSearching(false);
    }
  }

  return createPortal((
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/45 px-5 py-8 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-soft">
        <div className="sticky top-0 z-10 border-b border-ink/8 bg-white/95 px-6 py-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Unsplash picker</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">Choose a new hero image for {target.name}</h3>
              <p className="mt-2 text-sm leading-7 text-ink/68">
                Search Unsplash, then apply one image directly to this {target.type === 'country' ? 'country' : 'destination'}.
              </p>
            </div>
            <Button onClick={onClose} variant="ghost">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>

          <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
              <input
                className="w-full rounded-full border border-ink/10 bg-white px-11 py-3 text-sm text-ink outline-none transition focus:border-lagoon/40 focus:ring-2 focus:ring-lagoon/15"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Unsplash"
                type="search"
                value={query}
              />
            </label>
            <Button className="min-w-[8.5rem]" disabled={isSearching || isSaving} type="submit">
              {isSearching ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </form>

          {searchError ? <p className="mt-4 text-sm text-coral">{searchError}</p> : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {isSearching ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.5rem] border border-ink/8 bg-sand/25">
                  <div className="aspect-[4/3] animate-pulse bg-ink/10" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-32 animate-pulse rounded-full bg-ink/10" />
                    <div className="h-4 w-24 animate-pulse rounded-full bg-ink/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isSearching && results.length === 0 ? (
            <div className="flex min-h-[18rem] items-center justify-center rounded-[1.5rem] border border-dashed border-ink/12 bg-sand/18 px-6 text-center text-sm leading-7 text-ink/62">
              No Unsplash images matched this query. Try a broader place name or a more descriptive travel scene.
            </div>
          ) : null}

          {!isSearching && results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((photo) => (
                <button
                  key={photo.id}
                  className="overflow-hidden rounded-[1.5rem] border border-ink/8 bg-sand/25 text-left transition duration-200 hover:-translate-y-0.5 hover:border-lagoon/20 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lagoon/30 disabled:pointer-events-none disabled:opacity-60"
                  disabled={isSaving}
                  onClick={() => onSelect(photo)}
                  type="button"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-ink/8">
                    <img alt={photo.alt || `${target.name} result`} className="h-full w-full object-cover" src={photo.previewUrl} />
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="line-clamp-2 text-sm font-semibold text-ink">
                      {photo.alt || photo.description || `${target.name} hero image`}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink/45">
                      Photo by {photo.photographerName || 'Unknown photographer'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  ), document.body);
}
