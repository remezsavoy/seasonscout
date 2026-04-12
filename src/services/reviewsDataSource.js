import { requireSupabaseClient } from '../lib/supabaseClient';
import { createSupabaseServiceError } from './serviceError';

const reviewFields = [
  'id',
  'created_at',
  'user_name',
  'rating',
  'content',
  'visit_month',
  'status',
  'country_id',
  'destination_id',
].join(', ');

const adminReviewFields = [
  reviewFields,
  'country:countries!reviews_country_id_fkey(code, name, slug)',
  'destination:destinations!reviews_destination_id_fkey(id, name, slug, country_code)',
].join(', ');

async function runQuery(query, errorMessage) {
  const { data, error } = await query;

  if (error) {
    throw createSupabaseServiceError(errorMessage, error);
  }

  return data;
}

export async function fetchApprovedCountryReviews(countryId) {
  const client = requireSupabaseClient();

  return runQuery(
    client
      .from('reviews')
      .select(reviewFields)
      .eq('country_id', countryId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    'Unable to load country reviews.',
  );
}

export async function fetchApprovedDestinationReviews(destinationId) {
  const client = requireSupabaseClient();

  return runQuery(
    client
      .from('reviews')
      .select(reviewFields)
      .eq('destination_id', destinationId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    'Unable to load destination reviews.',
  );
}

export async function insertReview(payload) {
  const client = requireSupabaseClient();

  return runQuery(
    client
      .from('reviews')
      .insert(payload)
      .select(reviewFields)
      .single(),
    'Unable to submit your review.',
  );
}

export async function fetchAdminReviews(filter = 'pending') {
  const client = requireSupabaseClient();
  let query = client
    .from('reviews')
    .select(adminReviewFields)
    .order('created_at', { ascending: false });

  if (filter === 'pending') {
    query = query.eq('status', 'pending');
  }

  return runQuery(query, 'Unable to load admin reviews.');
}

export async function fetchPendingReviewCount() {
  const client = requireSupabaseClient();
  const { count, error } = await client
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    throw createSupabaseServiceError('Unable to load the pending review count.', error);
  }

  return count ?? 0;
}

export async function approveReview(reviewId) {
  const client = requireSupabaseClient();

  return runQuery(
    client
      .from('reviews')
      .update({ status: 'approved' })
      .eq('id', reviewId)
      .select(reviewFields)
      .single(),
    'Unable to approve the selected review.',
  );
}

export async function deleteReview(reviewId) {
  const client = requireSupabaseClient();

  return runQuery(
    client
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .select('id')
      .single(),
    'Unable to delete the selected review.',
  );
}
