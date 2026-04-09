import { Link, useParams } from 'react-router-dom';
import { DestinationBestMonthsSection } from '../components/destination/DestinationBestMonthsSection';
import { DestinationHero } from '../components/destination/DestinationHero';
import { DestinationPageSkeleton } from '../components/destination/DestinationPageSkeleton';
import { DestinationWeatherSection } from '../components/destination/DestinationWeatherSection';
import { FavoriteToggleButton } from '../components/favorites/FavoriteToggleButton';
import { MonthlyClimateTable } from '../components/destination/MonthlyClimateTable';
import { buttonVariants } from '../components/ui/Button';
import { PageContainer } from '../components/ui/PageContainer';
import { SectionHeading } from '../components/ui/SectionHeading';
import { StatusPanel } from '../components/ui/StatusPanel';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useFavoriteDestination } from '../hooks/useFavoriteDestination';
import { destinationsService } from '../services/destinationsService';

export function DestinationPage() {
  const { slug = '' } = useParams();
  const { data, error, isLoading } = useAsyncResource(
    () => destinationsService.getDestinationPageData(slug),
    [slug],
  );
  const favorite = useFavoriteDestination(data?.id);

  const favoriteMessage = favorite.error?.message
    ? favorite.error.message
    : favorite.isAuthLoading
      ? 'Checking whether the current session can save favorites.'
      : favorite.isLoading
        ? 'Checking whether this destination is already saved.'
        : favorite.isSignedIn && favorite.isFavorited
          ? 'This destination is already saved in your favorites.'
          : favorite.isSignedIn
            ? 'Save this destination without duplicating existing favorites.'
            : 'Sign in to save this destination to your favorites.';

  if (isLoading) {
    return <DestinationPageSkeleton />;
  }

  if (error || !data) {
    return (
      <PageContainer>
        <StatusPanel
          title="Destination details unavailable"
          description="The route expects one prepared destination payload from the service layer. Loading failures should degrade gracefully without breaking navigation."
          tone="error"
          action={
            <Link className={buttonVariants({ variant: 'primary', size: 'sm' })} to="/">
              Return home
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-10">
      <DestinationHero
        destination={data}
        action={
          <FavoriteToggleButton
            isAuthLoading={favorite.isAuthLoading}
            isSignedIn={favorite.isSignedIn}
            isFavorited={favorite.isFavorited}
            isLoading={favorite.isLoading}
            isSaving={favorite.isSaving}
            onSave={favorite.saveFavorite}
          />
        }
        actionMessage={favoriteMessage}
      />

      <DestinationWeatherSection
        currentWeather={data.currentWeather}
        forecast={data.forecast}
        note={data.weatherNote}
        provider={data.weatherProvider}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <DestinationBestMonthsSection
          bestMonths={data.bestMonths}
          bestMonthsLabel={data.bestMonthsLabel}
          description={data.bestMonthsDescription}
          climateHighlights={data.climateHighlights}
        />

        <section className="space-y-8">
          <SectionHeading
            eyebrow="Seasonal insight"
            title="What shapes the trip quality across the year"
            description="This narrative stays backend-driven as the dataset matures, so the page can render prepared guidance instead of recomputing climate rules."
          />

          <article className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Travel insight</p>
            <p className="mt-5 text-base leading-8 text-ink/75">{data.seasonalInsight}</p>

            <div className="mt-6 rounded-[1.25rem] bg-sand/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/50">Destination summary</p>
              <p className="mt-3 text-sm leading-7 text-ink/72">{data.headline}</p>
            </div>
          </article>
        </section>
      </div>

      <MonthlyClimateTable climateSource={data.climateSource} rows={data.monthlyClimate} />
    </PageContainer>
  );
}
