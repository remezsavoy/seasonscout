import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { PageContainer } from '../components/ui/PageContainer';
import { SectionHeading } from '../components/ui/SectionHeading';
import { StatusPanel } from '../components/ui/StatusPanel';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { destinationsService } from '../services/destinationsService';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthLookup = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function normalizeMonthNumbers(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 12),
  )].sort((left, right) => left - right);
}

function parsePeakSeasonWindow(value) {
  if (!value || typeof value !== 'string') {
    return [];
  }

  const compactValue = value.trim();

  if (!compactValue) {
    return [];
  }

  const parts = compactValue
    .split('-')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (parts.length === 0) {
    return [];
  }

  const startMonth = monthLookup[parts[0]];
  const endMonth = monthLookup[parts[parts.length - 1]];

  if (!startMonth || !endMonth) {
    return [];
  }

  if (startMonth === endMonth) {
    return [startMonth];
  }

  const months = [];
  let currentMonth = startMonth;

  while (true) {
    months.push(currentMonth);

    if (currentMonth === endMonth) {
      break;
    }

    currentMonth = currentMonth === 12 ? 1 : currentMonth + 1;

    if (months.length > 12) {
      return [];
    }
  }

  return months;
}

function buildMonthColumns(destinations, mode) {
  const columns = monthNames.map((monthName, index) => ({
    id: index + 1,
    label: monthName,
    shortLabel: shortMonthNames[index],
    destinations: [],
  }));

  for (const destination of destinations) {
    const activeMonths = mode === 'peak'
      ? parsePeakSeasonWindow(destination.peakSeason)
      : normalizeMonthNumbers(destination.bestMonths);

    for (const monthNumber of activeMonths) {
      columns[monthNumber - 1].destinations.push(destination);
    }
  }

  return columns;
}

function formatContinentName(value) {
  if (!value) {
    return 'All continents';
  }

  return String(value)
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function ExploreCalendarCard({ destination }) {
  return (
    <Link
      className="group overflow-hidden rounded-[1.35rem] border border-ink/8 bg-white/88 shadow-soft transition hover:-translate-y-0.5 hover:border-lagoon/25"
      to={`/destinations/${destination.slug}`}
    >
      <div className="h-28 w-full overflow-hidden bg-ink/8">
        {destination.heroImageUrl ? (
          <img
            alt={`${destination.name} hero`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            src={destination.heroImageUrl}
          />
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-base font-semibold text-ink">{destination.name}</p>
          <p className="mt-1 text-sm text-ink/58">{destination.country}</p>
        </div>

        {destination.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {destination.tags.map((tag) => (
              <span
                key={`${destination.slug}-${tag}`}
                className="rounded-full border border-lagoon/12 bg-sand/40 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-ink/68"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function ExploreCalendar() {
  const { data, error, isLoading } = useAsyncResource(destinationsService.getExploreCalendarData, []);
  const destinations = data ?? [];
  const [mode, setMode] = useState('optimal');
  const [selectedContinent, setSelectedContinent] = useState('all');

  const continents = ['all', ...new Set(destinations.map((destination) => destination.continent).filter(Boolean))];
  const filteredDestinations = destinations.filter((destination) =>
    selectedContinent === 'all' ? true : destination.continent === selectedContinent,
  );
  const monthColumns = buildMonthColumns(filteredDestinations, mode);

  return (
    <PageContainer className="space-y-10">
      <section className="space-y-8">
        <SectionHeading
          eyebrow="Explore calendar"
          title="Browse destinations month by month"
          description="Switch between human travel timing and the climate-driven best window, then scan destinations by month with a simple continent filter."
        />

        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-ink/10 bg-white/82 p-5 shadow-soft lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lagoon">Peak Season vs. Optimal Weather</p>
            <div className="inline-flex rounded-full bg-sand/55 p-1">
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'peak' ? 'bg-ink text-white shadow-sm' : 'text-ink/65'}`}
                onClick={() => setMode('peak')}
                type="button"
              >
                Peak Season
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'optimal' ? 'bg-ink text-white shadow-sm' : 'text-ink/65'}`}
                onClick={() => setMode('optimal')}
                type="button"
              >
                Optimal Weather
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-ink/70">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">Continent</span>
            <select
              className="rounded-full border border-ink/10 bg-sand/35 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-lagoon/40"
              onChange={(event) => setSelectedContinent(event.target.value)}
              value={selectedContinent}
            >
              {continents.map((continent) => (
                <option key={continent} value={continent}>
                  {continent === 'all' ? 'All continents' : formatContinentName(continent)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoading ? (
          <StatusPanel
            title="Loading explore calendar"
            description="Preparing month-by-month destination groupings from the published destination catalog."
          />
        ) : null}

        {error ? (
          <StatusPanel
            title="Explore calendar unavailable"
            description={error.message || 'The month-by-month destination browse view could not be loaded right now.'}
            tone="error"
          />
        ) : null}

        {!isLoading && !error && filteredDestinations.length === 0 ? (
          <EmptyState
            title="No destinations match this filter"
            description="Try another continent or wait until more enriched destinations are published."
          />
        ) : null}

        {!isLoading && !error && filteredDestinations.length > 0 ? (
          <div className="overflow-x-auto pb-3">
            <div className="flex min-w-max gap-4">
              {monthColumns.map((column) => (
                <section
                  key={column.id}
                  className="flex w-72 shrink-0 flex-col rounded-[1.75rem] border border-ink/10 bg-white/82 p-4 shadow-soft"
                >
                  <div className="border-b border-ink/8 pb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lagoon">{column.shortLabel}</p>
                    <h2 className="mt-2 text-xl font-semibold text-ink">{column.label}</h2>
                    <p className="mt-1 text-sm text-ink/55">{column.destinations.length} destinations</p>
                  </div>

                  <div className="mt-4 flex flex-1 flex-col gap-3">
                    {column.destinations.length > 0 ? column.destinations.map((destination) => (
                      <ExploreCalendarCard key={`${column.id}-${destination.slug}`} destination={destination} />
                    )) : (
                      <div className="flex h-full min-h-44 items-center justify-center rounded-[1.35rem] border border-dashed border-ink/10 bg-sand/25 px-4 text-center text-sm leading-6 text-ink/55">
                        No destinations land here for the selected mode and filter.
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </PageContainer>
  );
}
