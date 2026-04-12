import { hasSupabaseClient } from '../lib/supabaseClient';
import {
  fetchCountryFeaturedDestinationRows,
  fetchCountryPublishedDestinationCount,
  fetchCountryRowBySlug,
  searchCountryRows,
  fetchCountriesByCollection,
} from './countryDataSource';
import { mapCountryRowToPage, mapCountryRowToSearchResult } from './countryMappers';
import { countryFeaturedDestinationSlugs, countryShells, destinationShells } from './mockData';
import { reviewsService } from './reviewsService';

function withLatency(data) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), 120);
  });
}

function getMockFeaturedDestinationRows(countrySlug) {
  return (countryFeaturedDestinationSlugs[countrySlug] ?? [])
    .map((slug) => destinationShells[slug])
    .filter(Boolean);
}

export const countriesService = {
  async searchCountries(query) {
    if (hasSupabaseClient()) {
      const rows = await searchCountryRows(query);
      return rows.map(mapCountryRowToSearchResult);
    }

    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      return withLatency([]);
    }

    const rows = Object.values(countryShells).filter((country) =>
      `${country.name} ${country.continent ?? ''}`.toLowerCase().includes(trimmedQuery),
    );

    return withLatency(rows.map(mapCountryRowToSearchResult));
  },

  async getCountryPageData(slug) {
    if (hasSupabaseClient()) {
      const country = await fetchCountryRowBySlug(slug);
      const [featuredDestinationRows, publishedDestinationCount, reviews] = await Promise.all([
        fetchCountryFeaturedDestinationRows(country.code),
        fetchCountryPublishedDestinationCount(country.code),
        reviewsService.getApprovedCountryReviews(country.code),
      ]);

      return {
        ...mapCountryRowToPage(country, featuredDestinationRows, publishedDestinationCount),
        reviews,
      };
    }

    const country = countryShells[slug];

    if (!country || !country.is_published) {
      throw new Error('Country not found.');
    }

    const featuredDestinationRows = getMockFeaturedDestinationRows(slug);

    return withLatency(
      {
        ...mapCountryRowToPage(country, featuredDestinationRows, featuredDestinationRows.length),
        reviews: [],
      },
    );
  },

  async getCountriesByCollection(collectionTags) {
    if (hasSupabaseClient()) {
      const rows = await fetchCountriesByCollection(collectionTags);

      return rows.map(mapCountryRowToSearchResult);
    }

    const normalizedTags = Array.isArray(collectionTags) ? collectionTags : [collectionTags];
    const activeTags = normalizedTags.filter(Boolean);

    if (activeTags.length === 0) {
      return withLatency([]);
    }

    return withLatency(
      Object.values(countryShells)
        .filter((country) => activeTags.some((tag) => country.collection_tags?.includes(tag)))
        .map(mapCountryRowToSearchResult),
    );
  },
};
