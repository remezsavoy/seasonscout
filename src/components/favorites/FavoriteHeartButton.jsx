import { Heart } from 'lucide-react';
import { cn } from '../../lib/cn';

export function FavoriteHeartButton({
  className,
  isAuthLoading,
  isFavorited,
  isLoading,
  isSaving,
  onToggle,
  onRequireAuth,
}) {
  const isDisabled = isAuthLoading || isLoading || isSaving;

  function handleClick() {
    if (isAuthLoading || isLoading || isSaving) {
      return;
    }

    if (typeof onToggle === 'function') {
      onToggle();
      return;
    }

    if (typeof onRequireAuth === 'function') {
      onRequireAuth();
    }
  }

  return (
    <button
      aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
      className={cn(
        'inline-flex items-center justify-center text-white transition hover:text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-70',
        isFavorited && 'text-coral',
        className,
      )}
      disabled={isDisabled}
      onClick={handleClick}
      type="button"
    >
      <Heart className={cn('h-7 w-7 drop-shadow-[0_4px_14px_rgba(16,32,51,0.45)]', isFavorited && 'fill-current')} />
    </button>
  );
}
