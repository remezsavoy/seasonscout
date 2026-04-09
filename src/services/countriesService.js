import { hasSupabaseClient } from '../lib/supabaseClient';
import {
  fetchCountryFeaturedDestinationRows,
  fetchCountryPublishedDestinationCount,
  fetchCountryRowBySlug,
  searchCountryRows,
} from './countryDataSource';
import { mapCountryRowToPage, mapCountryRowToSearchResult } from './countryMappers';
import { countryFeaturedDestinationSlugs, countryShells, destinationShells } from './mockData';

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
      const [featuredDestinationRows, publishedDestinationCount] = await Promise.all([
        fetchCountryFeaturedDestinationRows(country.code),
        fetchCountryPublishedDestinationCount(country.code),
      ]);

      return mapCountryRowToPage(country, featuredDestinationRows, publishedDestinationCount);
    }

    const country = countryShells[slug];

    if (!country || !country.is_published) {
      throw new Error('Country not found.');
    }

    const featuredDestinationRows = getMockFeaturedDestinationRows(slug);

    return withLatency(
      mapCountryRowToPage(country, featuredDestinationRows, featuredDestinationRows.length),
    );
  },
};
