import { requireSupabaseClient } from '../lib/supabaseClient';
import { createServiceError, createSupabaseServiceError } from './serviceError';

const destinationFields = [
  'id',
  'slug',
  'name',
  'country',
  'country_code',
  'continent',
  'latitude',
  'longitude',
  'timezone',
  'summary',
  'collection_tags',
  'hero_image_url',
  'hero_image_source_name',
  'hero_image_source_url',
  'hero_image_attribution_name',
  'hero_image_attribution_url',
  'best_months',
  'travel_tags',
  'top_landmarks',
  'peak_season',
  'seasonal_insight',
  'featured_rank',
  'is_published',
].join(', ');

const monthlyClimateFields = [
  'id',
  'destination_id',
  'month',
  'avg_high_c',
  'avg_low_c',
  'avg_precip_mm',
  'avg_humidity',
  'sunshine_hours',
  'comfort_score',
  'recommendation_label',
  'source',
  'last_updated',
].join(', ');

function escapeForLike(value) {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

async function runQuery(query, errorMessage) {
  const { data, error } = await query;

  if (error) {
    throw createSupabaseServiceError(errorMessage, error);
  }

  return data;
}

export async function fetchFeaturedDestinationRows(limit = 6) {
  const client = requireSupabaseClient();

  const featuredRows = await runQuery(
    client
      .from('destinations')
      .select(destinationFields)
      .eq('is_published', true)
      .not('featured_rank', 'is', null)
      .order('featured_rank', { ascending: true, nullsFirst: false })
      .limit(limit),
    'Unable to load featured destinations.',
  );

  if (featuredRows.length > 0) {
    return featuredRows;
  }

  return runQuery(
    client.from('destinations').select(destinationFields).eq('is_published', true).order('name').limit(limit),
    'Unable to load published destinations.',
  );
}

export async function searchDestinationRows(query, limit = 12) {
  const client = requireSupabaseClient();
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return fetchFeaturedDestinationRows(Math.min(limit, 6));
  }

  return runQuery(
    client
      .from('destinations')
      .select(destinationFields)
      .eq('is_published', true)
      .ilike('name', `%${escapeForLike(trimmedQuery)}%`)
      .order('featured_rank', { ascending: true, nullsFirst: false })
      .limit(limit),
    'Unable to search destinations.',
  );
}

export async function fetchDestinationRowBySlug(slug) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('destinations')
    .select(destinationFields)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    throw createSupabaseServiceError('Unable to load the destination record.', error);
  }

  if (!data) {
    throw createServiceError('Destination not found.');
  }

  return data;
}

export async function fetchExploreCalendarDestinationRows() {
  const client = requireSupabaseClient();

  return runQuery(
    client
      .from('destinations')
      .select(destinationFields)
      .eq('is_published', true)
      .eq('enrichment_status', 'enriched')
      .order('name', { ascending: true }),
    'Unable to load explore calendar destinations.',
  );
}

export async function fetchAllPublishedDestinationRows(limit = 60) {
  const client = requireSupabaseClient();

  return runQuery(
    client
      .from('destinations')
      .select(destinationFields)
      .eq('is_published', true)
      .order('featured_rank', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
      .limit(limit),
    'Unable to load published destinations.',
  );
}

function normalizeCollectionTags(collectionTags) {
  const values = Array.isArray(collectionTags) ? collectionTags : [collectionTags];

  return [...new Set(
    values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean),
  )];
}

export async function fetchDestinationsByCollection(collectionTags, limit = 24) {
  const client = requireSupabaseClient();
  const normalizedTags = normalizeCollectionTags(collectionTags);

  if (normalizedTags.length === 0) {
    return fetchAllPublishedDestinationRows(limit);
  }

  let query = client
    .from('destinations')
    .select(destinationFields)
    .eq('is_published', true);

  query = normalizedTags.length === 1
    ? query.contains('collection_tags', [normalizedTags[0]])
    : query.overlaps('collection_tags', normalizedTags);

  return runQuery(
    query
      .order('name', { ascending: true })
      .limit(limit),
    `Unable to load destinations for collection: ${normalizedTags.join(', ')}`,
  );
}

export async function fetchMonthlyClimateRows(destinationId) {
  const client = requireSupabaseClient();

  return runQuery(
    client
      .from('monthly_climate')
      .select(monthlyClimateFields)
      .eq('destination_id', destinationId)
      .order('month', { ascending: true }),
    'Unable to load monthly climate data.',
  );
}

export async function fetchFavoriteDestinationRows(userId) {
  const client = requireSupabaseClient();

  const favoriteRows = await runQuery(
    client
      .from('favorites')
      .select('destination_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    'Unable to load favorites.',
  );

  if (favoriteRows.length === 0) {
    return [];
  }

  const destinationRows = await runQuery(
    client
      .from('destinations')
      .select(destinationFields)
      .in(
        'id',
        favoriteRows.map((favorite) => favorite.destination_id),
      )
      .eq('is_published', true),
    'Unable to load favorite destination details.',
  );

  const destinationsById = new Map(destinationRows.map((destination) => [destination.id, destination]));

  return favoriteRows
    .map((favorite) => {
      const destination = destinationsById.get(favorite.destination_id);

      if (!destination) {
        return null;
      }

      return {
        ...destination,
        favorite_created_at: favorite.created_at,
      };
    })
    .filter(Boolean);
}
