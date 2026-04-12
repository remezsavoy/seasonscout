import { hasSupabaseClient } from '../lib/supabaseClient';
import {
  fetchAllPublishedDestinationRows,
  fetchDestinationRowBySlug,
  fetchDestinationsByCollection,
  fetchExploreCalendarDestinationRows,
  fetchFeaturedDestinationRows,
  fetchMonthlyClimateRows,
  searchDestinationRows,
} from './destinationDataSource';
import { homeContentService } from './homeContentService';
import { mapDestinationRowToCard, mapDestinationRowToExploreCalendarCard, mapDestinationRowToPage } from './destinationMappers';
import { climateService } from './climateService';
import { homeHeroContentFallback, seasonalCollections, destinationShells, featuredDestinations } from './mockData';
import { reviewsService } from './reviewsService';
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
      const [climateRows, weatherPreview, reviews] = await Promise.all([
        fetchMonthlyClimateRows(destination.id),
        weatherService.getWeatherPreview(slug, { destination }),
        reviewsService.getApprovedDestinationReviews(destination.id),
      ]);

      return {
        ...mapDestinationRowToPage(destination, climateRows, weatherPreview),
        reviews,
      };
    }

    const destination = destinationShells[slug];

    if (!destination) {
      throw new Error('Destination not found.');
    }

    const [climateRows, weatherPreview] = await Promise.all([
      climateService.listMonthlyClimate(slug),
      weatherService.getWeatherPreview(slug, { destination }),
    ]);

    return {
      ...mapDestinationRowToPage(destination, climateRows, weatherPreview),
      reviews: [],
    };
  },

  async getDestinationsByCollection(collectionTags) {
    if (hasSupabaseClient()) {
      const rows = await fetchDestinationsByCollection(collectionTags);

      return rows.map(mapDestinationRowToCard);
    }

    const normalizedTags = Array.isArray(collectionTags) ? collectionTags : [collectionTags];
    const activeTags = normalizedTags.filter(Boolean);

    if (activeTags.length === 0) {
      return withLatency(featuredDestinations);
    }

    return withLatency(
      featuredDestinations.filter((destination) =>
        activeTags.some((tag) => destination.collection_tags?.includes(tag)),
      ),
    );
  },

  async getAllDestinations() {
    if (hasSupabaseClient()) {
      const rows = await fetchAllPublishedDestinationRows();
      return rows.map(mapDestinationRowToCard);
    }

    return withLatency(featuredDestinations);
  },

  async getExploreCalendarData() {
    if (hasSupabaseClient()) {
      const rows = await fetchExploreCalendarDestinationRows();

      return rows.map(mapDestinationRowToExploreCalendarCard);
    }

    return withLatency(
      Object.values(destinationShells).map((destination) =>
        mapDestinationRowToExploreCalendarCard({
          ...destination,
          peak_season: destination.best_months?.length ? 'Apr-May' : '',
        }),
      ),
    );
  },
};
