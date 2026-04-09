import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  CURATED_DESTINATION_SEED,
  CURATED_SEED_SOURCE_NAME,
  CURATED_SEED_SOURCE_VERSION,
  MAX_CURATED_DESTINATION_BATCH,
  type CuratedDestinationSeedRow,
} from './seed.ts';

type IngestionRequestBody = {
  slugs?: string[];
};

type NormalizedSeedRow = {
  slug: string;
  name: string;
  country_code: string;
  country: string;
  continent: string;
  latitude: number;
  longitude: number;
  timezone: string;
  travel_tags: string[];
  featured_rank?: number;
};

type CountryUpsertRow = {
  code: string;
  slug: string;
  name: string;
  continent: string;
};

type DestinationUpsertRow = {
  slug: string;
  name: string;
  country_code: string;
  country: string;
  continent: string;
  latitude: number;
  longitude: number;
  timezone: string;
  travel_tags?: string[];
  featured_rank?: number;
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

const DESTINATION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: JSON_HEADERS,
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

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmedValue;
}

function normalizeSlug(value: unknown, fieldName: string) {
  const slug = normalizeText(value, fieldName).toLowerCase();

  if (!DESTINATION_SLUG_PATTERN.test(slug)) {
    throw new Error(`${fieldName} must be lowercase kebab-case.`);
  }

  return slug;
}

function normalizeCountryCode(value: unknown, fieldName: string) {
  const countryCode = normalizeText(value, fieldName).toUpperCase();

  if (!COUNTRY_CODE_PATTERN.test(countryCode)) {
    throw new Error(`${fieldName} must be a valid ISO alpha-2 code.`);
  }

  return countryCode;
}

function normalizeCoordinate(value: unknown, fieldName: string, min: number, max: number) {
  const coordinate = Number(value);

  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    throw new Error(`${fieldName} must be a number between ${min} and ${max}.`);
  }

  return Number(coordinate.toFixed(5));
}

function normalizeFeaturedRank(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const featuredRank = Number(value);

  if (!Number.isInteger(featuredRank) || featuredRank < 1) {
    throw new Error('featured_rank must be a positive integer when provided.');
  }

  return featuredRank;
}

function normalizeTravelTags(value: unknown) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error('travel_tags must be an array when provided.');
  }

  return [...new Set(
    value
      .map((tag) => normalizeText(tag, 'travel_tags item'))
      .map((tag) => tag.slice(0, 40)),
  )];
}

function normalizeSeedRow(row: CuratedDestinationSeedRow, index: number): NormalizedSeedRow {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    throw new Error(`Seed row ${index + 1} must be an object.`);
  }

  return {
    slug: normalizeSlug(row.slug, `seed row ${index + 1} slug`),
    name: normalizeText(row.name, `seed row ${index + 1} name`),
    country_code: normalizeCountryCode(row.country_code, `seed row ${index + 1} country_code`),
    country: normalizeText(row.country, `seed row ${index + 1} country`),
    continent: normalizeText(row.continent, `seed row ${index + 1} continent`),
    latitude: normalizeCoordinate(row.latitude, `seed row ${index + 1} latitude`, -90, 90),
    longitude: normalizeCoordinate(row.longitude, `seed row ${index + 1} longitude`, -180, 180),
    timezone: normalizeText(row.timezone, `seed row ${index + 1} timezone`),
    travel_tags: normalizeTravelTags(row.travel_tags),
    featured_rank: normalizeFeaturedRank(row.featured_rank),
  };
}

function validateNormalizedSeed(rows: NormalizedSeedRow[]) {
  const seenSlugs = new Set<string>();
  const countriesByCode = new Map<string, { name: string; continent: string }>();

  for (const row of rows) {
    if (seenSlugs.has(row.slug)) {
      throw new Error(`Duplicate destination slug found in curated seed: ${row.slug}`);
    }

    seenSlugs.add(row.slug);

    const existingCountry = countriesByCode.get(row.country_code);

    if (!existingCountry) {
      countriesByCode.set(row.country_code, {
        name: row.country,
        continent: row.continent,
      });
      continue;
    }

    if (existingCountry.name !== row.country || existingCountry.continent !== row.continent) {
      throw new Error(
        `Country code ${row.country_code} has inconsistent country metadata in the curated seed.`,
      );
    }
  }
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');

  return slug || 'unknown';
}

function buildCountryRows(rows: NormalizedSeedRow[]) {
  const uniqueCountries = new Map<string, CountryUpsertRow & { baseSlug: string }>();

  for (const row of rows) {
    if (uniqueCountries.has(row.country_code)) {
      continue;
    }

    uniqueCountries.set(row.country_code, {
      code: row.country_code,
      slug: '',
      baseSlug: slugify(row.country),
      name: row.country,
      continent: row.continent,
    });
  }

  const slugCounts = new Map<string, number>();

  for (const country of uniqueCountries.values()) {
    slugCounts.set(country.baseSlug, (slugCounts.get(country.baseSlug) ?? 0) + 1);
  }

  return [...uniqueCountries.values()].map(({ baseSlug, ...country }) => ({
    ...country,
    slug: slugCounts.get(baseSlug) === 1 ? baseSlug : `${baseSlug}-${country.code.toLowerCase()}`,
  }));
}

function buildDestinationRows(rows: NormalizedSeedRow[]) {
  return rows.map<DestinationUpsertRow>((row) => {
    const destination: DestinationUpsertRow = {
      slug: row.slug,
      name: row.name,
      country_code: row.country_code,
      country: row.country,
      continent: row.continent,
      latitude: row.latitude,
      longitude: row.longitude,
      timezone: row.timezone,
    };

    if (row.travel_tags.length > 0) {
      destination.travel_tags = row.travel_tags;
    }

    if (row.featured_rank !== undefined) {
      destination.featured_rank = row.featured_rank;
    }

    return destination;
  });
}

function buildSnapshotPayload(row: NormalizedSeedRow, countrySlug: string) {
  return {
    seed_version: CURATED_SEED_SOURCE_VERSION,
    import_mode: 'curated_seed_only',
    country: {
      code: row.country_code,
      slug: countrySlug,
      name: row.country,
      continent: row.continent,
    },
    destination: {
      slug: row.slug,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      timezone: row.timezone,
    },
    editorial_seed: {
      travel_tags: row.travel_tags,
      featured_rank: row.featured_rank ?? null,
    },
    future_work: {
      climate_import_status: 'pending',
      climate_import_key: row.slug,
    },
  };
}

function parseRequestBody(rawBody: string): IngestionRequestBody {
  if (!rawBody.trim()) {
    return {};
  }

  const parsedBody = JSON.parse(rawBody);

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    throw new Error('Request body must be a JSON object.');
  }

  return parsedBody as IngestionRequestBody;
}

function selectSeedRows(body: IngestionRequestBody) {
  const normalizedSeed = CURATED_DESTINATION_SEED.map(normalizeSeedRow);
  validateNormalizedSeed(normalizedSeed);

  if (!body.slugs) {
    if (normalizedSeed.length > MAX_CURATED_DESTINATION_BATCH) {
      throw new Error(
        `Curated seed exceeds the allowed batch size of ${MAX_CURATED_DESTINATION_BATCH} destinations.`,
      );
    }

    return normalizedSeed;
  }

  if (!Array.isArray(body.slugs)) {
    throw new Error('slugs must be an array when provided.');
  }

  const requestedSlugs = [...new Set(body.slugs.map((slug) => normalizeSlug(slug, 'slugs item')))];
  const seedBySlug = new Map(normalizedSeed.map((row) => [row.slug, row]));
  const unknownSlugs = requestedSlugs.filter((slug) => !seedBySlug.has(slug));

  if (unknownSlugs.length > 0) {
    throw new Error(`Unknown curated seed slugs requested: ${unknownSlugs.join(', ')}`);
  }

  if (requestedSlugs.length === 0) {
    throw new Error('At least one slug must be provided when filtering the curated seed.');
  }

  if (requestedSlugs.length > MAX_CURATED_DESTINATION_BATCH) {
    throw new Error(
      `Requested ${requestedSlugs.length} destinations, which exceeds the allowed batch size of ${MAX_CURATED_DESTINATION_BATCH}.`,
    );
  }

  return requestedSlugs.map((slug) => seedBySlug.get(slug)!);
}

Deno.serve(async (request) => {
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
      return jsonResponse(401, {
        error: 'Unauthorized.',
      });
    }

    const rawBody = await request.text();
    const body = parseRequestBody(rawBody);
    const selectedRows = selectSeedRows(body);
    const countryRows = buildCountryRows(selectedRows);
    const destinationRows = buildDestinationRows(selectedRows);

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

    const runMetadata = {
      import_mode: 'curated_seed_only',
      selected_slugs: selectedRows.map((row) => row.slug),
      country_codes: countryRows.map((row) => row.code),
    };

    const { data: ingestionRun, error: ingestionRunError } = await supabase
      .from('ingestion_runs')
      .insert({
        pipeline_name: 'ingest-destination-batch',
        source_name: CURATED_SEED_SOURCE_NAME,
        source_version: CURATED_SEED_SOURCE_VERSION,
        status: 'running',
        records_seen: selectedRows.length,
        metadata: runMetadata,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (ingestionRunError) {
      throw ingestionRunError;
    }

    let countriesWrittenCount = 0;
    let destinationsWrittenCount = 0;
    let destinationSnapshotsWrittenCount = 0;

    try {
      const { error: countriesError } = await supabase.from('countries').upsert(countryRows, {
        onConflict: 'code',
      });

      if (countriesError) {
        throw countriesError;
      }

      countriesWrittenCount = countryRows.length;

      const { data: upsertedDestinations, error: destinationsError } = await supabase
        .from('destinations')
        .upsert(destinationRows, {
          onConflict: 'slug',
        })
        .select('id, slug, country_code, climate_import_status');

      if (destinationsError) {
        throw destinationsError;
      }

      destinationsWrittenCount = upsertedDestinations?.length ?? 0;

      const destinationIdBySlug = new Map(
        (upsertedDestinations ?? []).map((destination) => [destination.slug, destination.id]),
      );
      const countrySlugByCode = new Map(countryRows.map((country) => [country.code, country.slug]));

      const snapshotRows = selectedRows.map((row) => {
        const destinationId = destinationIdBySlug.get(row.slug);

        if (!destinationId) {
          throw new Error(`Missing destination id after upsert for slug ${row.slug}.`);
        }

        return {
          destination_id: destinationId,
          ingestion_run_id: ingestionRun.id,
          source_name: CURATED_SEED_SOURCE_NAME,
          external_id: `seed:${row.slug}`,
          payload: buildSnapshotPayload(row, countrySlugByCode.get(row.country_code) ?? row.country_code.toLowerCase()),
        };
      });

      const { error: snapshotsError } = await supabase
        .from('destination_source_snapshots')
        .insert(snapshotRows);

      if (snapshotsError) {
        throw snapshotsError;
      }

      destinationSnapshotsWrittenCount = snapshotRows.length;

      const { error: finishRunError } = await supabase
        .from('ingestion_runs')
        .update({
          status: 'succeeded',
          records_written: destinationsWrittenCount,
          records_failed: 0,
          metadata: {
            ...runMetadata,
            countries_written: countriesWrittenCount,
            destination_snapshots_written: destinationSnapshotsWrittenCount,
            pending_climate_import_destinations: selectedRows.map((row) => row.slug),
          },
          finished_at: new Date().toISOString(),
        })
        .eq('id', ingestionRun.id);

      if (finishRunError) {
        throw finishRunError;
      }

      return jsonResponse(200, {
        ingestion_run_id: ingestionRun.id,
        source_name: CURATED_SEED_SOURCE_NAME,
        source_version: CURATED_SEED_SOURCE_VERSION,
        countries_processed: countryRows.map((country) => ({
          code: country.code,
          slug: country.slug,
          name: country.name,
        })),
        destinations_processed: selectedRows.map((row) => ({
          slug: row.slug,
          country_code: row.country_code,
          climate_import_status: 'pending',
        })),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown ingestion failure.';
      const failedRecordCount = Math.max(selectedRows.length - destinationsWrittenCount, 0);

      await supabase
        .from('ingestion_runs')
        .update({
          status: destinationsWrittenCount > 0 || destinationSnapshotsWrittenCount > 0 ? 'partial' : 'failed',
          records_written: destinationsWrittenCount,
          records_failed: failedRecordCount,
          error_summary: errorMessage.slice(0, 2000),
          metadata: {
            ...runMetadata,
            countries_written: countriesWrittenCount,
            destination_snapshots_written: destinationSnapshotsWrittenCount,
          },
          finished_at: new Date().toISOString(),
        })
        .eq('id', ingestionRun.id);

      return jsonResponse(500, {
        error: 'Curated seed ingestion failed.',
        ingestion_run_id: ingestionRun.id,
        details: errorMessage,
      });
    }
  } catch (error) {
    const isServerMisconfiguration =
      error instanceof Error && error.message.startsWith('Missing required environment variable:');

    return jsonResponse(isServerMisconfiguration ? 500 : 400, {
      error: error instanceof Error ? error.message : 'Invalid ingestion request.',
    });
  }
});
