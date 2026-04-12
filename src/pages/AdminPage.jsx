import { Activity, MapPin, MessageSquare, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AddCountrySection } from '../components/admin/AddCountrySection';
import { ConfirmModal } from '../components/admin/ConfirmModal';
import { CountryGrid } from '../components/admin/CountryGrid';
import { RegenerateCountryModal } from '../components/admin/RegenerateCountryModal';
import { UnsplashImagePickerModal } from '../components/admin/UnsplashImagePickerModal';
import { Button, buttonVariants } from '../components/ui/Button';
import { PageContainer } from '../components/ui/PageContainer';
import { SectionHeading } from '../components/ui/SectionHeading';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { StatusPanel } from '../components/ui/StatusPanel';
import { ToastNotice } from '../components/ui/ToastNotice';
import { useAdminData } from '../hooks/useAdminData';
import { useAuth } from '../hooks/useAuth';
import { adminService } from '../services/adminService';

const progressStepDefinitions = [
  {
    key: 'create-country',
    label: 'Creating country...',
    description: 'Preparing the country record, editorial fields, and hero image payload.',
  },
  {
    key: 'discover-destinations',
    label: 'Discovering destinations...',
    description: 'Generating the destination shortlist and validating backend-ready place metadata.',
  },
  {
    key: 'generate-content',
    label: 'Generating destination content...',
    description: 'Writing destination summaries, travel tags, seasonal insights, and image queries.',
  },
  {
    key: 'import-climate',
    label: 'Importing climate data...',
    description: 'Fetching historical climate rows and refreshing best-month derivatives.',
  },
  {
    key: 'finalize',
    label: 'Finalizing...',
    description: 'Refreshing publish-readiness, saving snapshots, and returning the final run report.',
  },
];

function createProgressSteps(activeIndex, errorIndex = null, isComplete = false) {
  return progressStepDefinitions.map((step, index) => {
    let status = 'pending';

    if (isComplete || index < activeIndex) {
      status = 'completed';
    } else if (errorIndex === index) {
      status = 'error';
    } else if (index === activeIndex) {
      status = 'active';
    }

    return {
      ...step,
      status,
    };
  });
}

function CountryGridSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-[1.75rem] border border-ink/10 bg-white/82 p-5 shadow-soft">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr),repeat(3,minmax(0,0.55fr)),auto]">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-20 w-24 rounded-[1.25rem]" />
              <div className="space-y-3">
                <SkeletonBlock className="h-6 w-40" />
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-8 w-24 rounded-full" />
              </div>
            </div>
            <SkeletonBlock className="h-20 w-full rounded-[1.25rem]" />
            <SkeletonBlock className="h-20 w-full rounded-[1.25rem]" />
            <SkeletonBlock className="h-20 w-full rounded-[1.25rem]" />
            <SkeletonBlock className="h-12 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDashboardCount(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatAverageRating(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.0';
  }

  return value.toFixed(1);
}

function PendingReviewBadge({ count, className = '' }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className={`inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-coral px-1.5 text-xs font-bold text-white ring-2 ring-white ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

function DashboardSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-[1.75rem] border border-ink/10 bg-white/82 p-5 shadow-soft">
          <div className="space-y-4">
            <SkeletonBlock className="h-10 w-10 rounded-2xl" />
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-10 w-24" />
            <SkeletonBlock className="h-4 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardSummaryCard({
  icon: Icon,
  label,
  value,
  meta,
  to,
  badgeCount = 0,
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-sand/55 text-ink">
          <Icon className="h-5 w-5" />
        </span>
        <PendingReviewBadge count={badgeCount} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-ink">{value}</p>
        <p className="text-sm leading-6 text-ink/62">{meta}</p>
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        className="flex h-full min-h-[12.5rem] flex-col justify-between rounded-[1.75rem] border border-ink/10 bg-white/82 p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-lagoon/25 hover:shadow-lg"
        to={to}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="flex h-full min-h-[12.5rem] flex-col justify-between rounded-[1.75rem] border border-ink/10 bg-white/82 p-5 shadow-soft">
      {content}
    </article>
  );
}

export function AdminPage() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const {
    countries,
    destinationsByCountryCode,
    error,
    isLoading,
    refresh,
    removeCountry,
    removeDestination,
    applyCountryMutation,
    applyDestinationMutation,
    updateCountryHeroImage,
    updateDestinationHeroImage,
  } = useAdminData(Boolean(session));

  const [countryName, setCountryName] = useState('');
  const [maxDestinations, setMaxDestinations] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runError, setRunError] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [activeProgressIndex, setActiveProgressIndex] = useState(-1);
  const [progressErrorIndex, setProgressErrorIndex] = useState(null);
  const [pendingCountryCode, setPendingCountryCode] = useState('');
  const [deletingCountry, setDeletingCountry] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingDestination, setDeletingDestination] = useState(null);
  const [isDeletingDestination, setIsDeletingDestination] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [imagePickerTarget, setImagePickerTarget] = useState(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [regeneratingCountry, setRegeneratingCountry] = useState(null);
  const [regeneratingCountryOption, setRegeneratingCountryOption] = useState('');
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [topRatedDestination, setTopRatedDestination] = useState(null);

  useEffect(() => {
    if (!isSubmitting) {
      return undefined;
    }

    setActiveProgressIndex(0);
    setProgressErrorIndex(null);

    const intervalId = window.setInterval(() => {
      setActiveProgressIndex((currentIndex) => {
        if (currentIndex >= progressStepDefinitions.length - 1) {
          return currentIndex;
        }

        return currentIndex + 1;
      });
    }, 1800);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isSubmitting]);

  useEffect(() => {
    if (!session) {
      setPendingReviewCount(0);
      setTopRatedDestination(null);
      return undefined;
    }

    let isMounted = true;

    async function loadDashboardReviewData() {
      try {
        const [count, topDestination] = await Promise.all([
          adminService.getPendingReviewCount(),
          adminService.getTopRatedDestination(),
        ]);

        if (isMounted) {
          setPendingReviewCount(count);
          setTopRatedDestination(topDestination);
        }
      } catch {
        if (isMounted) {
          setPendingReviewCount(0);
          setTopRatedDestination(null);
        }
      }
    }

    loadDashboardReviewData();

    return () => {
      isMounted = false;
    };
  }, [session]);

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

  const progressSteps = useMemo(() => {
    if (activeProgressIndex < 0) {
      return [];
    }

    return createProgressSteps(activeProgressIndex, progressErrorIndex, !isSubmitting && !runError);
  }, [activeProgressIndex, progressErrorIndex, isSubmitting, runError]);

  const allDestinations = useMemo(
    () => Object.values(destinationsByCountryCode).flat(),
    [destinationsByCountryCode],
  );

  const missingDataCount = useMemo(
    () =>
      allDestinations.filter((destination) =>
        destination.comfort_score === null
        || destination.comfort_score === undefined
        || !destination.hero_image_url
        || !String(destination.hero_image_url).trim()).length,
    [allDestinations],
  );

  async function runGeneration(action, options = {}) {
    const normalizedCountryName = action.countryName.trim();

    if (!normalizedCountryName) {
      setRunError('Country name is required.');
      return;
    }

    setIsSubmitting(true);
    setRunError('');
    setRunResult(null);
    setLastSubmission(action);

    try {
      const result = action.mode === 'regenerate'
        ? await adminService.regenerateCountry(action)
        : await adminService.generateCountry(action);

      setRunResult(result);
      setCountryName(result.country.name);
      setActiveProgressIndex(progressStepDefinitions.length - 1);
      if (options.onSuccess) {
        await options.onSuccess(result);
      } else {
        await refresh();
      }
    } catch (generationError) {
      setProgressErrorIndex(Math.max(activeProgressIndex, 0));
      setRunError(generationError.message || 'Unable to complete the generation run.');
    } finally {
      setIsSubmitting(false);
      setPendingCountryCode('');
    }
  }

  async function handleGenerate(event) {
    event.preventDefault();

    await runGeneration({
      countryName,
      maxDestinations,
      mode: 'generate',
    });
  }

  async function handleRegenerateCountry(country) {
    setRegeneratingCountry(country);
  }

  async function handleConfirmRegenerateCountry(option) {
    if (!regeneratingCountry) {
      return;
    }

    const country = regeneratingCountry;
    const skipDestinations = option === 'country-only';

    setPendingCountryCode(country.code);
    setRegeneratingCountryOption(option);

    await runGeneration(
      {
        countryName: country.name,
        maxDestinations: Math.min(Math.max(country.destination_count || 6, 5), 8),
        mode: 'regenerate',
        skipDestinations,
      },
      {
        onSuccess: async (result) => {
          applyCountryMutation(country.code, result);
          setToastMessage(
            skipDestinations
              ? `${country.name} country details regenerated successfully.`
              : `${country.name} regenerated successfully.`,
          );
          setRegeneratingCountry(null);
          if (!skipDestinations) {
            await refresh({ silently: true });
          }
        },
      },
    );

    setRegeneratingCountryOption('');
  }

  async function handleRetry() {
    if (!lastSubmission) {
      return;
    }

    await runGeneration(lastSubmission);
  }

  async function handleRegenerateDestination(destination) {
    setRunError('');
    const result = await adminService.regenerateDestination(destination.id);
    applyDestinationMutation(destination.country_code, destination.id, result);
    setToastMessage(`${destination.name} regenerated successfully.`);
  }

  function handleOpenCountryImagePicker(country) {
    setImagePickerTarget({
      type: 'country',
      name: country.name,
      defaultQuery: country.name,
      countryCode: country.code,
    });
  }

  function handleOpenDestinationImagePicker(destination) {
    setImagePickerTarget({
      type: 'destination',
      name: destination.name,
      defaultQuery: `${destination.name} ${destination.country || ''}`.trim(),
      destinationId: destination.id,
      countryCode: destination.country_code,
    });
  }

  async function handleSearchUnsplashImages(query) {
    return adminService.searchUnsplashImages(query);
  }

  async function handleSelectUnsplashImage(photo) {
    if (!imagePickerTarget) {
      return;
    }

    setIsSavingImage(true);
    setRunError('');

    try {
      const updatedRecord = await adminService.updateHeroImage({
        entityType: imagePickerTarget.type,
        countryCode: imagePickerTarget.countryCode,
        destinationId: imagePickerTarget.destinationId,
        photo,
      });

      if (imagePickerTarget.type === 'country') {
        updateCountryHeroImage(imagePickerTarget.countryCode, updatedRecord);
      } else {
        updateDestinationHeroImage(imagePickerTarget.countryCode, imagePickerTarget.destinationId, updatedRecord);
      }

      setToastMessage(`Updated ${imagePickerTarget.name} hero image.`);
      setImagePickerTarget(null);
    } catch (error) {
      setRunError(error.message || 'Unable to update the selected hero image.');
    } finally {
      setIsSavingImage(false);
    }
  }

  function handleDeleteDestination(destination) {
    setDeletingDestination(destination);
  }

  async function handleDeleteCountry() {
    if (!deletingCountry) {
      return;
    }

    setIsDeleting(true);

    try {
      await adminService.deleteCountry(deletingCountry.code);

      removeCountry(deletingCountry.code);
      setToastMessage(`${deletingCountry.name} and its destinations were removed.`);
      setDeletingCountry(null);
    } catch (deleteError) {
      setRunError(deleteError.message || 'Unable to delete the selected country.');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleConfirmDeleteDestination() {
    if (!deletingDestination) {
      return;
    }

    setIsDeletingDestination(true);

    try {
      await adminService.deleteDestination(deletingDestination.id);
      removeDestination(
        deletingDestination.country_code,
        deletingDestination.id,
        Boolean(deletingDestination.is_published),
      );
      setToastMessage('Destination and all associated data purged successfully.');
      setDeletingDestination(null);
    } catch (deleteError) {
      setRunError(deleteError.message || 'Unable to delete the selected destination.');
    } finally {
      setIsDeletingDestination(false);
    }
  }

  if (isAuthLoading) {
    return (
      <PageContainer>
        <StatusPanel
          title="Restoring admin session"
          description="Admin access is gated behind the shared Supabase Auth session."
        />
      </PageContainer>
    );
  }

  if (!session) {
    return <Navigate replace to="/auth" />;
  }

  return (
    <PageContainer className="space-y-10">
      <div id="top" />

      <AddCountrySection
        countryName={countryName}
        errorMessage={runError}
        isSubmitting={isSubmitting}
        maxDestinations={maxDestinations}
        onCountryNameChange={setCountryName}
        onMaxDestinationsChange={setMaxDestinations}
        onRetry={handleRetry}
        onSubmit={handleGenerate}
        progressSteps={progressSteps}
        result={runResult}
      />

      <section className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Countries overview"
            title="Track pipeline output across the current country catalog"
            description="These rows bypass public RLS through authenticated admin RPCs, so unpublished and failed records stay visible for review and retry."
          />
          <Link className={`${buttonVariants({ variant: 'secondary', size: 'sm' })} relative`} to="/admin/reviews">
            Moderate traveler reviews
            <PendingReviewBadge count={pendingReviewCount} className="absolute -right-2 -top-2" />
          </Link>
        </div>

        {isLoading ? <CountryGridSkeleton /> : null}

        {error ? (
          <StatusPanel
            title="Admin catalog unavailable"
            description={error.message || 'The admin country and destination reads failed.'}
            tone="error"
            action={
              <Button onClick={refresh} size="sm">
                Retry data load
              </Button>
            }
          />
        ) : null}

        {!isLoading && !error ? (
          <CountryGrid
            countries={countries}
            deletingCountryCode={isDeleting ? deletingCountry?.code : ''}
            destinationsByCountryCode={destinationsByCountryCode}
            onDeleteDestination={handleDeleteDestination}
            onEditCountryImage={handleOpenCountryImagePicker}
            onEditDestinationImage={handleOpenDestinationImagePicker}
            onDeleteCountry={setDeletingCountry}
            onRegenerateDestination={handleRegenerateDestination}
            onRegenerateCountry={handleRegenerateCountry}
            pendingCountryCode={pendingCountryCode}
          />
        ) : null}
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Dashboard summary"
          title="Monitor review pressure and destination data health"
          description="A quick admin snapshot of moderation load, catalog size, missing destination coverage, and the strongest-rated destination."
        />

        {isLoading ? (
          <DashboardSummarySkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardSummaryCard
              badgeCount={pendingReviewCount}
              icon={MessageSquare}
              label="Pending Reviews"
              meta={pendingReviewCount > 0 ? 'Traveler reviews waiting for moderation.' : 'No traveler reviews are waiting right now.'}
              to="/admin/reviews"
              value={formatDashboardCount(pendingReviewCount)}
            />
            <DashboardSummaryCard
              icon={MapPin}
              label="Total Destinations"
              meta="All destination records currently visible through the admin catalog."
              value={formatDashboardCount(allDestinations.length)}
            />
            <DashboardSummaryCard
              icon={Activity}
              label="Missing Data"
              meta="Destinations missing climate coverage or a stored hero image."
              value={formatDashboardCount(missingDataCount)}
            />
            <DashboardSummaryCard
              icon={Star}
              label="Top Destination"
              meta={
                topRatedDestination
                  ? `${formatAverageRating(topRatedDestination.averageRating)} avg from ${formatDashboardCount(topRatedDestination.reviewCount)} approved reviews`
                  : 'No approved destination reviews yet.'
              }
              to={topRatedDestination ? `/destinations/${topRatedDestination.slug}` : undefined}
              value={topRatedDestination ? topRatedDestination.name : 'No data'}
            />
          </div>
        )}
      </section>

      <ConfirmModal
        cancelLabel="Keep country"
        confirmLabel="Delete country"
        description={
          deletingCountry
            ? `This will delete ${deletingCountry.name}, all linked destinations, monthly climate rows, favorites, and stored source snapshots.`
            : ''
        }
        isOpen={Boolean(deletingCountry)}
        isSubmitting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeletingCountry(null);
          }
        }}
        onConfirm={handleDeleteCountry}
        title={deletingCountry ? `Delete ${deletingCountry.name}?` : 'Delete country?'}
      />
      <ConfirmModal
        cancelLabel="Keep destination"
        confirmLabel="Delete destination"
        description={
          deletingDestination
            ? 'Are you sure? This will permanently remove this destination, delete all associated climate data, and clear it from all users\' favorites.'
            : ''
        }
        isOpen={Boolean(deletingDestination)}
        isSubmitting={isDeletingDestination}
        onClose={() => {
          if (!isDeletingDestination) {
            setDeletingDestination(null);
          }
        }}
        onConfirm={handleConfirmDeleteDestination}
        title={deletingDestination ? `Delete ${deletingDestination.name}?` : 'Delete destination?'}
      />
      <ToastNotice message={toastMessage} />
      <RegenerateCountryModal
        country={regeneratingCountry}
        isOpen={Boolean(regeneratingCountry)}
        loadingOption={regeneratingCountryOption}
        onClose={() => {
          if (!regeneratingCountryOption) {
            setRegeneratingCountry(null);
          }
        }}
        onSelect={handleConfirmRegenerateCountry}
      />
      <UnsplashImagePickerModal
        isOpen={Boolean(imagePickerTarget)}
        isSaving={isSavingImage}
        onClose={() => {
          if (!isSavingImage) {
            setImagePickerTarget(null);
          }
        }}
        onSearch={handleSearchUnsplashImages}
        onSelect={handleSelectUnsplashImage}
        target={imagePickerTarget}
      />
    </PageContainer>
  );
}
