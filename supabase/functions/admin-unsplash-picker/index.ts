import { createClient } from 'jsr:@supabase/supabase-js@2';

import { searchUnsplashPhotos } from '../compose-country-full/unsplash.ts';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-seasonscout-ingestion-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SearchPayload = {
  action: 'search';
  query?: string;
};

type AssignPayload = {
  action: 'assign';
  entity_type?: 'country' | 'destination';
  country_code?: string | null;
  destination_id?: string | null;
  photo?: {
    id?: string;
    alt?: string | null;
    description?: string | null;
    previewUrl?: string;
    heroImageUrl?: string;
    photoPageUrl?: string | null;
    photographerName?: string | null;
    photographerUrl?: string | null;
    sourceName?: string | null;
    sourceUrl?: string | null;
  };
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...corsHeaders,
    },
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeText(value: unknown, fieldName: string) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue || null;
}

function getBearerToken(request: Request) {
  const authorizationHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Admin access requires a bearer token.');
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

async function requireAuthenticatedUser(supabase: ReturnType<typeof createClient>, request: Request) {
  const token = getBearerToken(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Admin access requires an authenticated user.');
  }

  return user;
}

function parseBody(body: string) {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Invalid JSON request body.');
  }
}

function parseSearchPayload(payload: SearchPayload) {
  return {
    action: 'search' as const,
    query: normalizeText(payload.query, 'query'),
  };
}

function parseAssignPayload(payload: AssignPayload) {
  const entityType = normalizeText(payload.entity_type, 'entity_type').toLowerCase();

  if (entityType !== 'country' && entityType !== 'destination') {
    throw new Error('entity_type must be country or destination.');
  }

  const photo = payload.photo ?? {};
  const photoId = normalizeText(photo.id, 'photo.id');
  const heroImageUrl = normalizeText(photo.heroImageUrl, 'photo.heroImageUrl');

  return {
    action: 'assign' as const,
    entityType,
    countryCode: entityType === 'country' ? normalizeText(payload.country_code, 'country_code').toUpperCase() : null,
    destinationId: entityType === 'destination' ? normalizeText(payload.destination_id, 'destination_id') : null,
    photo: {
      id: photoId,
      alt: normalizeOptionalText(photo.alt),
      description: normalizeOptionalText(photo.description),
      heroImageUrl,
      photoPageUrl: normalizeOptionalText(photo.photoPageUrl),
      photographerName: normalizeOptionalText(photo.photographerName),
      photographerUrl: normalizeOptionalText(photo.photographerUrl),
      sourceName: normalizeOptionalText(photo.sourceName) ?? 'Unsplash',
      sourceUrl: normalizeOptionalText(photo.sourceUrl) ?? normalizeOptionalText(photo.photoPageUrl),
    },
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, {
      error: 'Method not allowed.',
      allowed_method: 'POST',
    });
  }

  try {
    const ingestionSecret = requireEnv('SEASONSCOUT_INGESTION_SECRET');
    const providedSecret = request.headers.get('x-seasonscout-ingestion-secret');

    if (providedSecret !== ingestionSecret) {
      return jsonResponse(401, { error: 'Unauthorized.' });
    }

    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    await requireAuthenticatedUser(supabase, request);

    const payload = parseBody(await request.text()) as SearchPayload | AssignPayload;

    if (payload.action === 'search') {
      const searchPayload = parseSearchPayload(payload);
      const results = await searchUnsplashPhotos({
        query: searchPayload.query,
        unsplashAccessKey: requireEnv('UNSPLASH_ACCESS_KEY'),
        perPage: 9,
      });

      return jsonResponse(200, {
        status: 'ok',
        results,
      });
    }

    if (payload.action === 'assign') {
      const assignPayload = parseAssignPayload(payload);
      const updateFields = {
        hero_image_url: assignPayload.photo.heroImageUrl,
        hero_image_source_name: assignPayload.photo.sourceName,
        hero_image_source_url: assignPayload.photo.sourceUrl,
        hero_image_attribution_name: assignPayload.photo.photographerName,
        hero_image_attribution_url: assignPayload.photo.photographerUrl,
      };

      if (assignPayload.entityType === 'country') {
        const { data, error } = await supabase
          .from('countries')
          .update(updateFields)
          .eq('code', assignPayload.countryCode)
          .select(
            'code, hero_image_url, hero_image_source_name, hero_image_source_url, hero_image_attribution_name, hero_image_attribution_url, updated_at',
          )
          .single();

        if (error) {
          throw error;
        }

        return jsonResponse(200, {
          status: 'updated',
          record: data,
        });
      }

      const { data, error } = await supabase
        .from('destinations')
        .update(updateFields)
        .eq('id', assignPayload.destinationId)
        .select(
          'id, hero_image_url, hero_image_source_name, hero_image_source_url, hero_image_attribution_name, hero_image_attribution_url, updated_at',
        )
        .single();

      if (error) {
        throw error;
      }

      return jsonResponse(200, {
        status: 'updated',
        record: data,
      });
    }

    return jsonResponse(400, { error: 'action must be search or assign.' });
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : 'Admin Unsplash picker request failed.',
    });
  }
});
