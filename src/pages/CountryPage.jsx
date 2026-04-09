import { Link, useParams } from 'react-router-dom';
import { CountryHero } from '../components/country/CountryHero';
import { CountryPageSkeleton } from '../components/country/CountryPageSkeleton';
import { DestinationCard } from '../components/ui/DestinationCard';
import { EmptyState } from '../components/ui/EmptyState';
import { buttonVariants } from '../components/ui/Button';
import { PageContainer } from '../components/ui/PageContainer';
import { SectionHeading } from '../components/ui/SectionHeading';
import { StatusPanel } from '../components/ui/StatusPanel';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { countriesService } from '../services/countriesService';

export function CountryPage() {
  const { slug = '' } = useParams();
  const { data, error, isLoading } = useAsyncResource(() => countriesService.getCountryPageData(slug), [slug]);

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

      <div className="grid gap-6 xl:grid-cols-[1.02fr,0.98fr]">
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Country overview"
            title={`How to use ${data.name} as a planning starting point`}
            description="Country pages stay qualitative. They summarize the current curated coverage and point you toward destination-level profiles instead of pretending one climate pattern fits the whole country."
          />

          <article className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Travel planning lens</p>
            <p className="mt-5 text-base leading-8 text-ink/75">{data.climateGuidance}</p>
          </article>
        </section>

        <section className="space-y-8">
          <SectionHeading
            eyebrow="Coverage"
            title="What this country page currently includes"
            description="As the backend catalog grows, this page can deepen through more curated destinations and editorial country content without moving business logic into React."
          />

          <article className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Current foundation</p>
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
          description="These cards give the country page a destination-led foundation. They keep seasonal and climate guidance anchored to real destination records instead of a fake country-wide forecast."
        />

        {data.featuredDestinations.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {data.featuredDestinations.map((destination) => (
              <DestinationCard key={destination.slug} destination={destination} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Featured destinations are still being curated"
            description={`Country guidance for ${data.name} is live, but destination cards for this page have not been curated yet.`}
          />
        )}
      </section>
    </PageContainer>
  );
}
