import { mapDestinationRowToCard } from './destinationMappers';
import { buildHeroImageAttribution } from './heroImageAttribution';

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

function buildCountryOverviewItems(country, featuredDestinationCards, publishedDestinationCount) {
  return [
    {
      label: 'Continent',
      value: country.continent || 'Country guide',
    },
    {
      label: 'Published destinations',
      value: `${publishedDestinationCount} curated now`,
    },
    {
      label: 'Planning approach',
      value: featuredDestinationCards.length > 0 ? 'Destination-by-destination climate guidance' : 'Editorial overview first',
    },
  ];
}

export function mapCountryRowToSearchResult(country) {
  return {
    key: `country-${country.slug}`,
    type: 'country',
    typeLabel: 'Country',
    slug: country.slug,
    name: country.name,
    subtitle: country.continent || 'Country guide',
    badge: 'Country guide',
    summary:
      country.summary ||
      country.seasonal_overview ||
      `Explore destination-led travel guidance across ${country.name}.`,
    tags: [country.continent || 'Country', 'Destination-based guidance'],
    href: `/countries/${country.slug}`,
    ctaLabel: 'View country guide',
  };
}

export function mapCountryRowToPage(country, featuredDestinationRows, publishedDestinationCount) {
  const featuredDestinations = featuredDestinationRows.map(mapDestinationRowToCard);

  return {
    slug: country.slug,
    name: country.name,
    continent: country.continent || '',
    summary: buildCountrySummary(country, featuredDestinations),
    heroImageUrl: country.hero_image_url || null,
    heroImageAttribution: buildHeroImageAttribution(country),
    climateGuidance: buildCountryClimateGuidance(country, featuredDestinations),
    overviewItems: buildCountryOverviewItems(country, featuredDestinations, publishedDestinationCount),
    featuredDestinations,
    publishedDestinationCount,
  };
}
