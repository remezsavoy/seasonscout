import { Link, useParams } from 'react-router-dom';
import { CountryHero } from '../components/country/CountryHero';
import { CountryQuickFacts } from '../components/country/CountryQuickFacts';
import { CountryPageSkeleton } from '../components/country/CountryPageSkeleton';
import { ReviewFormSection } from '../components/reviews/ReviewFormSection';
import { TravelerInsightsSection } from '../components/reviews/TravelerInsightsSection';
import { DestinationCard } from '../components/ui/DestinationCard';
import { EmptyState } from '../components/ui/EmptyState';
import { buttonVariants } from '../components/ui/Button';
import { PageContainer } from '../components/ui/PageContainer';
import { SectionHeading } from '../components/ui/SectionHeading';
import { StatusPanel } from '../components/ui/StatusPanel';
import { useQuery } from '@tanstack/react-query';
import { countriesService } from '../services/countriesService';
import { reviewsService } from '../services/reviewsService';

export function CountryPage() {
  const { slug = '' } = useParams();
  const { data, error, isLoading } = useQuery({
    queryKey: ['country', slug],
    queryFn: () => countriesService.getCountryPageData(slug),
  });

  if (isLoading) {
    return <CountryPageSkeleton />;
  }

  if (error || !data) {
    return (
      <PageContainer>
        <StatusPanel
          title="Country guide unavailable"
          description="The route expects one prepared country payload from the service layer. Loading failures should degrade gracefully without breaking navigation."
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
      <CountryHero country={data} />
      <CountryQuickFacts quickFacts={data.quickFacts} />

      <div className="grid gap-6 xl:grid-cols-[1.02fr,0.98fr]">
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Country overview"
            title={`Why Visit ${data.name}`}
          />

          <div className="max-w-3xl">
            <p className="text-lg leading-9 text-ink/78">{data.climateGuidance}</p>
          </div>
        </section>

        <section className="space-y-8">
          <SectionHeading
            eyebrow="Coverage"
            title={`Explore ${data.name}`}
          />

          <article className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
            <dl className="mt-5 grid gap-5">
              {data.overviewItems.map((item) => (
                <div key={item.label} className="rounded-[1.25rem] bg-sand/55 p-4">
                  <dt className="text-xs uppercase tracking-[0.22em] text-ink/48">{item.label}</dt>
                  <dd className="mt-2 text-sm font-semibold leading-7 text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </section>
      </div>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Featured destinations"
          title={`Curated places to compare within ${data.name}`}
          description={`Explore our hand-picked locations across ${data.name}, complete with detailed seasonal data to help you time your perfect trip.`}
        />

        {data.featuredDestinations.length > 0 ? (
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {data.featuredDestinations.map((destination) => (
              <DestinationCard
                key={destination.slug}
                destination={destination}
                photoUrl={destination.heroImageSourceUrl}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Featured destinations are still being curated"
            description={`Country guidance for ${data.name} is live, but destination cards for this page have not been curated yet.`}
          />
        )}
      </section>

      <TravelerInsightsSection entityLabel={data.name} reviews={data.reviews ?? []} />
      <ReviewFormSection
        entityLabel={data.name}
        monthOptions={reviewsService.monthOptions}
        onSubmit={(review) => reviewsService.submitCountryReview({
          ...review,
          countryId: data.countryId,
        })}
      />
    </PageContainer>
  );
}
