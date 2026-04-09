import { hasSupabaseClient } from '../lib/supabaseClient';
import { fetchDestinationRowBySlug, fetchMonthlyClimateRows } from './destinationDataSource';
import { mapBestMonthNumbersToNames, mapClimateRowsToPreview } from './destinationMappers';
import { destinationShells, monthlyClimateBySlug } from './mockData';

function withLatency(data) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), 120);
  });
}

export const climateService = {
  async getClimatePreview(slug) {
    if (hasSupabaseClient()) {
      const destination = await fetchDestinationRowBySlug(slug);
      const climateRows = await fetchMonthlyClimateRows(destination.id);

      return mapClimateRowsToPreview(climateRows, destination);
    }

    const destination = destinationShells[slug];

    if (!destination) {
      throw new Error('Destination climate scaffold not found.');
    }

    return withLatency(mapClimateRowsToPreview(monthlyClimateBySlug[slug] ?? [], destination));
  },

  async getBestMonths(slug) {
    if (hasSupabaseClient()) {
      const destination = await fetchDestinationRowBySlug(slug);

      return mapBestMonthNumbersToNames(destination.best_months ?? []);
    }

    const destination = destinationShells[slug];

    if (!destination) {
      throw new Error('Destination best months scaffold not found.');
    }

    return withLatency(mapBestMonthNumbersToNames(destination.best_months ?? []));
  },

  async getSeasonalInsight(slug) {
    if (hasSupabaseClient()) {
      const destination = await fetchDestinationRowBySlug(slug);

      return (
        destination.seasonal_insight ||
        'Seasonal guidance is available, with heavier recommendation logic planned for SQL/RPC.'
      );
    }

    const destination = destinationShells[slug];

    if (!destination) {
      throw new Error('Destination seasonal insight scaffold not found.');
    }

    return withLatency(
      destination.seasonal_insight ||
        'Seasonal guidance is available, with heavier recommendation logic planned for SQL/RPC.',
    );
  },

  async listMonthlyClimate(slug) {
    if (hasSupabaseClient()) {
      const destination = await fetchDestinationRowBySlug(slug);

      return fetchMonthlyClimateRows(destination.id);
    }

    return withLatency(monthlyClimateBySlug[slug] ?? []);
  },
};
