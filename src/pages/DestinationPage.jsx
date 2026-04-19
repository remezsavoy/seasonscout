import { Link, useParams } from 'react-router-dom';
import { DestinationBestMonthsSection } from '../components/destination/DestinationBestMonthsSection';
import { DestinationHero } from '../components/destination/DestinationHero';
import { DestinationPageSkeleton } from '../components/destination/DestinationPageSkeleton';
import { DestinationWeatherSection } from '../components/destination/DestinationWeatherSection';
import { FavoriteHeartButton } from '../components/favorites/FavoriteHeartButton';
import { ReviewFormSection } from '../components/reviews/ReviewFormSection';
import { TravelerInsightsSection } from '../components/reviews/TravelerInsightsSection';
import { MonthlyClimateTable } from '../components/destination/MonthlyClimateTable';
import { buttonVariants } from '../components/ui/Button';
import { PageContainer } from '../components/ui/PageContainer';
import { SectionHeading } from '../components/ui/SectionHeading';
import { StatusPanel } from '../components/ui/StatusPanel';
import { ToastNotice } from '../components/ui/ToastNotice';
import { useQuery } from '@tanstack/react-query';
import { useFavoriteDestination } from '../hooks/useFavoriteDestination';
import { destinationsService } from '../services/destinationsService';
import { reviewsService } from '../services/reviewsService';
import { useEffect, useState } from 'react';

export function DestinationPage() {
  const { slug = '' } = useParams();
  const { data, error, isLoading } = useQuery({
    queryKey: ['destination', slug],
    queryFn: () => destinationsService.getDestinationPageData(slug),
  });
  const favorite = useFavoriteDestination(data?.id);
  const [toastMessage, setToastMessage] = useState('');
  const [activeLandmarkName, setActiveLandmarkName] = useState('');

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage('');
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastMessage]);

  useEffect(() => {
    const firstLandmarkName = data?.topLandmarks?.[0]?.name ?? '';

    setActiveLandmarkName((currentValue) => {
      if (!firstLandmarkName) {
        return '';
      }

      const hasCurrentLandmark = data.topLandmarks.some((item) => item.name === currentValue);
      return hasCurrentLandmark ? currentValue : firstLandmarkName;
    });
  }, [data?.topLandmarks]);

  function handleRequireAuth() {
    setToastMessage('Please log in to save destinations to your favorites.');
  }

  async function handleToggleFavorite() {
    try {
      await favorite.toggleFavorite();
    } catch (toggleError) {
      setToastMessage(toggleError.message || 'Unable to update favorites right now.');
    }
  }

  function handleLandmarkToggle(landmarkName) {
    setActiveLandmarkName((currentValue) => (currentValue === landmarkName ? '' : landmarkName));
  }

  if (isLoading) {
    return <DestinationPageSkeleton />;
  }

  if (error || !data) {
    return (
      <PageContainer>
        <StatusPanel
          title="Destination details unavailable"
          description="We couldn't load this destination right now."
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

  const activeLandmark = data.topLandmarks?.find((item) => item.name === activeLandmarkName) ?? null;

  return (
    <PageContainer className="space-y-10">
      <DestinationHero
        destination={data}
        topRightAction={
          <FavoriteHeartButton
            isAuthLoading={favorite.isAuthLoading}
            isFavorited={favorite.isFavorited}
            isLoading={favorite.isLoading}
            isSaving={favorite.isSaving}
            onRequireAuth={handleRequireAuth}
            onToggle={favorite.isSignedIn ? handleToggleFavorite : null}
          />
        }
      />

      <DestinationWeatherSection
        currentWeather={data.currentWeather}
        forecast={data.forecast}
        note={data.weatherNote}
        provider={data.weatherProvider}
      />

      <div className="grid items-stretch gap-8 xl:grid-cols-[1.05fr,0.95fr]">
        <DestinationBestMonthsSection
          bestMonths={data.bestMonths}
          bestMonthsLabel={data.bestMonthsLabel}
          peakSeason={data.peakSeason}
          description={data.bestMonthsDescription}
          climateHighlights={data.climateHighlights}
        />

        <section className="flex h-full flex-col space-y-8">
          <SectionHeading
            eyebrow="Destination overview"
            title="How this trip tends to play out"
          />

          <article className="h-full rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
            <div className="flex h-full flex-col gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">What to expect</p>
                <p className="mt-5 text-base leading-8 text-ink/75">{data.seasonalInsight}</p>
              </div>

              <div className="h-px bg-ink/8" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Don't miss</p>

                {data.topLandmarks?.length ? (
                  <>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {data.topLandmarks.map((item) => {
                        const isActive = item.name === activeLandmark?.name;

                        return (
                          <li key={item.name}>
                            <button
                              aria-pressed={isActive}
                              className={[
                                'group w-full rounded-full border px-4 py-3 text-left text-sm font-semibold transition-all duration-300 ease-out',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lagoon/35 focus-visible:ring-offset-2',
                                isActive
                                  ? 'border-lagoon/70 bg-lagoon text-white shadow-[0_18px_34px_-24px_rgba(22,112,110,0.9)]'
                                  : 'border-ink/10 bg-white/72 text-ink/82 hover:border-lagoon/30 hover:bg-sand/55 hover:text-ink',
                              ].join(' ')}
                              onClick={() => handleLandmarkToggle(item.name)}
                              type="button"
                            >
                              <span className="flex items-center justify-between gap-3">
                                <span>{item.name}</span>
                                <span
                                  className={[
                                    'h-2.5 w-2.5 rounded-full transition-colors duration-300',
                                    isActive ? 'bg-white/90' : 'bg-lagoon/35 group-hover:bg-lagoon/55',
                                  ].join(' ')}
                                />
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    <div
                      className={[
                        'mt-4 overflow-hidden rounded-[1.5rem] border bg-white/78 px-5 py-4 shadow-[0_20px_40px_-32px_rgba(16,32,51,0.35)] transition-all duration-300 ease-out',
                        activeLandmark
                          ? 'max-h-48 border-lagoon/18 opacity-100 translate-y-0'
                          : 'max-h-0 border-transparent px-5 py-0 opacity-0 -translate-y-2 shadow-none',
                      ].join(' ')}
                    >
                      {activeLandmark ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon/80">
                            {activeLandmark.name}
                          </p>
                          <p className="text-sm leading-7 text-ink/72">{activeLandmark.description}</p>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-ink/60">
                    Top landmarks are being curated for this destination.
                  </p>
                )}
              </div>
            </div>
          </article>
        </section>
      </div>

      <MonthlyClimateTable climateSource={data.climateSource} rows={data.monthlyClimate} />
      <TravelerInsightsSection entityLabel={data.name} reviews={data.reviews ?? []} />
      <ReviewFormSection
        entityLabel={data.name}
        monthOptions={reviewsService.monthOptions}
        onSubmit={(review) => reviewsService.submitDestinationReview({
          ...review,
          destinationId: data.id,
        })}
      />
      <ToastNotice message={toastMessage} />
    </PageContainer>
  );
}
