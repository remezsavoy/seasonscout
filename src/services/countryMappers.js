import { mapDestinationRowToCard } from './destinationMappers';
import { buildHeroImageAttribution } from './heroImageAttribution';

function toArray(values) {
  return Array.isArray(values) ? values.filter(Boolean) : [];
}

function formatCountryName(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function humanizeList(values) {
  const normalizedValues = [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];

  if (normalizedValues.length === 0) {
    return '';
  }

  if (normalizedValues.length === 1) {
    return normalizedValues[0];
  }

  if (normalizedValues.length === 2) {
    return `${normalizedValues[0]} and ${normalizedValues[1]}`;
  }

  return `${normalizedValues.slice(0, -1).join(', ')}, and ${normalizedValues[normalizedValues.length - 1]}`;
}

function normalizeCountryQuickFacts(quickFacts) {
  if (!quickFacts || typeof quickFacts !== 'object' || Array.isArray(quickFacts)) {
    return null;
  }

  const currency = quickFacts.currency && typeof quickFacts.currency === 'object' && !Array.isArray(quickFacts.currency)
    ? quickFacts.currency
    : {};
  const normalizedQuickFacts = {
    capital: typeof quickFacts.capital === 'string' ? quickFacts.capital.trim() : '',
    languages: Array.isArray(quickFacts.languages)
      ? quickFacts.languages.map((language) => String(language).trim()).filter(Boolean)
      : [],
    timezones: Array.isArray(quickFacts.timezones)
      ? quickFacts.timezones.map((timezone) => String(timezone).trim()).filter(Boolean)
      : [],
    currency: {
      code: typeof currency.code === 'string' ? currency.code.trim() : '',
      name: typeof currency.name === 'string' ? currency.name.trim() : '',
      symbol: typeof currency.symbol === 'string' ? currency.symbol.trim() : '',
    },
    drivingSide: typeof quickFacts.driving_side === 'string' ? quickFacts.driving_side.trim() : '',
    idd: typeof quickFacts.idd === 'string' ? quickFacts.idd.trim() : '',
    borders: Array.isArray(quickFacts.borders)
      ? quickFacts.borders.map((border) => String(border).trim()).filter(Boolean)
      : [],
    flagUrl: typeof quickFacts.flag_url === 'string' ? quickFacts.flag_url.trim() : '',
  };

  const hasAnyFacts = Boolean(
    normalizedQuickFacts.capital
      || normalizedQuickFacts.languages.length
      || normalizedQuickFacts.timezones.length
      || normalizedQuickFacts.currency.code
      || normalizedQuickFacts.currency.name
      || normalizedQuickFacts.currency.symbol
      || normalizedQuickFacts.drivingSide
      || normalizedQuickFacts.idd
      || normalizedQuickFacts.borders.length
      || normalizedQuickFacts.flagUrl,
  );

  return hasAnyFacts ? normalizedQuickFacts : null;
}

function buildCountrySummary(country, featuredDestinationCards) {
  if (country.summary) {
    return country.summary;
  }

  if (featuredDestinationCards.length > 0) {
    return `${country.name} is currently best explored through destination-level profiles such as ${humanizeList(
      featuredDestinationCards.slice(0, 3).map((destination) => destination.name),
    )}, rather than one flattened country-wide climate label.`;
  }

  return `Country-level guidance for ${country.name} is being prepared. For now, SeasonScout treats the country as a collection of destination-level travel profiles.`;
}

function buildCountryClimateGuidance(country, featuredDestinationCards) {
  if (country.seasonal_overview) {
    return country.seasonal_overview;
  }

  if (featuredDestinationCards.length >= 2) {
    return `Travel conditions vary across ${country.name}, so compare featured destinations such as ${humanizeList(
      featuredDestinationCards.slice(0, 3).map((destination) => `${destination.name} (${destination.bestWindow})`),
    )} instead of relying on one national climate pattern.`;
  }

  if (featuredDestinationCards.length === 1) {
    return `${country.name} is better planned destination by destination. Start with ${featuredDestinationCards[0].name}'s climate profile below and expand to more regions as the curated catalog grows.`;
  }

  return `${country.name} does not use one synthetic climate forecast here. Country-level guidance remains qualitative until more curated destination profiles are available.`;
}

function buildCountryOverviewItems(country, publishedDestinationCount) {
  return [
    {
      label: 'Continent',
      value: country.continent || 'Country guide',
    },
    {
      label: 'Destinations',
      value: `${publishedDestinationCount} curated`,
    },
  ];
}

export function mapCountryRowToSearchResult(country) {
  const countryName = formatCountryName(country.name);

  return {
    key: `country-${country.slug}`,
    type: 'country',
    typeLabel: 'Country',
    slug: country.slug,
    name: countryName,
    subtitle: country.continent || 'Country guide',
    badge: 'Country guide',
    summary:
      country.summary ||
      country.seasonal_overview ||
      `Explore destination-led travel guidance across ${countryName}.`,
    tags: [country.continent || 'Country', 'Destination-based guidance'],
    href: `/countries/${country.slug}`,
    ctaLabel: 'View country guide',
    region: country.continent || 'Country guide',
    country: '',
    bestWindow: 'Country guide',
    climateCue: 'Destination-led planning',
    heroImageUrl: country.hero_image_url || null,
    heroImageAttribution: buildHeroImageAttribution(country),
  };
}

export function mapCountryRowToPage(country, featuredDestinationRows, publishedDestinationCount) {
  const featuredDestinations = featuredDestinationRows.map(mapDestinationRowToCard);
  const formattedCountry = {
    ...country,
    name: formatCountryName(country.name),
  };

  return {
    countryId: formattedCountry.code,
    slug: formattedCountry.slug,
    name: formattedCountry.name,
    continent: formattedCountry.continent || '',
    summary: buildCountrySummary(formattedCountry, featuredDestinations),
    heroImageUrl: formattedCountry.hero_image_url || null,
    collectionTags: toArray(formattedCountry.collection_tags),
    heroImageAttribution: buildHeroImageAttribution(formattedCountry),
    quickFacts: normalizeCountryQuickFacts(formattedCountry.quick_facts),
    climateGuidance: buildCountryClimateGuidance(formattedCountry, featuredDestinations),
    overviewItems: buildCountryOverviewItems(formattedCountry, publishedDestinationCount),
    featuredDestinations,
    publishedDestinationCount,
  };
}
