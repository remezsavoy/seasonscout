import { LoaderCircle, RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';

export function RegenerateCountryModal({
  country,
  isOpen,
  loadingOption,
  onClose,
  onSelect,
}) {
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

  if (!isOpen || !country) {
    return null;
  }

  return createPortal((
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/35 px-5 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Re-generate country</p>
        <h3 className="mt-3 text-2xl font-semibold text-ink">Re-generate {country.name}?</h3>
        <p className="mt-4 text-sm leading-7 text-ink/68">
          Choose whether to refresh only the country-level editorial and hero image, or rerun the full country and
          destination pipeline.
        </p>

        <div className="mt-6 grid gap-3">
          <Button
            className="justify-start rounded-[1.4rem] px-5 py-4 text-left"
            disabled={Boolean(loadingOption)}
            onClick={() => onSelect('country-only')}
            variant="secondary"
          >
            {loadingOption === 'country-only' ? (
              <LoaderCircle className="mr-3 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-3 h-4 w-4" />
            )}
            Country Only
          </Button>
          <Button
            className="justify-start rounded-[1.4rem] px-5 py-4 text-left"
            disabled={Boolean(loadingOption)}
            onClick={() => onSelect('country-and-destinations')}
          >
            {loadingOption === 'country-and-destinations' ? (
              <LoaderCircle className="mr-3 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-3 h-4 w-4" />
            )}
            Country & Destinations
          </Button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button disabled={Boolean(loadingOption)} onClick={onClose} variant="ghost">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  ), document.body);
}
