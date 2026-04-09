import { buildHeroImageAttribution } from './heroImageAttribution';

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

const shortMonthNames = monthNames.map((month) => month.slice(0, 3));

function toArray(values) {
  return Array.isArray(values) ? values.filter(Boolean) : [];
}

function normalizeMonthNumbers(values) {
  return [...new Set(
    toArray(values)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 12),
  )].sort((left, right) => left - right);
}

function areConsecutiveMonths(currentMonth, nextMonth) {
  return nextMonth === currentMonth + 1 || (currentMonth === 12 && nextMonth === 1);
}

function orderMonthNumbersForDisplay(values) {
  const normalizedMonths = normalizeMonthNumbers(values);

  if (normalizedMonths.length < 2) {
    return normalizedMonths;
  }

  let largestGap = 0;
  let rotationIndex = 0;

  for (let index = 0; index < normalizedMonths.length; index += 1) {
    const currentMonth = normalizedMonths[index];
    const nextMonth = normalizedMonths[(index + 1) % normalizedMonths.length];
    const gap = index === normalizedMonths.length - 1
      ? nextMonth + 12 - currentMonth
      : nextMonth - currentMonth;

    if (gap > largestGap) {
      largestGap = gap;
      rotationIndex = (index + 1) % normalizedMonths.length;
    }
  }

  if (largestGap <= 1 || rotationIndex === 0) {
    return normalizedMonths;
  }

  return normalizedMonths.slice(rotationIndex).concat(normalizedMonths.slice(0, rotationIndex));
}

function average(values) {
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

function formatMonthRange(monthNumbers) {
  const orderedMonthNumbers = orderMonthNumbersForDisplay(monthNumbers);

  if (orderedMonthNumbers.length === 0) {
    return '';
  }

  const ranges = [];
  let start = orderedMonthNumbers[0];
  let end = orderedMonthNumbers[0];

  for (let index = 1; index < orderedMonthNumbers.length; index += 1) {
    const month = orderedMonthNumbers[index];

    if (areConsecutiveMonths(end, month)) {
      end = month;
      continue;
    }

    ranges.push([start, end]);
    start = month;
    end = month;
  }

  ranges.push([start, end]);

  return ranges
    .map(([rangeStart, rangeEnd]) => {
      if (rangeStart === rangeEnd) {
        return shortMonthNames[rangeStart - 1];
      }

      return `${shortMonthNames[rangeStart - 1]}-${shortMonthNames[rangeEnd - 1]}`;
    })
    .join(', ');
}

function formatBestMonthsLabel(monthNumbers) {
  return formatMonthRange(monthNumbers) || 'Recommendation pending';
}

function formatTemperature(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'n/a';
  }

  return `${Math.round(Number(value))} C`;
}

function formatPrecipitation(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'n/a';
  }

  return `${Math.round(Number(value))} mm`;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'n/a';
  }

  return `${Math.round(Number(value))}%`;
}

function formatHours(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'n/a';
  }

  return `${Number(value).toFixed(1)} h`;
}

function formatScore(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'n/a';
  }

  return `${Math.round(Number(value))}/100`;
}

function buildClimateCue(monthNumbers) {
  if (monthNumbers.length > 0) {
    return `${monthNumbers.length}-month sweet spot`;
  }

  return 'Climate data available';
}

function buildHeadline(destination) {
  if (destination.seasonal_insight) {
    return destination.seasonal_insight;
  }

  const bestWindow = formatMonthRange(destination.best_months);

  if (bestWindow) {
    return `Best travel windows currently center on ${bestWindow}.`;
  }

  return 'Destination climate insights are available for planning.';
}

function buildHeroTag(destination) {
  const tags = toArray(destination.travel_tags).slice(0, 2);

  if (tags.length > 0) {
    return tags.join(' / ');
  }

  if (destination.continent) {
    return `${destination.continent} climate profile`;
  }

  return 'Climate-informed travel';
}

function buildHeroHighlights(destination, climateRows) {
  const bestMonthNumbers = normalizeMonthNumbers(destination.best_months);
  const bestWindow = formatBestMonthsLabel(bestMonthNumbers);
  const driestRows = climateRows.filter((row) => row.avg_precip_mm !== null && row.avg_precip_mm !== undefined);
  const driestMonth =
    driestRows.length > 0
      ? driestRows.reduce((current, row) =>
          Number(row.avg_precip_mm) < Number(current.avg_precip_mm) ? row : current,
        )
      : null;

  return [
    {
      label: 'Best window',
      value: bestWindow,
    },
    {
      label: 'Timezone',
      value: destination.timezone || 'Local time pending',
    },
    {
      label: 'Climate cue',
      value: driestMonth ? `${monthNumberToName(driestMonth.month)} is usually drier` : buildClimateCue(bestMonthNumbers),
    },
  ];
}

function buildBestMonthsDescription(destination, climateRows) {
  const bestMonthNumbers = normalizeMonthNumbers(destination.best_months);
  const bestWindow = formatMonthRange(bestMonthNumbers);

  if (!bestWindow) {
    return 'Best-month guidance will appear here once recommendation data is available.';
  }

  const bestRows = climateRows.filter((row) => bestMonthNumbers.includes(Number(row.month)));

  if (bestRows.length === 0) {
    return buildHeadline(destination);
  }

  const avgHigh = average(bestRows.map((row) => row.avg_high_c));
  const avgPrecip = average(bestRows.map((row) => row.avg_precip_mm));

  if (avgHigh === null || avgPrecip === null) {
    return buildHeadline(destination);
  }

  return `The strongest travel window is ${bestWindow}, with typical daytime highs near ${Math.round(avgHigh)} C and around ${Math.round(avgPrecip)} mm of monthly precipitation.`;
}

function formatSourceName(source) {
  if (!source) {
    return 'Climate source pending';
  }

  if (source === 'manual_seed' || source === 'SeasonScout curated baseline') {
    return 'SeasonScout curated baseline';
  }

  if (source.startsWith('open_meteo_historical_weather:')) {
    const sourcePeriod = source.slice('open_meteo_historical_weather:'.length);
    return `Open-Meteo historical weather (${sourcePeriod})`;
  }

  return source
    .split('_')
    .filter(Boolean)
    .join(' ');
}

function formatDateLabel(value) {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate);
}

function formatClimateSourceLabel(source, lastUpdated) {
  const sourceLabel = formatSourceName(source);
  const updatedLabel = formatDateLabel(lastUpdated);

  if (!updatedLabel || sourceLabel === 'Climate source pending') {
    return sourceLabel;
  }

  return `${sourceLabel} | updated ${updatedLabel}`;
}

export function monthNumberToName(monthNumber) {
  return monthNames[Number(monthNumber) - 1] ?? `Month ${monthNumber}`;
}

export function mapBestMonthNumbersToNames(values) {
  return orderMonthNumbersForDisplay(values).map(monthNumberToName);
}

export function mapDestinationRowToCard(destination) {
  const bestMonthNumbers = normalizeMonthNumbers(destination.best_months);

  return {
    slug: destination.slug,
    name: destination.name,
    country: destination.country,
    region: destination.continent || 'Featured destination',
    summary: destination.summary || 'Climate and seasonal travel guidance available.',
    bestWindow: formatBestMonthsLabel(bestMonthNumbers),
    climateCue: buildClimateCue(bestMonthNumbers),
    tags: toArray(destination.travel_tags).slice(0, 3),
  };
}

export function mapClimateRowsToPreview(climateRows, destination) {
  if (climateRows.length === 0) {
    return [
      {
        label: 'Climate data',
        value: 'Monthly averages pending',
      },
      {
        label: 'Best window',
        value: formatBestMonthsLabel(destination.best_months),
      },
      {
        label: 'Travel tags',
        value: toArray(destination.travel_tags).slice(0, 2).join(', ') || 'Curated destination',
      },
    ];
  }

  const warmestMonth = climateRows.reduce((current, row) =>
    Number(row.avg_high_c) > Number(current.avg_high_c) ? row : current,
  );
  const coolestMonth = climateRows.reduce((current, row) =>
    Number(row.avg_low_c) < Number(current.avg_low_c) ? row : current,
  );

  const wetRows = climateRows.filter((row) => row.avg_precip_mm !== null && row.avg_precip_mm !== undefined);
  const wettestMonth =
    wetRows.length > 0
      ? wetRows.reduce((current, row) =>
          Number(row.avg_precip_mm) > Number(current.avg_precip_mm) ? row : current,
        )
      : null;

  return [
    {
      label: 'Warmest month',
      value: `${monthNumberToName(warmestMonth.month)} - ${formatTemperature(warmestMonth.avg_high_c)}`,
    },
    {
      label: 'Coolest month',
      value: `${monthNumberToName(coolestMonth.month)} - ${formatTemperature(coolestMonth.avg_low_c)}`,
    },
    wettestMonth
      ? {
          label: 'Wettest month',
          value: `${monthNumberToName(wettestMonth.month)} - ${formatPrecipitation(wettestMonth.avg_precip_mm)}`,
        }
      : {
          label: 'Climate source',
          value: climateRows[0]?.source || 'Curated record',
        },
  ];
}

export function mapMonthlyClimateRowsToTable(climateRows) {
  return climateRows.map((row) => ({
    id: row.id ?? `month-${row.month}`,
    month: monthNumberToName(row.month),
    monthShort: shortMonthNames[Number(row.month) - 1] ?? `M${row.month}`,
    avgHigh: formatTemperature(row.avg_high_c),
    avgLow: formatTemperature(row.avg_low_c),
    precipitation: formatPrecipitation(row.avg_precip_mm),
    humidity: formatPercent(row.avg_humidity),
    sunshine: formatHours(row.sunshine_hours),
    comfortScore: formatScore(row.comfort_score),
    recommendation: row.recommendation_label || 'Pending',
  }));
}

export function mapDestinationRowToPage(destination, climateRows, weatherPreview) {
  const bestMonthNumbers = normalizeMonthNumbers(destination.best_months);
  const displayBestMonthNumbers = orderMonthNumbersForDisplay(bestMonthNumbers);

  return {
    id: destination.id ?? destination.slug,
    slug: destination.slug,
    name: destination.name,
    country: destination.country,
    continent: destination.continent || '',
    timezone: destination.timezone,
    summary: destination.summary || 'Climate and destination details are available for this location.',
    heroTag: buildHeroTag(destination),
    heroImageUrl: destination.hero_image_url || null,
    heroImageAttribution: buildHeroImageAttribution(destination),
    heroHighlights: buildHeroHighlights(destination, climateRows),
    bestMonths: mapBestMonthNumbersToNames(bestMonthNumbers),
    bestMonthsLabel: formatBestMonthsLabel(bestMonthNumbers),
    bestMonthsDescription: buildBestMonthsDescription(destination, climateRows),
    travelTags: toArray(destination.travel_tags),
    headline: buildHeadline(destination),
    climateHighlights: mapClimateRowsToPreview(climateRows, destination),
    monthlyClimate: mapMonthlyClimateRowsToTable(climateRows),
    climateSource: formatClimateSourceLabel(climateRows[0]?.source, climateRows[0]?.last_updated),
    currentWeather: weatherPreview.current,
    forecast: weatherPreview.forecast ?? [],
    weatherNote: weatherPreview.note || '',
    weatherProvider: weatherPreview.provider || 'Open-Meteo',
    seasonalInsight:
      destination.seasonal_insight ||
      'Best-month logic and travel guidance should remain backend-driven as climate data grows.',
  };
}

export function mapFavoriteDestination(destination) {
  const card = mapDestinationRowToCard(destination);

  return {
    id: destination.id ?? destination.destination_id ?? destination.slug,
    ...card,
    savedAt: destination.favorite_created_at || null,
  };
}
