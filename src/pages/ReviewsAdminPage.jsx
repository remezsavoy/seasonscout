import { Check, Filter, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ConfirmModal } from '../components/admin/ConfirmModal';
import { Button, buttonVariants } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PageContainer } from '../components/ui/PageContainer';
import { SectionHeading } from '../components/ui/SectionHeading';
import { StatusPanel } from '../components/ui/StatusPanel';
import { useAuth } from '../hooks/useAuth';
import { reviewsService } from '../services/reviewsService';

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

function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-1 text-sunrise">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < rating ? 'fill-current' : 'text-ink/15'}`} />
      ))}
    </div>
  );
}

function ReviewContextLink({ review }) {
  const countryName = review.country?.name ?? '';
  const countrySlug = review.country?.slug ?? '';
  const destinationName = review.destination?.name ?? '';
  const destinationSlug = review.destination?.slug ?? '';

  if (destinationName && destinationSlug) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink/68">
        {countryName && countrySlug ? (
          <>
            <a
              className="transition hover:text-lagoon"
              href={`/countries/${countrySlug}`}
              rel="noreferrer"
              target="_blank"
            >
              {countryName}
            </a>
            <span className="text-ink/35">/</span>
          </>
        ) : null}
        <a
          className="transition hover:text-lagoon"
          href={`/destinations/${destinationSlug}`}
          rel="noreferrer"
          target="_blank"
        >
          {destinationName}
        </a>
      </div>
    );
  }

  if (countryName && countrySlug) {
    return (
      <a
        className="text-sm font-medium text-ink/68 transition hover:text-lagoon"
        href={`/countries/${countrySlug}`}
        rel="noreferrer"
        target="_blank"
      >
        {countryName}
      </a>
    );
  }

  return <span className="text-sm font-medium text-ink/52">Review target unavailable</span>;
}

export function ReviewsAdminPage() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const [filter, setFilter] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [approvingReviewId, setApprovingReviewId] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState('');
  const [reviewPendingDelete, setReviewPendingDelete] = useState(null);

  useEffect(() => {
    if (!session) {
      setReviews([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return undefined;
    }

    let isMounted = true;

    async function loadReviews(options = {}) {
      const { preserveContent = false } = options;

      if (preserveContent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const nextReviews = await reviewsService.getAdminReviews(filter);

        if (!isMounted) {
          return;
        }

        setReviews(nextReviews);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadReviews();

    function handleWindowFocus() {
      if (!document.hidden) {
        loadReviews({ preserveContent: true });
      }
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        loadReviews({ preserveContent: true });
      }
    }

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [filter, session]);

  async function handleApprove(reviewId) {
    setApprovingReviewId(reviewId);

    try {
      const updatedReview = await reviewsService.approveReview(reviewId);
      setReviews((currentReviews) => {
        if (filter === 'pending') {
          return currentReviews.filter((review) => review.id !== reviewId);
        }

        return currentReviews.map((review) => (review.id === reviewId ? updatedReview : review));
      });
    } catch (approveError) {
      setError(approveError);
    } finally {
      setApprovingReviewId('');
    }
  }

  async function handleDelete() {
    if (!reviewPendingDelete) {
      return;
    }

    const reviewId = reviewPendingDelete.id;
    setDeletingReviewId(reviewId);

    try {
      await reviewsService.deleteReview(reviewId);
      setReviews((currentReviews) => currentReviews.filter((review) => review.id !== reviewId));
      setReviewPendingDelete(null);
    } catch (deleteError) {
      setError(deleteError);
    } finally {
      setDeletingReviewId('');
    }
  }

  if (isAuthLoading) {
    return (
      <PageContainer>
        <StatusPanel
          description="Admin review moderation is gated behind the shared Supabase Auth session."
          title="Restoring admin session"
        />
      </PageContainer>
    );
  }

  if (!session) {
    return <Navigate replace to="/auth" />;
  }

  return (
    <PageContainer className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="Admin reviews"
          title="Moderate traveler feedback"
          description="Approve pending traveler reviews for public display or remove them from the moderation queue."
        />
        <Link className={buttonVariants({ variant: 'secondary', size: 'sm' })} to="/admin">
          Back to admin dashboard
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-ink/68 ring-1 ring-ink/10">
          <Filter className="h-4 w-4" />
          Filter
        </span>
        <Button onClick={() => setFilter('pending')} size="sm" variant={filter === 'pending' ? 'primary' : 'secondary'}>
          Pending
        </Button>
        <Button onClick={() => setFilter('all')} size="sm" variant={filter === 'all' ? 'primary' : 'secondary'}>
          All
        </Button>
        {isRefreshing && !isLoading ? (
          <span className="inline-flex items-center rounded-full bg-white/75 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink/50 ring-1 ring-ink/10">
            Refreshing…
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <StatusPanel
          description="Loading review moderation items."
          title="Fetching reviews"
        />
      ) : null}

      {error ? (
        <StatusPanel
          description={error.message || 'The review queue could not be loaded right now.'}
          title="Review moderation unavailable"
          tone="error"
        />
      ) : null}

      {!isLoading && !error && reviews.length === 0 ? (
        <EmptyState
          className="grid min-h-[18rem] place-items-center"
          description={filter === 'pending' ? 'No pending reviews are waiting for moderation.' : 'No reviews have been submitted yet.'}
          title="Review queue is clear"
        />
      ) : null}

      {!isLoading && !error && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-[1.6rem] border border-ink/10 bg-white/82 p-5 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-ink">{review.userName}</p>
                    <span className="rounded-full bg-sand/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
                      {review.destinationId ? 'Destination review' : 'Country review'}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/50 ring-1 ring-ink/10">
                      {review.status}
                    </span>
                  </div>

                  <ReviewContextLink review={review} />

                  <div className="flex flex-wrap items-center gap-4 text-sm text-ink/58">
                    <RatingStars rating={review.rating} />
                    <span>{formatReviewDate(review.createdAt)}</span>
                    {review.visitMonth ? <span>Visited {review.visitMonth}</span> : null}
                  </div>

                  <p className="max-w-3xl text-sm leading-7 text-ink/72">{review.content}</p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {review.status === 'pending' ? (
                    <Button
                      disabled={approvingReviewId === review.id || deletingReviewId === review.id}
                      onClick={() => handleApprove(review.id)}
                      size="sm"
                      variant="secondary"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {approvingReviewId === review.id ? 'Approving...' : 'Approve'}
                    </Button>
                  ) : null}
                  <Button
                    className="bg-coral hover:bg-coral/90"
                    disabled={deletingReviewId === review.id}
                    onClick={() => setReviewPendingDelete(review)}
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deletingReviewId === review.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <ConfirmModal
        cancelLabel="Cancel"
        confirmLabel="Delete"
        description="This action is permanent."
        isOpen={Boolean(reviewPendingDelete)}
        isSubmitting={Boolean(reviewPendingDelete) && deletingReviewId === reviewPendingDelete?.id}
        onClose={() => {
          if (!deletingReviewId) {
            setReviewPendingDelete(null);
          }
        }}
        onConfirm={handleDelete}
        title="Delete Review?"
      />
    </PageContainer>
  );
}
