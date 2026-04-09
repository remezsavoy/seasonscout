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
import { useAsyncResource } from '../hooks/useAsyncResource';
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
  const { data, error, isLoading } = useAsyncResource(destinationsService.getHomePageData, []);
  const featuredDestinations = data?.featuredDestinations ?? [];
  const homeHeroContent = data?.homeHeroContent ?? homeHeroContentFallback;
  const seasonalCollections = data?.seasonalCollections ?? [];
  const sampleDestinationSlug = featuredDestinations[0]?.slug ?? 'kyoto';
  const heroBackgroundStyle = homeHeroContent?.heroImageUrl
    ? {
        backgroundImage: `linear-gradient(120deg, rgba(16, 32, 51, 0.74), rgba(16, 32, 51, 0.34)), url(${homeHeroContent.heroImageUrl})`,
      }
    : undefined;

  return (
    <div className="space-y-20">
      <PageContainer>
        <div className="space-y-2">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-ink shadow-soft">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={heroBackgroundStyle}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,201,139,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(133,221,198,0.14),transparent_32%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/36 via-ink/18 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/16 via-transparent to-white/6" />

            <div className="relative px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
              <div className="grid gap-10 lg:grid-cols-[1.08fr,0.92fr] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white drop-shadow-sm">
                    Travel climate planner
                  </p>
                  <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight text-white drop-shadow-sm sm:text-6xl">
                    Find the right destination and the right season in one flow.
                  </h1>
                  <p className="mt-6 max-w-2xl text-base leading-8 text-white/90 drop-shadow-sm">
                    SeasonScout combines live weather, short forecasts, monthly climate averages, and backend-ready
                    best-month guidance so a traveler can move from curiosity to a confident timing decision quickly.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      className={buttonVariants({ variant: 'primary', size: 'lg' })}
                      to={`/destinations/${sampleDestinationSlug}`}
                    >
                      Explore a destination
                    </Link>
                    <Link className={buttonVariants({ variant: 'secondary', size: 'lg' })} to="/auth">
                      Sign in for favorites
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <HomeHeroMediaPanel />
                  </div>

                  <article className="rounded-[1.75rem] border border-white/35 bg-white/78 p-5 shadow-soft backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-white">12-month climate view</p>
                    <p className="mt-3 text-2xl font-semibold text-white">Stored monthly averages</p>
                    <p className="mt-3 text-sm leading-7 text-white">
                      Prepared climate data powers best-window guidance without pushing scoring logic into React.
                    </p>
                  </article>

                  <article className="rounded-[1.75rem] border border-white/35 bg-white/78 p-5 shadow-soft backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-white">Live conditions</p>
                    <p className="mt-3 text-2xl font-semibold text-white">Current weather and forecast</p>
                    <p className="mt-3 text-sm leading-7 text-white">
                      Weather stays behind services so provider changes, retries, and caching stay out of route components.
                    </p>
                  </article>
                </div>
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
          description="Featured cities are loaded through the destination service so the home page can stay stable while the backend evolves from direct reads to prepared RPC payloads."
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
          <div className="grid gap-6 lg:grid-cols-3">
            {featuredDestinations.map((destination) => (
              <DestinationCard key={destination.slug} destination={destination} />
            ))}
          </div>
        ) : null}
      </PageContainer>

      <PageContainer className="space-y-8">
        <SectionHeading
          eyebrow="Seasonal inspiration"
          title="Browse trip ideas shaped by stored climate patterns"
          description="This section is intentionally lightweight in the frontend. The long-term ranking and filtering logic belongs in backend functions, while the UI simply presents curated collections."
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
            {seasonalCollections.map((collection) => (
              <article
                key={collection.title}
                className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Curated direction</p>
                <h3 className="mt-3 text-xl font-semibold text-ink">{collection.title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink/70">{collection.description}</p>
              </article>
            ))}
          </div>
        ) : null}
      </PageContainer>
    </div>
  );
}
