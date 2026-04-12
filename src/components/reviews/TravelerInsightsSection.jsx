import { CalendarRange, Quote, Star } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

function formatReviewDate(value) {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate);
}

function RatingRow({ rating }) {
  return (
    <div className="flex items-center gap-1 text-sunrise">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < rating ? 'fill-current' : 'text-ink/18'}`} />
      ))}
    </div>
  );
}

export function TravelerInsightsSection({ entityLabel, reviews }) {
  return (
    <section className="space-y-6">
      <div className="max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Traveler insights</p>
        <h2 className="font-display text-3xl text-ink sm:text-4xl">What travelers say about {entityLabel}</h2>
        <p className="mt-4 text-sm leading-7 text-ink/68 sm:text-base">
          Real visitor notes, favorite months, and practical tips from travelers who have already been there.
        </p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          className="w-full py-16"
          description={`No approved reviews have been published for ${entityLabel} yet.`}
          title="Traveler feedback is on the way"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-[1.75rem] border border-ink/10 bg-white/82 p-6 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-ink">{review.userName}</p>
                  <p className="mt-1 text-sm text-ink/52">{formatReviewDate(review.createdAt)}</p>
                </div>
                <Quote className="h-6 w-6 text-lagoon/45" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <RatingRow rating={review.rating} />
                {review.visitMonth ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-sand/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/62">
                    <CalendarRange className="h-3.5 w-3.5" />
                    {review.visitMonth}
                  </span>
                ) : null}
              </div>

              <p className="mt-5 text-sm leading-8 text-ink/74">{review.content}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
