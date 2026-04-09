import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '../ui/Button';

export function FavoriteToggleButton({
  isAuthLoading,
  isSignedIn,
  isFavorited,
  isLoading,
  isSaving,
  onSave,
}) {
  if (isAuthLoading) {
    return (
      <Button disabled size="md" variant="secondary">
        Checking session
      </Button>
    );
  }

  if (!isSignedIn) {
    return (
      <Link className={buttonVariants({ variant: 'secondary', size: 'md' })} to="/auth">
        Sign in to save
      </Link>
    );
  }

  if (isLoading) {
    return (
      <Button disabled size="md" variant="secondary">
        Checking favorite
      </Button>
    );
  }

  if (isFavorited) {
    return (
      <Link className={buttonVariants({ variant: 'secondary', size: 'md' })} to="/favorites">
        Saved to favorites
      </Link>
    );
  }

  return (
    <Button disabled={isSaving} onClick={onSave} size="md">
      {isSaving ? 'Saving favorite' : 'Save to favorites'}
    </Button>
  );
}
