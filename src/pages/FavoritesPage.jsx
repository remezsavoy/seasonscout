import { Link } from 'react-router-dom';
import { FavoriteHeartButton } from '../components/favorites/FavoriteHeartButton';
import { FavoritesGridSkeleton } from '../components/favorites/FavoritesGridSkeleton';
import { buttonVariants } from '../components/ui/Button';
import { DestinationCard } from '../components/ui/DestinationCard';
import { EmptyState } from '../components/ui/EmptyState';
import { PageContainer } from '../components/ui/PageContainer';
import { StatusPanel } from '../components/ui/StatusPanel';
import { useFavoritesList } from '../hooks/useFavoritesList';

export function FavoritesPage() {
  const {
    session,
    isAuthLoading,
    authError,
    favorites,
    favoritesError,
    actionError,
    isFavoritesLoading,
    removeFavorite,
    isRemovingFavorite,
  } = useFavoritesList();
  const favoriteCountLabel = `${favorites.length} ${favorites.length === 1 ? 'destination' : 'destinations'}`;

  return (
    <PageContainer className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lagoon">Favorites</p>
          <h1 className="mt-4 font-display text-5xl text-ink sm:text-6xl">
            Keep the destinations worth revisiting in one place.
          </h1>
          <p className="mt-5 text-base leading-8 text-ink/72">
            Saved destinations stay attached to the active auth session and load through the prepared favorites service.
          </p>
        </div>

        {session ? (
          <div className="rounded-[1.5rem] border border-ink/10 bg-white/75 px-5 py-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/48">Saved now</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{favoriteCountLabel}</p>
          </div>
        ) : null}
      </div>

      {isAuthLoading ? (
        <StatusPanel
          title="Restoring session"
          description="Checking whether a signed-in user is available before loading favorites."
        />
      ) : null}

      {authError ? (
        <StatusPanel
          title="Auth session unavailable"
          description={authError.message || 'The current auth session could not be restored.'}
          tone="error"
        />
      ) : null}

      {!isAuthLoading && !session ? (
        <StatusPanel
          title="Sign in required"
          description="Favorites stay protected behind auth, and this route now reacts to the shared auth state listener."
          action={
            <Link className={buttonVariants({ variant: 'primary', size: 'sm' })} to="/auth">
              Go to auth
            </Link>
          }
        />
      ) : null}

      {session && isFavoritesLoading ? (
        <section className="space-y-4">
          <StatusPanel title="Loading favorites" description="Reading saved destinations for the active user." />
          <FavoritesGridSkeleton />
        </section>
      ) : null}

      {session && favoritesError ? (
        <StatusPanel
          title="Favorites unavailable"
          description={favoritesError.message || 'Saved destinations could not be loaded right now.'}
          tone="error"
        />
      ) : null}

      {session && actionError ? (
        <StatusPanel
          title="Favorite action failed"
          description={actionError.message || 'The saved destinations list could not be updated right now.'}
          tone="error"
        />
      ) : null}

      {session && !isFavoritesLoading && !favoritesError && favorites?.length === 0 ? (
        <EmptyState
          title="No saved destinations yet"
          description="Save a destination from its detail page and it will appear here for the active account."
          action={
            <Link className={buttonVariants({ variant: 'primary', size: 'sm' })} to="/">
              Explore destinations
            </Link>
          }
        />
      ) : null}

      {session && !isFavoritesLoading && !favoritesError && favorites.length > 0 ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Saved collection</p>
              <p className="mt-2 text-sm leading-7 text-ink/68">
                Use this shortlist to revisit strong climate windows before booking a trip.
              </p>
            </div>

            <Link className={buttonVariants({ variant: 'ghost', size: 'sm' })} to="/">
              Browse more destinations
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((destination) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                photoUrl={destination.heroImageSourceUrl}
                topRightAction={
                  <FavoriteHeartButton
                    className="rounded-full bg-white/20 p-2 backdrop-blur-md hover:bg-white/30"
                    isAuthLoading={false}
                    isFavorited
                    isLoading={false}
                    isSaving={isRemovingFavorite(destination.id)}
                    onToggle={() => removeFavorite(destination.id)}
                  />
                }
              />
            ))}
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}
