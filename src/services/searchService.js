import { countriesService } from './countriesService';
import { destinationsService } from './destinationsService';

function mapDestinationSearchResult(destination) {
  return {
    key: `destination-${destination.slug}`,
    type: 'destination',
    typeLabel: 'Destination',
    slug: destination.slug,
    name: destination.name,
    subtitle: destination.country,
    badge: destination.bestWindow,
    summary: destination.summary,
    tags: [...(destination.tags ?? []), destination.climateCue].filter(Boolean).slice(0, 4),
    href: `/destinations/${destination.slug}`,
    ctaLabel: 'View destination details',
    region: destination.region,
    country: destination.country,
    bestWindow: destination.bestWindow,
    climateCue: destination.climateCue,
    heroImageUrl: destination.heroImageUrl ?? null,
    heroImageAttribution: destination.heroImageAttribution ?? null,
  };
}

export const searchService = {
  async searchPlaces(query) {
    const [destinationResults, countryResults] = await Promise.all([
      destinationsService.searchDestinations(query),
      countriesService.searchCountries(query),
    ]);

    return [
      ...destinationResults.map(mapDestinationSearchResult),
      ...countryResults,
    ];
  },

  async getPlacesByCollection(collectionTags) {
    const [destinationResults, countryResults] = await Promise.all([
      destinationsService.getDestinationsByCollection(collectionTags),
      countriesService.getCountriesByCollection(collectionTags),
    ]);

    return [
      ...destinationResults.map(mapDestinationSearchResult),
      ...countryResults,
    ];
  },
};
