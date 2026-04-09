import { requireSupabaseClient } from '../lib/supabaseClient';
import { createServiceError, createSupabaseServiceError } from './serviceError';

const countryFields = [
  'code',
  'slug',
  'name',
  'continent',
  'summary',
  'hero_image_url',
  'hero_image_source_name',
  'hero_image_source_url',
  'hero_image_attribution_name',
  'hero_image_attribution_url',
  'seasonal_overview',
  'is_published',
].join(', ');

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
  'hero_image_url',
  'hero_image_source_name',
  'hero_image_source_url',
  'hero_image_attribution_name',
  'hero_image_attribution_url',
  'best_months',
  'travel_tags',
  'seasonal_insight',
  'featured_rank',
  'is_published',
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

export async function searchCountryRows(query, limit = 6) {
  const client = requireSupabaseClient();
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  return runQuery(
    client
      .from('countries')
      .select(countryFields)
      .eq('is_published', true)
      .ilike('name', `%${escapeForLike(trimmedQuery)}%`)
      .order('name')
      .limit(limit),
    'Unable to search countries.',
  );
}

export async function fetchCountryRowBySlug(slug) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('countries')
    .select(countryFields)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    throw createSupabaseServiceError('Unable to load the country record.', error);
  }

  if (!data) {
    throw createServiceError('Country not found.');
  }

  return data;
}

export async function fetchCountryFeaturedDestinationRows(countryCode, limit = 6) {
  const client = requireSupabaseClient();

  const featuredRows = await runQuery(
    client
      .from('country_featured_destinations')
      .select('destination_id, rank')
      .eq('country_code', countryCode)
      .order('rank', { ascending: true })
      .limit(limit),
    'Unable to load featured destinations for this country.',
  );

  if (featuredRows.length > 0) {
    const destinationRows = await runQuery(
      client
        .from('destinations')
        .select(destinationFields)
        .in(
          'id',
          featuredRows.map((row) => row.destination_id),
        )
        .eq('is_published', true),
      'Unable to load featured destination details for this country.',
    );

    const destinationsById = new Map(destinationRows.map((destination) => [destination.id, destination]));

    return featuredRows
      .map((row) => destinationsById.get(row.destination_id))
      .filter(Boolean);
  }

  return runQuery(
    client
      .from('destinations')
      .select(destinationFields)
      .eq('country_code', countryCode)
      .eq('is_published', true)
      .order('featured_rank', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
      .limit(limit),
    'Unable to load country destinations.',
  );
}

export async function fetchCountryPublishedDestinationCount(countryCode) {
  const client = requireSupabaseClient();
  const { count, error } = await client
    .from('destinations')
    .select('id', { count: 'exact', head: true })
    .eq('country_code', countryCode)
    .eq('is_published', true);

  if (error) {
    throw createSupabaseServiceError('Unable to count published destinations for this country.', error);
  }

  return count ?? 0;
}
