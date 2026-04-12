import { env } from '../app/config/env';
import { requireSupabaseClient } from '../lib/supabaseClient';
import { createServiceError, createSupabaseServiceError } from './serviceError';

function requireAdminClient() {
  return requireSupabaseClient();
}

function normalizeCountryStatus(country) {
  if (country.is_published) {
    return 'published';
  }

  return country.enrichment_status || 'pending';
}

async function getCurrentSession(supabase) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw createSupabaseServiceError('Unable to restore the current auth session for admin access.', error);
  }

  if (!session?.access_token) {
    throw createServiceError('Admin access requires an authenticated session.');
  }

  return session;
}

async function callAdminEdgeFunction(functionName, payload) {
  const supabase = requireAdminClient();
  const session = await getCurrentSession(supabase);

  if (!env.supabaseUrl) {
    throw createServiceError('Supabase URL is not configured for Edge Function requests.');
  }

  if (!env.ingestionSecret) {
    throw createServiceError('VITE_INGESTION_SECRET is required for admin generation requests.');
  }

  const response = await fetch(`${env.supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      'x-seasonscout-ingestion-secret': env.ingestionSecret,
    },
    body: JSON.stringify(payload),
  });

  let responseBody = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    throw createServiceError(responseBody?.error || 'Admin generation request failed.');
  }

  return responseBody;
}

async function callComposeCountryFull(payload) {
  return callAdminEdgeFunction('compose-country-full', payload);
}

export const adminService = {
  async getCountries() {
    const supabase = requireAdminClient();
    const { data, error } = await supabase.rpc('admin_get_all_countries');

    if (error) {
      throw createSupabaseServiceError('Unable to load admin country data.', error);
    }

    return (data ?? []).map((country) => ({
      ...country,
      status: normalizeCountryStatus(country),
    }));
  },

  async getDestinations() {
    const supabase = requireAdminClient();
    const { data, error } = await supabase.rpc('admin_get_all_destinations');

    if (error) {
      throw createSupabaseServiceError('Unable to load admin destination data.', error);
    }

    return data ?? [];
  },

  async getPendingReviewCount() {
    const supabase = requireAdminClient();
    await getCurrentSession(supabase);

    const { count, error } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      throw createSupabaseServiceError('Unable to load the pending review count.', error);
    }

    return count ?? 0;
  },

  async getTopRatedDestination() {
    const supabase = requireAdminClient();
    await getCurrentSession(supabase);

    const { data, error } = await supabase
      .from('reviews')
      .select('destination_id, rating, destination:destinations!reviews_destination_id_fkey(name, slug)')
      .not('destination_id', 'is', null)
      .eq('status', 'approved');

    if (error) {
      throw createSupabaseServiceError('Unable to load top-rated destination data.', error);
    }

    const ratingsByDestinationId = (data ?? []).reduce((accumulator, row) => {
      if (!row.destination_id || !row.destination?.name || !row.destination?.slug) {
        return accumulator;
      }

      const currentEntry = accumulator.get(row.destination_id) ?? {
        name: row.destination.name,
        slug: row.destination.slug,
        reviewCount: 0,
        totalRating: 0,
      };

      currentEntry.reviewCount += 1;
      currentEntry.totalRating += Number(row.rating) || 0;
      accumulator.set(row.destination_id, currentEntry);
      return accumulator;
    }, new Map());

    const topEntry = [...ratingsByDestinationId.values()]
      .map((entry) => ({
        ...entry,
        averageRating: entry.reviewCount > 0 ? entry.totalRating / entry.reviewCount : 0,
      }))
      .sort((left, right) => {
        if (right.averageRating !== left.averageRating) {
          return right.averageRating - left.averageRating;
        }

        if (right.reviewCount !== left.reviewCount) {
          return right.reviewCount - left.reviewCount;
        }

        return left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
      })[0];

    return topEntry ?? null;
  },

  async generateCountry({ countryName, maxDestinations }) {
    return callComposeCountryFull({
      country: countryName,
      max_destinations: maxDestinations,
      allow_non_pending: true,
      overwrite_existing: true,
    });
  },

  async regenerateCountry({ countryName, maxDestinations, skipDestinations = false }) {
    return callComposeCountryFull({
      country: countryName,
      max_destinations: maxDestinations,
      overwrite_existing: true,
      allow_non_pending: true,
      skipDestinations,
    });
  },

  async regenerateDestination(destinationId) {
    return callComposeCountryFull({
      action: 'regenerate_destination',
      destination_id: String(destinationId).trim(),
      overwrite_existing: true,
    });
  },

  async searchUnsplashImages(query) {
    const responseBody = await callAdminEdgeFunction('admin-unsplash-picker', {
      action: 'search',
      query: String(query ?? '').trim(),
    });

    return responseBody?.results ?? [];
  },

  async updateHeroImage({ entityType, countryCode, destinationId, photo }) {
    const responseBody = await callAdminEdgeFunction('admin-unsplash-picker', {
      action: 'assign',
      entity_type: entityType,
      country_code: countryCode ? String(countryCode).trim().toUpperCase() : null,
      destination_id: destinationId ? String(destinationId).trim() : null,
      photo,
    });

    return responseBody?.record ?? null;
  },

  async deleteDestination(destinationId) {
    const supabase = requireAdminClient();
    await getCurrentSession(supabase);

    const { data, error } = await supabase
      .from('destinations')
      .delete()
      .eq('id', destinationId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw createSupabaseServiceError('Unable to delete the selected destination.', error);
    }

    return data;
  },

  async deleteCountry(countryCode) {
    const supabase = requireAdminClient();
    const session = await getCurrentSession(supabase);

    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      throw createServiceError('Supabase browser environment variables are not configured for admin delete requests.');
    }

    const response = await fetch(`${env.supabaseUrl}/rest/v1/rpc/admin_delete_country`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        p_country_code: String(countryCode).trim().toUpperCase(),
      }),
    });

    let responseBody = null;

    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      throw createServiceError(
        responseBody?.message
          || responseBody?.error
          || responseBody?.hint
          || 'Unable to delete the selected country.',
      );
    }

    return responseBody;
  },
};
