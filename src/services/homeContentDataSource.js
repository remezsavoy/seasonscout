import { requireSupabaseClient } from '../lib/supabaseClient';
import { createSupabaseServiceError } from './serviceError';

async function runMaybeSingleQuery(query, errorMessage) {
  const { data, error } = await query;

  if (error) {
    throw createSupabaseServiceError(errorMessage, error);
  }

  return data;
}

export async function fetchSiteContentRowByKey(key) {
  const client = requireSupabaseClient();

  return runMaybeSingleQuery(
    client
      .from('site_content')
      .select('key, content, is_published')
      .eq('key', key)
      .eq('is_published', true)
      .maybeSingle(),
    'Unable to load site content.',
  );
}
