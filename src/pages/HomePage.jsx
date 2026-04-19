import { ArrowRight, Building2, Map, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DestinationSearchSection } from '../components/home/DestinationSearchSection';
import { HomeHeroImageMeta, HomeHeroMediaPanel } from '../components/home/HomeHeroMediaPanel';
import { buttonVariants } from '../components/ui/Button';
import { DestinationCard } from '../components/ui/DestinationCard';
import { EmptyState } from '../components/ui/EmptyState';
import { PageContainer } from '../components/ui/PageContainer';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { SectionHeading } from '../components/ui/SectionHeading';
import { StatusPanel } from '../components/ui/StatusPanel';
import {
  sharedHeroImageBaseClassName,
  sharedHeroImageContainerClassName,
  sharedHeroImageFallbackClassName,
  sharedHeroImageOverlayClassName,
} from '../components/ui/heroImageStyles';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../lib/cn';
import { destinationsService } from '../services/destinationsService';
import { homeHeroContentFallback } from '../services/mockData';

function FeaturedDestinationsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="glass-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <SkeletonBlock className="h-8 w-28 rounded-full" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
          <SkeletonBlock className="mt-6 h-10 w-36" />
          <SkeletonBlock className="mt-4 h-4 w-full" />
          <SkeletonBlock className="mt-2 h-4 w-5/6" />
          <div className="mt-6 grid gap-4 rounded-[1.5rem] bg-ink/5 p-4 sm:grid-cols-2">
            <SkeletonBlock className="h-14 w-full" />
            <SkeletonBlock className="h-14 w-full" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <SkeletonBlock className="h-8 w-20 rounded-full" />
            <SkeletonBlock className="h-8 w-16 rounded-full" />
            <SkeletonBlock className="h-8 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SeasonalCollectionsSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="mt-5 h-7 w-40" />
          <SkeletonBlock className="mt-4 h-4 w-full" />
          <SkeletonBlock className="mt-2 h-4 w-11/12" />
          <SkeletonBlock className="mt-2 h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: destinationsService.getHomePageData,
    staleTime: 2 * 60 * 1000,
  });
  const featuredDestinations = data?.featuredDestinations ?? [];
  const homeHeroContent = data?.homeHeroContent ?? homeHeroContentFallback;
  const seasonalCollections = data?.seasonalCollections ?? [];
  const sampleDestinationSlug = featuredDestinations[0]?.slug ?? 'kyoto';
  const optimizedHeroUrl = homeHeroContent?.heroImageUrl
    ? homeHeroContent.heroImageUrl.replace(/w=\d+/, 'w=1600').replace(/q=\d+/, 'q=80')
    : null;
  const heroBackgroundStyle = optimizedHeroUrl
    ? { backgroundImage: `url(${optimizedHeroUrl})` }
    : undefined;

  return (
    <div className="space-y-20">
      <PageContainer>
        <div className="space-y-2">
          <section className={sharedHeroImageContainerClassName}>
            <div
              className={cn(
                sharedHeroImageBaseClassName,
                homeHeroContent?.heroImageUrl ? null : sharedHeroImageFallbackClassName,
              )}
              style={heroBackgroundStyle}
            />
            <div className={sharedHeroImageOverlayClassName} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/16 via-transparent to-white/6" />

            <div className="relative grid gap-10 px-6 py-6 text-white sm:px-8 sm:py-10 lg:grid-cols-[1.08fr,0.92fr] lg:px-12 lg:py-14">
              <div className="max-w-3xl self-center lg:self-end">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white drop-shadow-sm">
                  Travel climate planner
                </p>
                <h1 className="mt-5 max-w-3xl font-display text-3xl leading-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
                  Find the right destination and the right season in one flow.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-white/90 drop-shadow-sm sm:leading-8">
                  Stop guessing about the weather. SeasonScout combines climate averages with live forecasts so you can
                  confidently plan your next adventure at the perfect time.
                </p>
                <div className="mt-8 flex items-center">
                  <Link
                    className={buttonVariants({ variant: 'primary', size: 'lg' })}
                    to={`/destinations/${sampleDestinationSlug}`}
                  >
                    Explore a destination
                  </Link>
                </div>
              </div>

              <div className="hidden gap-4 self-end sm:grid-cols-2 lg:grid lg:pl-4">
                <div className="sm:col-span-2">
                  <HomeHeroMediaPanel />
                </div>

                <article className="rounded-[1.75rem] border border-white/35 bg-white/78 p-5 shadow-soft backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-white">Climate insights</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Year-round averages</p>
                  <p className="mt-3 text-sm leading-7 text-white">
                    Access detailed monthly climate data to find the ideal weather window for your specific travel
                    style.
                  </p>
                </article>

                <article className="rounded-[1.75rem] border border-white/35 bg-white/78 p-5 shadow-soft backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-white">Live forecasts</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Real-time weather</p>
                  <p className="mt-3 text-sm leading-7 text-white">
                    Check current conditions and short-term forecasts to know exactly what to pack before you fly.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <HomeHeroImageMeta heroContent={homeHeroContent} />
        </div>
      </PageContainer>

      <DestinationSearchSection suggestions={featuredDestinations.slice(0, 3)} />

      <PageContainer className="space-y-8">
        <SectionHeading
          eyebrow="Featured destinations"
          title="Start with destinations that already have a strong climate story"
          description="Explore hand-picked destinations with ideal weather conditions and rich cultural stories for your next adventure."
        />

        {isLoading ? <FeaturedDestinationsSkeleton /> : null}

        {error ? (
          <StatusPanel
            title="Featured destinations unavailable"
            description="The home page stays thin even when reads fail because service-level errors are handled before the UI decides what to render."
            tone="error"
          />
        ) : null}

        {!isLoading && !error && featuredDestinations.length === 0 ? (
          <EmptyState
            title="Featured destinations will appear here"
            description="Once published destinations are available, this section should surface a curated entry point into the product."
          />
        ) : null}

        {!error && featuredDestinations.length > 0 ? (
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {featuredDestinations.map((destination) => (
              <DestinationCard
                key={destination.slug}
                destination={destination}
                photoUrl={destination.heroImageSourceUrl}
              />
            ))}
          </div>
        ) : null}
      </PageContainer>

      <PageContainer className="space-y-8">
        <SectionHeading
          eyebrow="Seasonal inspiration"
          title="Browse trip ideas shaped by stored climate patterns"
          description="Not sure where to go? Explore destinations perfectly matched to your preferred weather and travel style."
        />

        {isLoading ? <SeasonalCollectionsSkeleton /> : null}

        {error ? (
          <StatusPanel
            title="Seasonal inspiration unavailable"
            description="Curated collections should fail softly and leave the rest of the home page usable."
            tone="error"
          />
        ) : null}

        {!isLoading && !error && seasonalCollections.length === 0 ? (
          <EmptyState
            title="Seasonal collections are not ready yet"
            description="This space is reserved for backend-driven browse flows such as warm winter sun, low-rainfall city breaks, and mild summer escapes."
          />
        ) : null}

        {!error && seasonalCollections.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {seasonalCollections.map((collection, index) => {
              const Icon = [Building2, Sun, Map][index % 3];
              return (
                <Link
                  key={collection.title}
                  to={`/explore?collection=${collection.collection || ''}`}
                  className="group relative flex flex-col rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft transition-all hover:border-lagoon/20 hover:bg-white dark:border-slate-800 dark:bg-white/[0.04] dark:shadow-none dark:hover:bg-white/[0.06]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-lagoon/5 text-lagoon dark:bg-white/5 dark:text-slate-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon dark:text-slate-300">Curated direction</p>
                  <h3 className="mt-3 flex items-center gap-2 text-xl font-semibold text-ink dark:text-slate-100">
                    {collection.title}
                    <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-ink/70 dark:text-slate-300/85">{collection.description}</p>
                </Link>
              );
            })}
          </div>
        ) : null}
      </PageContainer>
    </div>
  );
}
