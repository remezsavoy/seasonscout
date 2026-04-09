import { hasSupabaseClient } from '../lib/supabaseClient';
import { fetchDestinationRowBySlug, fetchFeaturedDestinationRows, fetchMonthlyClimateRows, searchDestinationRows } from './destinationDataSource';
import { homeContentService } from './homeContentService';
import { mapDestinationRowToCard, mapDestinationRowToPage } from './destinationMappers';
import { climateService } from './climateService';
import { homeHeroContentFallback, seasonalCollections, destinationShells, featuredDestinations } from './mockData';
import { weatherService } from './weatherService';

function withLatency(data) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), 120);
  });
}

export const destinationsService = {
  async getHomePageData() {
    if (hasSupabaseClient()) {
      const [featuredRows, homeHeroContent] = await Promise.all([
        fetchFeaturedDestinationRows(),
        homeContentService.getHomeHeroContent(),
      ]);

      return {
        featuredDestinations: featuredRows.map(mapDestinationRowToCard),
        homeHeroContent,
        seasonalCollections,
      };
    }

    return withLatency({
      featuredDestinations,
      homeHeroContent: homeHeroContentFallback,
      seasonalCollections,
    });
  },

  async searchDestinations(query) {
    if (hasSupabaseClient()) {
      const rows = await searchDestinationRows(query);

      return rows.map(mapDestinationRowToCard);
    }

    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      return withLatency(featuredDestinations);
    }

    return withLatency(
      featuredDestinations.filter((destination) =>
        `${destination.name} ${destination.country} ${destination.tags.join(' ')}`
          .toLowerCase()
          .includes(trimmedQuery),
      ),
    );
  },

  async getDestinationPageData(slug) {
    if (hasSupabaseClient()) {
      const destination = await fetchDestinationRowBySlug(slug);
      const [climateRows, weatherPreview] = await Promise.all([
        fetchMonthlyClimateRows(destination.id),
        weatherService.getWeatherPreview(slug, { destination }),
      ]);

      return mapDestinationRowToPage(destination, climateRows, weatherPreview);
    }

    const destination = destinationShells[slug];

    if (!destination) {
      throw new Error('Destination not found.');
    }

    const [climateRows, weatherPreview] = await Promise.all([
      climateService.listMonthlyClimate(slug),
      weatherService.getWeatherPreview(slug, { destination }),
    ]);

    return mapDestinationRowToPage(destination, climateRows, weatherPreview);
  },
};
