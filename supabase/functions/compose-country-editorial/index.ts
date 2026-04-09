import { createClient } from 'jsr:@supabase/supabase-js@2';

import { generateStructuredJson, getGeminiModel } from './gemini.ts';
import { loadEditorialPromptAssets, renderPromptTemplate } from './prompts.ts';
import {
  buildCountryDescriptionPrompt,
  COUNTRY_DESCRIPTION_PROMPT_FILE_NAME,
} from './prompts/countryDescriptionPrompt.ts';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

const COUNTRY_SELECT_FIELDS = [
  'code',
  'slug',
  'name',
  'continent',
  'summary',
  'summary_metadata',
  'hero_image_url',
  'hero_image_source_name',
  'hero_image_source_url',
  'hero_image_attribution_name',
  'hero_image_attribution_url',
  'seasonal_overview',
  'enrichment_status',
  'enrichment_metadata',
  'last_enriched_at',
  'is_published',
].join(', ');

const CONTEXT_DESTINATION_FIELDS = [
  'slug',
  'name',
  'summary',
  'travel_tags',
  'best_months',
].join(', ');

const COUNTRY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ENRICHMENT_BATCH = 3;
const SOURCE_NAME = 'country_editorial_prompt_pipeline';
const SOURCE_VERSION = '2026-03-15-v3';
const PIPELINE_NAME = 'compose-country-editorial';
const UNSPLASH_SEARCH_API_URL = 'https://api.unsplash.com/search/photos';

type EditorialContext = ReturnType<typeof buildContext>;

const COUNTRY_DESCRIPTION_BATCH_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      country_name: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
    },
    required: ['country_name', 'description'],
  },
} as const;

const COUNTRY_HERO_QUERY_BATCH_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      country_name: {
        type: 'string',
      },
      query: {
        type: 'string',
      },
    },
    required: ['country_name', 'query'],
  },
} as const;

type PreparedCountryEnrichment = {
  country: any;
  context: EditorialContext;
  nowIso: string;
  currentMetadata: Record<string, unknown>;
  currentSummary: string | null;
  currentSummaryMetadata: Record<string, unknown>;
  currentHeroImageUrl: string | null;
  currentHeroImageSourceName: string | null;
  currentHeroImageSourceUrl: string | null;
  currentHeroImageAttributionName: string | null;
  currentHeroImageAttributionUrl: string | null;
  currentHeroQuery: string | null;
  currentHeroReason: string | null;
  currentSelectedPhotoId: string | null;
  needsSummary: boolean;
  needsHeroImage: boolean;
};

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

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function normalizeObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeBoolean(value: unknown, fieldName: string, defaultValue: boolean) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} must be a boolean when provided.`);
  }

  return value;
}

function normalizeSlug(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  const slug = value.trim().toLowerCase();

  if (!COUNTRY_SLUG_PATTERN.test(slug)) {
    throw new Error(`${fieldName} must be lowercase kebab-case.`);
  }

  return slug;
}

function normalizeLimit(value: unknown) {
  if (value === undefined || value === null) {
    return 1;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_ENRICHMENT_BATCH) {
    throw new Error(`limit must be an integer between 1 and ${MAX_ENRICHMENT_BATCH}.`);
  }

  return limit;
}

function parseRequestBody(rawBody: string) {
  if (!rawBody.trim()) {
    return {};
  }

  const parsedBody = JSON.parse(rawBody);

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    throw new Error('Request body must be a JSON object.');
  }

  return parsedBody as {
    slug?: string;
    slugs?: string[];
    limit?: number;
    allow_non_pending?: boolean;
    overwrite_existing?: boolean;
  };
}

function deriveSelection(body: ReturnType<typeof parseRequestBody>) {
  const hasSlug = body.slug !== undefined;
  const hasSlugs = body.slugs !== undefined;
  const allowNonPending = normalizeBoolean(body.allow_non_pending, 'allow_non_pending', false);
  const overwriteExisting = normalizeBoolean(body.overwrite_existing, 'overwrite_existing', false);

  if (hasSlug && hasSlugs) {
    throw new Error('Provide either slug or slugs, not both.');
  }

  if (!hasSlug && !hasSlugs && (allowNonPending || overwriteExisting)) {
    throw new Error('Override flags require an explicit slug or slugs selection.');
  }

  if (hasSlug) {
    return {
      requestedSlugs: [normalizeSlug(body.slug, 'slug')],
      allowNonPending,
      overwriteExisting,
      limit: 1,
    };
  }

  if (hasSlugs) {
    if (!Array.isArray(body.slugs)) {
      throw new Error('slugs must be an array when provided.');
    }

    const requestedSlugs = [...new Set(body.slugs.map((slug) => normalizeSlug(slug, 'slugs item')))];

    if (requestedSlugs.length === 0) {
      throw new Error('At least one slug must be provided.');
    }

    if (requestedSlugs.length > MAX_ENRICHMENT_BATCH) {
      throw new Error(`Requested ${requestedSlugs.length} countries, max batch size is ${MAX_ENRICHMENT_BATCH}.`);
    }

    return {
      requestedSlugs,
      allowNonPending,
      overwriteExisting,
      limit: requestedSlugs.length,
    };
  }

  return {
    requestedSlugs: null,
    allowNonPending,
    overwriteExisting,
    limit: normalizeLimit(body.limit),
  };
}

async function fetchSelectedCountries(
  supabase: ReturnType<typeof createClient>,
  selection: ReturnType<typeof deriveSelection>,
) {
  if (selection.requestedSlugs) {
    const { data, error } = await supabase
      .from('countries')
      .select(COUNTRY_SELECT_FIELDS)
      .in('slug', selection.requestedSlugs);

    if (error) {
      throw error;
    }

    const countryBySlug = new Map((data ?? []).map((country) => [country.slug, country]));
    const missingSlugs = selection.requestedSlugs.filter((slug) => !countryBySlug.has(slug));

    if (missingSlugs.length > 0) {
      throw new Error(`Unknown country slugs requested: ${missingSlugs.join(', ')}`);
    }

    const countries = selection.requestedSlugs.map((slug) => countryBySlug.get(slug)!);

    if (!selection.allowNonPending) {
      const blockedCountries = countries.filter((country) => country.enrichment_status !== 'pending');

      if (blockedCountries.length > 0) {
        throw new Error(
          `Only pending countries can be enriched without override. Blocked slugs: ${blockedCountries
            .map((country) => `${country.slug} (${country.enrichment_status})`)
            .join(', ')}`,
        );
      }
    }

    return countries;
  }

  const { data, error } = await supabase
    .from('countries')
    .select(COUNTRY_SELECT_FIELDS)
    .eq('enrichment_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(selection.limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function fetchCountryContext(
  supabase: ReturnType<typeof createClient>,
  countryCode: string,
) {
  const { data, error } = await supabase
    .from('destinations')
    .select(CONTEXT_DESTINATION_FIELDS)
    .eq('country_code', countryCode)
    .eq('is_published', true)
    .order('featured_rank', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })
    .limit(4);

  if (error) {
    throw error;
  }

  return data ?? [];
}

function buildContext(country: any, destinations: any[]) {
  return {
    country: {
      name: country.name,
      continent: country.continent,
      existing_summary: normalizeOptionalText(country.summary),
      existing_hero_image_url: normalizeOptionalText(country.hero_image_url),
    },
    destinations: destinations.map((destination) => ({
      slug: destination.slug,
      name: destination.name,
      summary: normalizeOptionalText(destination.summary),
      travel_tags: Array.isArray(destination.travel_tags) ? destination.travel_tags : [],
      best_months: Array.isArray(destination.best_months) ? destination.best_months : [],
    })),
  };
}

function normalizeCountryKey(value: string) {
  return value.trim().toLowerCase();
}

function buildBatchContextMap(countries: { country: any; context: EditorialContext }[]) {
  return Object.fromEntries(countries.map(({ country, context }) => [
    country.name,
    {
      ...context,
      country: {
        ...context.country,
        existing_summary: null,
        existing_hero_image_url: null,
      },
    },
  ]));
}

function buildBatchArrayFormat(
  countryNames: string[],
  valueField: 'description' | 'query',
  valueFactory: (countryName: string) => string,
) {
  return JSON.stringify(
    countryNames.map((countryName) => ({
      country_name: countryName,
      [valueField]: valueFactory(countryName),
    })),
    null,
    2,
  );
}

function extractBatchValuesBySlug(
  countries: any[],
  payload: unknown,
  valueField: 'description' | 'query',
) {
  const valuesByCountryKey = new Map<string, string>();
  const returnedKeys: string[] = [];

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const normalizedEntry = normalizeObject(entry);
      const countryName = normalizeOptionalText(normalizedEntry.country_name);
      const value = normalizeOptionalText(normalizedEntry[valueField]);

      if (countryName) {
        returnedKeys.push(countryName);
      }

      if (countryName && value) {
        valuesByCountryKey.set(normalizeCountryKey(countryName), value);
      }
    }
  } else {
    const normalizedPayload = normalizeObject(payload);

    for (const [countryName, value] of Object.entries(normalizedPayload)) {
      const normalizedValue = normalizeOptionalText(value);

      returnedKeys.push(countryName);

      if (normalizedValue) {
        valuesByCountryKey.set(normalizeCountryKey(countryName), normalizedValue);
      }
    }
  }

  const valuesBySlug = new Map<string, string>();
  const missingSlugs: string[] = [];

  for (const country of countries) {
    const value = valuesByCountryKey.get(normalizeCountryKey(country.name));

    if (value) {
      valuesBySlug.set(country.slug, value);
    } else {
      missingSlugs.push(country.slug);
    }
  }

  return {
    valuesBySlug,
    returnedKeys,
    missingSlugs,
  };
}

async function generateDescriptions(options: {
  countries: { country: any; context: EditorialContext }[];
  geminiApiKey: string;
  geminiModel: string;
}) {
  if (options.countries.length === 0) {
    return new Map<string, string>();
  }

  const countryNames = options.countries.map(({ country }) => country.name);
  const dynamicPrompt = buildCountryDescriptionPrompt(countryNames);
  const result = await generateStructuredJson<Array<{
    country_name?: string;
    description?: string;
  }>>({
    apiKey: options.geminiApiKey,
    model: options.geminiModel,
    systemInstruction: dynamicPrompt.systemInstruction,
    userPrompt: [
      renderPromptTemplate(dynamicPrompt.userTemplate, {
        country_list: countryNames.join(', '),
      }),
      '',
      'Return ONLY valid JSON as an array of objects in this shape:',
      buildBatchArrayFormat(countryNames, 'description', () => '...'),
      '',
      'Country context:',
      JSON.stringify(buildBatchContextMap(options.countries), null, 2),
    ].join('\n'),
    responseSchema: COUNTRY_DESCRIPTION_BATCH_SCHEMA,
    temperature: 0.9,
    maxOutputTokens: 800,
  });

  const extracted = extractBatchValuesBySlug(
    options.countries.map(({ country }) => country),
    result.parsed,
    'description',
  );

  console.log(JSON.stringify({
    event: 'compose-country-editorial.description-batch-generated',
    country_slugs: options.countries.map(({ country }) => country.slug),
    returned_keys: extracted.returnedKeys,
    resolved_country_slugs: [...extracted.valuesBySlug.keys()],
    missing_country_slugs: extracted.missingSlugs,
    usage_metadata: result.usageMetadata,
  }));

  return extracted.valuesBySlug;
}

async function generateHeroQueries(options: {
  countries: { country: any; context: EditorialContext }[];
  geminiApiKey: string;
  geminiModel: string;
  promptAssets: Awaited<ReturnType<typeof loadEditorialPromptAssets>>;
}) {
  if (options.countries.length === 0) {
    return new Map<string, string>();
  }

  const countryNames = options.countries.map(({ country }) => country.name);
  const result = await generateStructuredJson<Array<{
    country_name?: string;
    query?: string;
  }>>({
    apiKey: options.geminiApiKey,
    model: options.geminiModel,
    systemInstruction: options.promptAssets.heroStrategy.systemInstruction,
    userPrompt: [
      renderPromptTemplate(options.promptAssets.heroStrategy.userTemplate, {
        country_list: countryNames.join(', '),
      }),
      '',
      'Return ONLY valid JSON as an array of objects in this shape:',
      buildBatchArrayFormat(countryNames, 'query', () => 'query here'),
      '',
      'Country context:',
      JSON.stringify(buildBatchContextMap(options.countries), null, 2),
    ].join('\n'),
    responseSchema: COUNTRY_HERO_QUERY_BATCH_SCHEMA,
    temperature: 0.2,
    maxOutputTokens: 400,
  });

  const extracted = extractBatchValuesBySlug(
    options.countries.map(({ country }) => country),
    result.parsed,
    'query',
  );

  console.log(JSON.stringify({
    event: 'compose-country-editorial.hero-query-batch-generated',
    country_slugs: options.countries.map(({ country }) => country.slug),
    returned_keys: extracted.returnedKeys,
    resolved_country_slugs: [...extracted.valuesBySlug.keys()],
    missing_country_slugs: extracted.missingSlugs,
    usage_metadata: result.usageMetadata,
  }));

  return extracted.valuesBySlug;
}

function buildUnsplashHeroUrl(photo: any) {
  if (photo.urls?.raw) {
    const heroUrl = new URL(photo.urls.raw);
    heroUrl.searchParams.set('w', '1600');
    heroUrl.searchParams.set('fit', 'crop');
    heroUrl.searchParams.set('auto', 'format');
    heroUrl.searchParams.set('q', '80');
    return heroUrl.toString();
  }

  return photo.urls?.regular ?? '';
}

function buildUnsplashReferralUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    url.searchParams.set('utm_source', 'SeasonScout');
    url.searchParams.set('utm_medium', 'referral');
    return url.toString();
  } catch {
    return value;
  }
}

async function fetchUnsplashHero(options: {
  country: any;
  query: string;
  unsplashAccessKey: string;
}) {
  const searchUrl = new URL(UNSPLASH_SEARCH_API_URL);
  searchUrl.searchParams.set('query', options.query);
  searchUrl.searchParams.set('orientation', 'landscape');
  searchUrl.searchParams.set('per_page', '5');
  searchUrl.searchParams.set('content_filter', 'high');

  const response = await fetch(searchUrl, {
    headers: {
      accept: 'application/json',
      authorization: `Client-ID ${options.unsplashAccessKey}`,
      'accept-version': 'v1',
    },
  });

  if (!response.ok) {
    const failureBody = await response.text();
    throw new Error(`Unsplash request failed with ${response.status}: ${failureBody.slice(0, 300)}`);
  }

  const payload = await response.json() as UnsplashSearchResponse;
  const photo = payload.results?.[0];

  if (!photo) {
    throw new Error(`Unsplash returned no photos for ${options.country.slug} using query "${options.query}".`);
  }

  const heroImageUrl = buildUnsplashHeroUrl(photo);

  if (!heroImageUrl) {
    throw new Error(`Unsplash returned a photo without a usable URL for ${options.country.slug}.`);
  }

  return {
    photoId: photo.id,
    heroImageUrl,
    sourceName: 'Unsplash',
    sourceUrl: buildUnsplashReferralUrl(photo.links?.html ?? 'https://unsplash.com'),
    photographerName: normalizeOptionalText(photo.user?.name),
    photographerUrl: buildUnsplashReferralUrl(photo.user?.links?.html ?? null),
  };
}

function pushFieldIfChanged(fieldsUpdated: string[], fieldName: string, currentValue: unknown, nextValue: unknown) {
  if (currentValue !== nextValue) {
    fieldsUpdated.push(fieldName);
  }
}

async function markCountryFailure(options: {
  supabase: ReturnType<typeof createClient>;
  country: any;
  errorMessage: string;
}) {
  await options.supabase
    .from('countries')
    .update({
      enrichment_status: 'failed',
      enrichment_metadata: {
        ...normalizeObject(options.country.enrichment_metadata),
        pipeline_name: PIPELINE_NAME,
        source_name: SOURCE_NAME,
        source_version: SOURCE_VERSION,
        last_attempted_at: new Date().toISOString(),
        last_error: options.errorMessage,
      },
    })
    .eq('code', options.country.code);
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
    const geminiApiKey = requireEnv('GEMINI_API_KEY');
    const unsplashAccessKey = requireEnv('UNSPLASH_ACCESS_KEY');
    const geminiModel = getGeminiModel();
    const promptAssets = await loadEditorialPromptAssets();
    const selection = deriveSelection(parseRequestBody(await request.text()));
    const countries = await fetchSelectedCountries(supabase, selection);

    if (countries.length === 0) {
      return jsonResponse(200, {
        message: 'No countries matched the editorial enrichment selection.',
        selected_country_count: 0,
      });
    }

    const results = [];
    let enrichedCount = 0;
    let failedCount = 0;
    const preparedCountries: PreparedCountryEnrichment[] = [];

    for (const country of countries) {
      try {
        const currentMetadata = normalizeObject(country.enrichment_metadata);
        const nowIso = new Date().toISOString();

        const { error: setEnrichingError } = await supabase
          .from('countries')
          .update({
            enrichment_status: 'enriching',
            enrichment_metadata: {
              ...currentMetadata,
              pipeline_name: PIPELINE_NAME,
              source_name: SOURCE_NAME,
              source_version: SOURCE_VERSION,
              last_attempted_at: nowIso,
              last_error: null,
            },
          })
          .eq('code', country.code);

        if (setEnrichingError) {
          throw setEnrichingError;
        }

        preparedCountries.push({
          country,
          context: buildContext(
            country,
            await fetchCountryContext(supabase, country.code),
          ),
          nowIso,
          currentMetadata,
          currentSummary: normalizeOptionalText(country.summary),
          currentSummaryMetadata: normalizeObject(country.summary_metadata),
          currentHeroImageUrl: normalizeOptionalText(country.hero_image_url),
          currentHeroImageSourceName: normalizeOptionalText(country.hero_image_source_name),
          currentHeroImageSourceUrl: normalizeOptionalText(country.hero_image_source_url),
          currentHeroImageAttributionName: normalizeOptionalText(country.hero_image_attribution_name),
          currentHeroImageAttributionUrl: normalizeOptionalText(country.hero_image_attribution_url),
          currentHeroQuery: normalizeOptionalText(currentMetadata.hero_query),
          currentHeroReason: normalizeOptionalText(currentMetadata.hero_reason),
          currentSelectedPhotoId: normalizeOptionalText(currentMetadata.selected_photo_id),
          needsSummary: !normalizeOptionalText(country.summary) || selection.overwriteExisting,
          needsHeroImage: !normalizeOptionalText(country.hero_image_url) || selection.overwriteExisting,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown country editorial failure.';
        failedCount += 1;

        await markCountryFailure({
          supabase,
          country,
          errorMessage,
        });

        results.push({
          slug: country.slug,
          status: 'failed',
          is_published: country.is_published,
          fields_updated: [],
          hero_query: null,
          selected_photo_id: null,
          error: errorMessage,
        });
      }
    }

    const countriesNeedingDescriptions = preparedCountries
      .filter((item) => item.needsSummary)
      .map((item) => ({
        country: item.country,
        context: item.context,
      }));
    const countriesNeedingHeroQueries = preparedCountries
      .filter((item) => item.needsHeroImage)
      .map((item) => ({
        country: item.country,
        context: item.context,
      }));

    const [descriptionBatchResult, heroBatchResult] = await Promise.allSettled([
      countriesNeedingDescriptions.length > 0
        ? generateDescriptions({
          countries: countriesNeedingDescriptions,
          geminiApiKey,
          geminiModel,
        })
        : Promise.resolve(new Map<string, string>()),
      countriesNeedingHeroQueries.length > 0
        ? generateHeroQueries({
          countries: countriesNeedingHeroQueries,
          geminiApiKey,
          geminiModel,
          promptAssets,
        })
        : Promise.resolve(new Map<string, string>()),
    ]);

    const descriptionsBySlug = descriptionBatchResult.status === 'fulfilled'
      ? descriptionBatchResult.value
      : new Map<string, string>();
    const heroQueriesBySlug = heroBatchResult.status === 'fulfilled'
      ? heroBatchResult.value
      : new Map<string, string>();
    const descriptionBatchError = descriptionBatchResult.status === 'rejected'
      ? (descriptionBatchResult.reason instanceof Error
        ? descriptionBatchResult.reason.message
        : 'Gemini description batch failed.')
      : null;
    const heroQueryBatchError = heroBatchResult.status === 'rejected'
      ? (heroBatchResult.reason instanceof Error
        ? heroBatchResult.reason.message
        : 'Gemini hero query batch failed.')
      : null;

    for (const preparedCountry of preparedCountries) {
      const { country } = preparedCountry;
      let heroQueryForResult = preparedCountry.currentHeroQuery;
      let selectedPhotoIdForResult = preparedCountry.currentSelectedPhotoId;

      try {
        let summary = preparedCountry.currentSummary;
        let summaryMetadata = preparedCountry.currentSummaryMetadata;
        let heroImageUrl = preparedCountry.currentHeroImageUrl;
        let heroImageSourceName = preparedCountry.currentHeroImageSourceName;
        let heroImageSourceUrl = preparedCountry.currentHeroImageSourceUrl;
        let heroImageAttributionName = preparedCountry.currentHeroImageAttributionName;
        let heroImageAttributionUrl = preparedCountry.currentHeroImageAttributionUrl;
        let heroQuery = preparedCountry.currentHeroQuery;
        let heroReason = preparedCountry.currentHeroReason;
        let selectedPhotoId = preparedCountry.currentSelectedPhotoId;
        const fieldsUpdated: string[] = [];

        if (preparedCountry.needsSummary) {
          summary = descriptionsBySlug.get(country.slug) ?? null;

          if (!summary) {
            throw new Error(
              descriptionBatchError
                ?? `Gemini did not return a description for ${country.slug}.`,
            );
          }

          summaryMetadata = {
            ...summaryMetadata,
            source_name: SOURCE_NAME,
            source_version: SOURCE_VERSION,
            model: geminiModel,
            prompt_file_name: COUNTRY_DESCRIPTION_PROMPT_FILE_NAME,
            generated_at: preparedCountry.nowIso,
          };
          pushFieldIfChanged(fieldsUpdated, 'summary', country.summary, summary);
          pushFieldIfChanged(
            fieldsUpdated,
            'summary_metadata',
            JSON.stringify(country.summary_metadata ?? {}),
            JSON.stringify(summaryMetadata),
          );
        }

        if (preparedCountry.needsHeroImage) {
          heroQuery = heroQueriesBySlug.get(country.slug) ?? null;

          if (!heroQuery) {
            throw new Error(
              heroQueryBatchError
                ?? `Gemini did not return a hero query for ${country.slug}.`,
            );
          }

          const heroImageResult = await fetchUnsplashHero({
            country,
            query: heroQuery,
            unsplashAccessKey,
          });

          heroReason = null;
          selectedPhotoId = heroImageResult.photoId;
          heroImageUrl = heroImageResult.heroImageUrl;
          heroImageSourceName = heroImageResult.sourceName;
          heroImageSourceUrl = heroImageResult.sourceUrl;
          heroImageAttributionName = heroImageResult.photographerName;
          heroImageAttributionUrl = heroImageResult.photographerUrl;

          pushFieldIfChanged(fieldsUpdated, 'hero_image_url', country.hero_image_url, heroImageUrl);
          pushFieldIfChanged(
            fieldsUpdated,
            'hero_image_source_name',
            country.hero_image_source_name,
            heroImageSourceName,
          );
          pushFieldIfChanged(
            fieldsUpdated,
            'hero_image_source_url',
            country.hero_image_source_url,
            heroImageSourceUrl,
          );
          pushFieldIfChanged(
            fieldsUpdated,
            'hero_image_attribution_name',
            country.hero_image_attribution_name,
            heroImageAttributionName,
          );
          pushFieldIfChanged(
            fieldsUpdated,
            'hero_image_attribution_url',
            country.hero_image_attribution_url,
            heroImageAttributionUrl,
          );
        }

        if (!summary || !heroImageUrl) {
          throw new Error(`Country editorial enrichment did not produce both summary and hero image for ${country.slug}.`);
        }

        heroQueryForResult = heroQuery;
        selectedPhotoIdForResult = selectedPhotoId;

        const enrichmentMetadata = {
          ...preparedCountry.currentMetadata,
          pipeline_name: PIPELINE_NAME,
          source_name: SOURCE_NAME,
          source_version: SOURCE_VERSION,
          last_attempted_at: preparedCountry.nowIso,
          last_completed_at: preparedCountry.nowIso,
          gemini_model: geminiModel,
          description_prompt_file: COUNTRY_DESCRIPTION_PROMPT_FILE_NAME,
          hero_prompt_file: promptAssets.heroStrategy.fileName,
          hero_query: heroQuery,
          hero_reason: heroReason,
          selected_photo_id: selectedPhotoId,
          last_error: null,
        };

        pushFieldIfChanged(fieldsUpdated, 'enrichment_status', country.enrichment_status, 'enriched');
        pushFieldIfChanged(fieldsUpdated, 'last_enriched_at', country.last_enriched_at, preparedCountry.nowIso);
        pushFieldIfChanged(
          fieldsUpdated,
          'enrichment_metadata',
          JSON.stringify(country.enrichment_metadata ?? {}),
          JSON.stringify(enrichmentMetadata),
        );

        const { error: updateCountryError } = await supabase
          .from('countries')
          .update({
            summary,
            summary_metadata: summaryMetadata,
            hero_image_url: heroImageUrl,
            hero_image_source_name: heroImageSourceName,
            hero_image_source_url: heroImageSourceUrl,
            hero_image_attribution_name: heroImageAttributionName,
            hero_image_attribution_url: heroImageAttributionUrl,
            enrichment_status: 'enriched',
            enrichment_metadata: enrichmentMetadata,
            last_enriched_at: preparedCountry.nowIso,
          })
          .eq('code', country.code);

        if (updateCountryError) {
          throw updateCountryError;
        }

        const { data: publishReadiness } = await supabase
          .rpc('refresh_country_publish_readiness', {
            p_country_code: country.code,
          })
          .single();

        enrichedCount += 1;
        results.push({
          slug: country.slug,
          status: 'enriched',
          is_published: publishReadiness?.is_published ?? false,
          fields_updated: fieldsUpdated,
          hero_query: heroQuery,
          selected_photo_id: selectedPhotoId,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown country editorial failure.';
        failedCount += 1;

        await markCountryFailure({
          supabase,
          country,
          errorMessage,
        });

        results.push({
          slug: country.slug,
          status: 'failed',
          is_published: country.is_published,
          fields_updated: [],
          hero_query: heroQueryForResult,
          selected_photo_id: selectedPhotoIdForResult,
          error: errorMessage,
        });
      }
    }

    return jsonResponse(200, {
      source_name: SOURCE_NAME,
      source_version: SOURCE_VERSION,
      enriched_country_count: enrichedCount,
      failed_country_count: failedCount,
      countries_processed: results,
    });
  } catch (error) {
    const isServerMisconfiguration =
      error instanceof Error && error.message.startsWith('Missing required environment variable:');

    return jsonResponse(isServerMisconfiguration ? 500 : 400, {
      error: error instanceof Error ? error.message : 'Invalid compose-country-editorial request.',
    });
  }
});
