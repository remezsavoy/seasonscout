import { CalendarRange, MessageSquareText, Send, Star, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { StatusPanel } from '../ui/StatusPanel';

function ReviewStarButton({ isActive, onClick }) {
  return (
    <button
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white/75 text-sunrise transition hover:border-sunrise/45 hover:bg-sunrise/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lagoon/30"
      onClick={onClick}
      type="button"
    >
      <Star className={`h-5 w-5 ${isActive ? 'fill-current' : ''}`} />
    </button>
  );
}

export function ReviewFormSection({
  entityLabel,
  onSubmit,
  monthOptions,
}) {
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(0);
  const [visitMonth, setVisitMonth] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!userName.trim()) {
      setErrorMessage('Name is required.');
      return;
    }

    if (!rating) {
      setErrorMessage('Please choose a star rating.');
      return;
    }

    if (content.trim().length < 20) {
      setErrorMessage('Please share at least a few sentences about your trip.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await onSubmit({
        userName: userName.trim(),
        rating,
        content: content.trim(),
        visitMonth: visitMonth ? Number(visitMonth) : null,
      });

      setUserName('');
      setRating(0);
      setVisitMonth('');
      setContent('');
      setSuccessMessage('Thanks. Your review was submitted for moderation.');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to submit your review right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Leave a review</p>
        <h2 className="font-display text-3xl text-ink sm:text-4xl">Share your trip insight</h2>
        <p className="mt-4 text-sm leading-7 text-ink/68 sm:text-base">
          Help other travelers plan better with a short review of your experience in {entityLabel}.
        </p>
      </div>

      {errorMessage ? (
        <StatusPanel
          description={errorMessage}
          title="Review submission failed"
          tone="error"
        />
      ) : null}

      {successMessage ? (
        <StatusPanel
          description={successMessage}
          title="Review received"
          tone="success"
        />
      ) : null}

      <form className="rounded-[1.9rem] border border-ink/10 bg-white/82 p-6 shadow-soft" onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-[1fr,0.8fr]">
          <label className="block">
            <span className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink/55">
              <UserRound className="h-4 w-4" />
              Your name
            </span>
            <input
              className="w-full rounded-[1.1rem] border border-ink/10 bg-sand/18 px-4 py-3 text-sm text-ink outline-none transition focus:border-lagoon/35 focus:ring-2 focus:ring-lagoon/12"
              disabled={isSubmitting}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="How should we credit you?"
              value={userName}
            />
          </label>

          <label className="block">
            <span className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink/55">
              <CalendarRange className="h-4 w-4" />
              Visit month
            </span>
            <select
              className="w-full rounded-[1.1rem] border border-ink/10 bg-sand/18 px-4 py-3 text-sm text-ink outline-none transition focus:border-lagoon/35 focus:ring-2 focus:ring-lagoon/12"
              disabled={isSubmitting}
              onChange={(event) => setVisitMonth(event.target.value)}
              value={visitMonth}
            >
              <option value="">Select a month</option>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink/55">
            <Star className="h-4 w-4" />
            Rating
          </p>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }).map((_, index) => {
              const starValue = index + 1;
              return (
                <ReviewStarButton
                  key={starValue}
                  isActive={starValue <= rating}
                  onClick={() => setRating(starValue)}
                />
              );
            })}
          </div>
        </div>

        <label className="mt-6 block">
          <span className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink/55">
            <MessageSquareText className="h-4 w-4" />
            Your review
          </span>
          <textarea
            className="min-h-[11rem] w-full rounded-[1.3rem] border border-ink/10 bg-sand/18 px-4 py-4 text-sm leading-7 text-ink outline-none transition focus:border-lagoon/35 focus:ring-2 focus:ring-lagoon/12"
            disabled={isSubmitting}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What stood out? Which season worked well? What should future travelers know?"
            value={content}
          />
        </label>

        <div className="mt-6 flex justify-end">
          <Button className="min-w-[12rem]" disabled={isSubmitting} type="submit">
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit review'}
          </Button>
        </div>
      </form>
    </section>
  );
}
