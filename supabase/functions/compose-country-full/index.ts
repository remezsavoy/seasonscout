import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { CountryQuickFacts, Database } from '../_shared/database.types.ts';

import {
  aggregateMonthlyClimate,
  CLIMATE_SOURCE_NAME,
  createImportWindow,
  fetchHistoricalClimate,
  type ClimateDestinationRecord,
} from './climate.ts';
import { generateStructuredJson, getGeminiModel } from './gemini.ts';
import {
  buildCountryEditorialPrompt,
  COUNTRY_EDITORIAL_PROMPT_FILE_NAME,
} from './prompts/countryEditorialPrompt.ts';
import {
  buildCountryFullPrompt,
  COUNTRY_FULL_PROMPT_FILE_NAME,
} from './prompts/countryFullPrompt.ts';
import {
  buildDestinationEnrichPrompt,
  DESTINATION_ENRICH_PROMPT_FILE_NAME,
} from './prompts/destinationEnrichPrompt.ts';
import { fetchUnsplashHero } from './unsplash.ts';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-seasonscout-ingestion-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PIPELINE_NAME = 'compose-country-full';
const SOURCE_NAME = 'country_full_generation_pipeline';
const SOURCE_VERSION = '2026-04-09-v1';
const MAX_DESTINATION_COUNT = 8;
const MIN_DESTINATION_COUNT = 1;

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
  'collection_tags',
  'quick_facts',
  'enrichment_status',
  'enrichment_metadata',
  'last_enriched_at',
  'is_published',
].join(', ');

const DESTINATION_SELECT_FIELDS = [
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
  'climate_import_status',
  'enrichment_status',
  'is_published',
].join(', ');

const COLLECTION_TAGS_ENUM = [
  'tropical-beach',
  'city-break',
  'winter-sun',
  'mild-summer',
  'year-round',
  'culture-history',
  'food-capital',
  'nature-wildlife',
  'winter-sports',
  'backpacking-budget',
  'romantic-getaway',
  'family-friendly',
  'adventure-active',
  'wellness-retreat',
] as const;

const COUNTRY_DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    country_code: { type: 'string' },
    continent: { type: 'string' },
    collection_tags: {
      type: 'array',
      items: { type: 'string', enum: COLLECTION_TAGS_ENUM },
    },
    summary: { type: 'string' },
    seasonal_overview: { type: 'string' },
    hero_query: { type: 'string' },
    destinations: {
      type: 'array',
      minItems: MIN_DESTINATION_COUNT,
      maxItems: MAX_DESTINATION_COUNT,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          country_code: { type: 'string' },
          continent: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          timezone: { type: 'string' },
        },
        required: ['name', 'slug', 'country_code', 'continent', 'latitude', 'longitude', 'timezone'],
      },
    },
  },
  required: ['country_code', 'continent', 'collection_tags', 'summary', 'seasonal_overview', 'hero_query', 'destinations'],
} as const;

const DESTINATION_ENRICH_BATCH_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      slug: { type: 'string' },
      name: { type: 'string' },
      summary: { type: 'string' },
      travel_tags: {
        type: 'array',
        items: { type: 'string' },
      },
      collection_tags: {
        type: 'array',
        items: { type: 'string', enum: COLLECTION_TAGS_ENUM },
      },
      top_landmarks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['name', 'description'],
        },
      },
      peak_season: { type: 'string' },
      seasonal_insight: { type: 'string' },
      hero_query: { type: 'string' },
    },
    required: ['slug', 'name', 'summary', 'travel_tags', 'collection_tags', 'top_landmarks', 'peak_season', 'seasonal_insight', 'hero_query'],
  },
} as const;

type RequestBody = {
  action?: string;
  country?: string;
  destination_slug?: string;
  destination_id?: string;
  destinationId?: string;
  max_destinations?: number;
  allow_non_pending?: boolean;
  overwrite_existing?: boolean;
  skipDestinations?: boolean;
};

type CountryRecord = Database['public']['Tables']['countries']['Row'];
type DestinationRecord = Record<string, any>;

type Selection = {
  action: 'compose_country' | 'regenerate_destination';
  countryName: string;
  countrySlug: string;
  destinationId: string | null;
  destinationSlug: string | null;
  maxDestinations: number;
  allowNonPending: boolean;
  overwriteExisting: boolean;
  skipDestinations: boolean;
};

type NormalizedDiscoveredDestination = {
  name: string;
  slug: string;
  country_code: string;
  continent: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type DestinationLandmark = {
  name: string;
  description: string;
};

type DestinationEnrichment = {
  slug: string;
  name: string;
  summary: string;
  travelTags: string[];
  collectionTags: string[];
  topLandmarks: DestinationLandmark[];
  peakSeason: string;
  seasonalInsight: string;
  heroQuery: string;
};

type CountryEditorial = {
  countryName: string;
  countryCode: string;
  continent: string;
  collectionTags: string[];
  summary: string;
  seasonalOverview: string;
  heroQuery: string;
  destinations: NormalizedDiscoveredDestination[];
  rawText: string;
  usageMetadata: Record<string, unknown> | null;
};

type RestCountriesResponse = Array<{
  capital?: string[];
  timezones?: string[];
  languages?: Record<string, string>;
  currencies?: Record<string, { name?: string; symbol?: string }>;
  car?: {
    side?: string;
  };
  idd?: {
    root?: string;
    suffixes?: string[];
  };
  borders?: string[];
  flags?: {
    svg?: string;
  };
}>;

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

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmedValue;
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function normalizeQuickFactsText(value: unknown) {
  return normalizeOptionalText(value) ?? '';
}

async function fetchCountryQuickFacts(countryName: string): Promise<CountryQuickFacts | Record<string, never>> {
  try {
    const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);

    if (!response.ok) {
      return {};
    }

    const countries = await response.json() as RestCountriesResponse;
    const country = countries[0];

    if (!country) {
      return {};
    }

    const currencyEntry = Object.entries(country.currencies ?? {})[0];
    const [currencyCode, currencyDetails] = currencyEntry ?? [];

    return {
      capital: normalizeQuickFactsText(country.capital?.[0]),
      languages: Object.values(country.languages ?? {}).map((language) => normalizeQuickFactsText(language)).filter(Boolean),
      timezones: Array.isArray(country.timezones)
        ? country.timezones.map((timezone) => normalizeQuickFactsText(timezone)).filter(Boolean)
        : [],
      currency: {
        code: normalizeQuickFactsText(currencyCode),
        name: normalizeQuickFactsText(currencyDetails?.name),
        symbol: normalizeQuickFactsText(currencyDetails?.symbol),
      },
      driving_side: normalizeQuickFactsText(country.car?.side),
      idd: `${normalizeOptionalText(country.idd?.root) ?? ''}${normalizeOptionalText(country.idd?.suffixes?.[0]) ?? ''}`,
      borders: Array.isArray(country.borders) ? country.borders.filter((border) => typeof border === 'string') : [],
      flag_url: normalizeQuickFactsText(country.flags?.svg),
    };
  } catch {
    return {};
  }
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

function normalizeAction(value: unknown) {
  if (value === undefined || value === null) {
    return 'compose_country' as const;
  }

  const action = normalizeText(value, 'action').toLowerCase();

  if (action === 'compose_country' || action === 'regenerate_destination') {
    return action;
  }

  throw new Error('action must be either compose_country or regenerate_destination.');
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

function normalizeCountryName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function normalizeCountryCode(value: unknown, fieldName: string) {
  const countryCode = normalizeText(value, fieldName).toUpperCase();

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error(`${fieldName} must be a valid ISO alpha-2 code.`);
  }

  return countryCode;
}

function normalizeContinent(value: unknown, fallback = 'Unknown') {
  return normalizeOptionalText(value) ?? fallback;
}

function normalizeCoordinate(value: unknown, fieldName: string, min: number, max: number) {
  const coordinate = Number(value);

  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    throw new Error(`${fieldName} must be a number between ${min} and ${max}.`);
  }

  return Number(coordinate.toFixed(5));
}

function normalizeTimezone(value: unknown, fieldName: string) {
  const timezone = normalizeText(value, fieldName);

  if (!timezone.includes('/')) {
    throw new Error(`${fieldName} must be an IANA timezone string.`);
  }

  return timezone;
}

function normalizeTravelTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(
    value
      .map((item) => normalizeOptionalText(item))
      .filter(Boolean)
      .map((tag) => tag!.toLowerCase().slice(0, 40)),
  )].slice(0, 5);
}

function normalizeCollectionTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(
    value
      .map((item) => normalizeOptionalText(item))
      .filter((tag): tag is string => Boolean(tag) && COLLECTION_TAGS_ENUM.includes(tag as any))
  )];
}

function normalizeLandmarkName(value: unknown, fieldName: string) {
  return normalizeText(value, fieldName).slice(0, 80);
}

function normalizeLandmarkDescription(value: unknown, fieldName: string) {
  return normalizeText(value, fieldName).slice(0, 220);
}

function normalizeTopLandmarks(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenNames = new Set<string>();
  const normalizedLandmarks: DestinationLandmark[] = [];

  for (const [index, item] of value.entries()) {
    if (typeof item === 'string') {
      const landmarkName = normalizeOptionalText(item);

      if (!landmarkName) {
        continue;
      }

      const dedupeKey = landmarkName.toLowerCase();

      if (seenNames.has(dedupeKey)) {
        continue;
      }

      seenNames.add(dedupeKey);
      normalizedLandmarks.push({
        name: landmarkName.slice(0, 80),
        description: `${landmarkName.slice(0, 80)} is one of the signature stops travelers usually prioritize here.`,
      });
      continue;
    }

    const normalizedObject = normalizeObject(item);
    const landmarkName = normalizeOptionalText(normalizedObject.name);
    const landmarkDescription = normalizeOptionalText(normalizedObject.description);

    if (!landmarkName || !landmarkDescription) {
      continue;
    }

    const dedupeKey = landmarkName.toLowerCase();

    if (seenNames.has(dedupeKey)) {
      continue;
    }

    seenNames.add(dedupeKey);
    normalizedLandmarks.push({
      name: normalizeLandmarkName(landmarkName, `top_landmarks[${index}].name`),
      description: normalizeLandmarkDescription(landmarkDescription, `top_landmarks[${index}].description`),
    });
  }

  return normalizedLandmarks.slice(0, 4);
}

function normalizeMaxDestinations(value: unknown) {
  if (value === undefined || value === null) {
    return 6;
  }

  const maxDestinations = Number(value);

  if (!Number.isInteger(maxDestinations) || maxDestinations < MIN_DESTINATION_COUNT || maxDestinations > MAX_DESTINATION_COUNT) {
    throw new Error(`max_destinations must be an integer between ${MIN_DESTINATION_COUNT} and ${MAX_DESTINATION_COUNT}.`);
  }

  return maxDestinations;
}

function parseRequestBody(rawBody: string): RequestBody {
  if (!rawBody.trim()) {
    return {};
  }

  const parsedBody = JSON.parse(rawBody);

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    throw new Error('Request body must be a JSON object.');
  }

  return parsedBody as RequestBody;
}

function deriveSelection(body: RequestBody): Selection {
  const action = normalizeAction(body.action);
  const destinationId = normalizeOptionalText(body.destination_id ?? body.destinationId);
  const destinationSlug = normalizeOptionalText(body.destination_slug);
  const hasDestinationTarget = action === 'regenerate_destination' || Boolean(destinationId) || Boolean(destinationSlug);
  const countryName = hasDestinationTarget
    ? normalizeOptionalText(body.country)
      ? normalizeCountryName(normalizeOptionalText(body.country)!)
      : ''
    : normalizeCountryName(normalizeText(body.country, 'country'));
  const countrySlug = countryName ? slugify(countryName) : '';

  if (action === 'regenerate_destination' && !destinationId && !destinationSlug) {
    throw new Error('destination_id or destination_slug is required for regenerate_destination.');
  }

  if (!hasDestinationTarget && !countrySlug) {
    throw new Error('country must produce a valid slug.');
  }

  return {
    action,
    countryName,
    countrySlug,
    destinationId: destinationId || null,
    destinationSlug: destinationSlug ? slugify(destinationSlug) : null,
    maxDestinations: normalizeMaxDestinations(body.max_destinations),
    allowNonPending: normalizeBoolean(body.allow_non_pending, 'allow_non_pending', false),
    overwriteExisting: normalizeBoolean(body.overwrite_existing, 'overwrite_existing', false),
    skipDestinations: normalizeBoolean(body.skipDestinations, 'skipDestinations', false),
  };
}


async function fetchCountryBySlug(supabase: ReturnType<typeof createClient>, slug: string) {
  const { data, error } = await supabase
    .from('countries')
    .select(COUNTRY_SELECT_FIELDS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as CountryRecord | null;
}

async function fetchCountryByCode(supabase: ReturnType<typeof createClient>, code: string) {
  const { data, error } = await supabase
    .from('countries')
    .select(COUNTRY_SELECT_FIELDS)
    .eq('code', code)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as CountryRecord | null;
}

async function fetchDestinationBySlug(supabase: ReturnType<typeof createClient>, slug: string) {
  const { data, error } = await supabase
    .from('destinations')
    .select(DESTINATION_SELECT_FIELDS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as DestinationRecord | null;
}

async function fetchDestinationById(supabase: ReturnType<typeof createClient>, id: string) {
  const { data, error } = await supabase
    .from('destinations')
    .select(DESTINATION_SELECT_FIELDS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as DestinationRecord | null;
}

async function discoverCountryPackage(options: {
  geminiApiKey: string;
  geminiModel: string;
  selection: Selection;
}) {
  const prompt = buildCountryFullPrompt(options.selection.countryName, options.selection.maxDestinations);
  const result = await generateStructuredJson<any>({
    apiKey: options.geminiApiKey,
    model: options.geminiModel,
    systemInstruction: prompt.systemInstruction,
    userPrompt: prompt.userPrompt,
    responseSchema: COUNTRY_DISCOVERY_SCHEMA,
    temperature: 0.5,
    maxOutputTokens: 2400,
  });

  const parsed = normalizeObject(result.parsed);
  const countryCode = normalizeCountryCode(parsed.country_code, 'country_code');
  const continent = normalizeContinent(parsed.continent, 'Unknown');
  const collectionTags = normalizeCollectionTags(parsed.collection_tags);
  const summary = normalizeText(parsed.summary, 'summary');
  const seasonalOverview = normalizeText(parsed.seasonal_overview, 'seasonal_overview');
  const heroQuery = normalizeText(parsed.hero_query, 'hero_query');
  const rawDestinations = Array.isArray(parsed.destinations) ? parsed.destinations : [];

  if (rawDestinations.length < MIN_DESTINATION_COUNT) {
    throw new Error(`Gemini returned only ${rawDestinations.length} destinations; expected at least ${MIN_DESTINATION_COUNT}.`);
  }

  const seenSlugs = new Set<string>();
  const destinations = rawDestinations
    .slice(0, options.selection.maxDestinations)
    .map((entry, index) => {
      const normalizedEntry = normalizeObject(entry);
      const name = normalizeText(normalizedEntry.name, `destinations[${index}].name`);
      const slug = slugify(normalizeOptionalText(normalizedEntry.slug) ?? name);

      if (!slug) {
        throw new Error(`destinations[${index}].slug could not be normalized.`);
      }

      if (seenSlugs.has(slug)) {
        throw new Error(`Gemini returned duplicate destination slug ${slug}.`);
      }

      seenSlugs.add(slug);

      return {
        name,
        slug,
        country_code: normalizeCountryCode(normalizedEntry.country_code ?? countryCode, `destinations[${index}].country_code`),
        continent: normalizeContinent(normalizedEntry.continent ?? continent, continent),
        latitude: normalizeCoordinate(normalizedEntry.latitude, `destinations[${index}].latitude`, -90, 90),
        longitude: normalizeCoordinate(normalizedEntry.longitude, `destinations[${index}].longitude`, -180, 180),
        timezone: normalizeTimezone(normalizedEntry.timezone, `destinations[${index}].timezone`),
      };
    });

  return {
    countryCode,
    countryName: normalizeCountryName(options.selection.countryName),
    continent,
    collectionTags,
    summary,
    seasonalOverview,
    heroQuery,
    destinations,
    rawText: result.rawText,
    usageMetadata: result.usageMetadata,
  };
}

async function discoverCountryEditorial(options: {
  geminiApiKey: string;
  geminiModel: string;
  selection: Selection;
}): Promise<CountryEditorial> {
  const prompt = buildCountryEditorialPrompt(options.selection.countryName);
  const result = await generateStructuredJson<any>({
    apiKey: options.geminiApiKey,
    model: options.geminiModel,
    systemInstruction: prompt.systemInstruction,
    userPrompt: prompt.userPrompt,
    responseSchema: {
      type: 'object',
      properties: {
        country_code: { type: 'string' },
        continent: { type: 'string' },
        collection_tags: {
          type: 'array',
          items: { type: 'string', enum: COLLECTION_TAGS_ENUM },
        },
        summary: { type: 'string' },
        seasonal_overview: { type: 'string' },
        hero_query: { type: 'string' },
      },
      required: ['country_code', 'continent', 'collection_tags', 'summary', 'seasonal_overview', 'hero_query'],
    },
    temperature: 0.5,
    maxOutputTokens: 900,
  });

  const parsed = normalizeObject(result.parsed);

  return {
    countryName: options.selection.countryName,
    countryCode: normalizeCountryCode(parsed.country_code, 'country_code'),
    continent: normalizeContinent(parsed.continent, 'Unknown'),
    collectionTags: normalizeCollectionTags(parsed.collection_tags),
    summary: normalizeText(parsed.summary, 'summary'),
    seasonalOverview: normalizeText(parsed.seasonal_overview, 'seasonal_overview'),
    heroQuery: normalizeText(parsed.hero_query, 'hero_query'),
    destinations: [],
    rawText: result.rawText,
    usageMetadata: result.usageMetadata,
  };
}


async function generateDestinationEnrichments(options: {
  geminiApiKey: string;
  geminiModel: string;
  countryName: string;
  destinations: NormalizedDiscoveredDestination[];
}) {
  const prompt = buildDestinationEnrichPrompt(
    options.countryName,
    options.destinations.map((destination) => destination.name),
  );
  const result = await generateStructuredJson<any[]>({
    apiKey: options.geminiApiKey,
    model: options.geminiModel,
    systemInstruction: prompt.systemInstruction,
    userPrompt: prompt.userPrompt,
    responseSchema: DESTINATION_ENRICH_BATCH_SCHEMA,
    temperature: 0.8,
    maxOutputTokens: 3200,
  });

  const enrichmentsBySlug = new Map<string, DestinationEnrichment>();

  for (const entry of Array.isArray(result.parsed) ? result.parsed : []) {
    const normalizedEntry = normalizeObject(entry);
    const slug = slugify(normalizeText(normalizedEntry.slug, 'destination slug'));

    enrichmentsBySlug.set(slug, {
      slug,
      name: normalizeText(normalizedEntry.name, 'destination name'),
      summary: normalizeText(normalizedEntry.summary, 'destination summary'),
      travelTags: normalizeTravelTags(normalizedEntry.travel_tags),
      collectionTags: normalizeCollectionTags(normalizedEntry.collection_tags),
      topLandmarks: normalizeTopLandmarks(normalizedEntry.top_landmarks),
      peakSeason: normalizeText(normalizedEntry.peak_season, 'destination peak_season'),
      seasonalInsight: normalizeText(normalizedEntry.seasonal_insight, 'destination seasonal_insight'),
      heroQuery: normalizeText(normalizedEntry.hero_query, 'destination hero_query'),
    });
  }

  return {
    enrichmentsBySlug,
    rawText: result.rawText,
    usageMetadata: result.usageMetadata,
  };
}

async function upsertBaseDestinations(options: {
  supabase: ReturnType<typeof createClient>;
  countryName: string;
  destinations: NormalizedDiscoveredDestination[];
}) {
  const { data, error } = await options.supabase
    .from('destinations')
    .upsert(
      options.destinations.map((destination) => ({
        slug: destination.slug,
        name: destination.name,
        country: options.countryName,
        country_code: destination.country_code,
        continent: destination.continent,
        latitude: destination.latitude,
        longitude: destination.longitude,
        timezone: destination.timezone,
      })),
      {
        onConflict: 'slug',
      },
    )
    .select(DESTINATION_SELECT_FIELDS);

  if (error) {
    throw error;
  }

  return data as DestinationRecord[];
}

async function syncCountryFeaturedDestinations(options: {
  supabase: ReturnType<typeof createClient>;
  countryCode: string;
  destinations: DestinationRecord[];
}) {
  const orderedRows = options.destinations.map((destination, index) => ({
    country_code: options.countryCode,
    destination_id: destination.id,
    rank: index + 1,
  }));

  const { error: deleteError } = await options.supabase
    .from('country_featured_destinations')
    .delete()
    .eq('country_code', options.countryCode);

  if (deleteError) {
    throw deleteError;
  }

  const { error: insertError } = await options.supabase
    .from('country_featured_destinations')
    .insert(orderedRows);

  if (insertError) {
    throw insertError;
  }
}

async function markDestinationFailed(options: {
  supabase: ReturnType<typeof createClient>;
  destinationId: string;
  previousClimateImportStatus: string | null | undefined;
}) {
  const { error: updateError } = await options.supabase
    .from('destinations')
    .update({
      enrichment_status: 'failed',
      climate_import_status: options.previousClimateImportStatus === 'imported' ? 'imported' : 'failed',
    })
    .eq('id', options.destinationId);

  if (updateError) {
    throw updateError;
  }

  const { error: readinessError } = await options.supabase
    .rpc('refresh_destination_publish_readiness', {
      p_destination_id: options.destinationId,
    });

  if (readinessError) {
    throw readinessError;
  }
}

async function insertCountrySnapshots(options: {
  supabase: ReturnType<typeof createClient>;
  countryCode: string;
  ingestionRunId: string;
  discoveryPayload: Record<string, unknown>;
  unsplashPayload: Record<string, unknown>;
}) {
  const { error } = await options.supabase
    .from('country_source_snapshots')
    .insert([
      {
        country_code: options.countryCode,
        ingestion_run_id: options.ingestionRunId,
        source_name: 'country_full_prompt',
        external_id: null,
        payload: options.discoveryPayload,
      },
      {
        country_code: options.countryCode,
        ingestion_run_id: options.ingestionRunId,
        source_name: 'country_unsplash_photo',
        external_id: options.unsplashPayload.selected_photo_id as string | null ?? null,
        payload: options.unsplashPayload,
      },
    ]);

  if (error) {
    throw error;
  }
}

async function insertDestinationSnapshot(options: {
  supabase: ReturnType<typeof createClient>;
  destinationId: string;
  ingestionRunId: string;
  promptPayload: Record<string, unknown>;
  unsplashPayload: Record<string, unknown>;
}) {
  const { error } = await options.supabase
    .from('destination_source_snapshots')
    .insert([
      {
        destination_id: options.destinationId,
        ingestion_run_id: options.ingestionRunId,
        source_name: 'destination_full_prompt',
        external_id: null,
        payload: options.promptPayload,
      },
      {
        destination_id: options.destinationId,
        ingestion_run_id: options.ingestionRunId,
        source_name: 'unsplash_photo',
        external_id: options.unsplashPayload.selected_photo_id as string | null ?? null,
        payload: options.unsplashPayload,
      },
    ]);

  if (error) {
    throw error;
  }
}

async function importDestinationClimate(options: {
  supabase: ReturnType<typeof createClient>;
  destination: DestinationRecord;
  ingestionRunId: string;
  overwriteExisting: boolean;
  allowNonPending: boolean;
}) {
  const shouldRunImport = options.overwriteExisting
    || options.allowNonPending
    || options.destination.climate_import_status !== 'imported';

  if (!shouldRunImport) {
    return {
      climateStatus: options.destination.climate_import_status,
      bestMonths: Array.isArray(options.destination.best_months) ? options.destination.best_months : [],
      climateRowsWritten: 0,
    };
  }

  const importWindow = createImportWindow();

  const { error: setImportingError } = await options.supabase
    .from('destinations')
    .update({ climate_import_status: 'importing' })
    .eq('id', options.destination.id);

  if (setImportingError) {
    throw setImportingError;
  }

  const climateResponse = await fetchHistoricalClimate(options.destination as ClimateDestinationRecord, importWindow);
  const { rows, snapshotPayload } = aggregateMonthlyClimate(
    options.destination as ClimateDestinationRecord,
    climateResponse,
    importWindow,
  );
  const sourceLabel = `${CLIMATE_SOURCE_NAME}:${importWindow.periodLabel}`;

  const { error: snapshotError } = await options.supabase
    .from('climate_source_snapshots')
    .insert({
      destination_id: options.destination.id,
      ingestion_run_id: options.ingestionRunId,
      source_name: CLIMATE_SOURCE_NAME,
      source_period: importWindow.periodLabel,
      payload: snapshotPayload,
    });

  if (snapshotError) {
    throw snapshotError;
  }

  const { data: upsertedRows, error: upsertError } = await options.supabase
    .from('monthly_climate')
    .upsert(
      rows.map((row) => ({
        destination_id: options.destination.id,
        month: row.month,
        avg_high_c: row.avg_high_c,
        avg_low_c: row.avg_low_c,
        avg_precip_mm: row.avg_precip_mm,
        avg_humidity: row.avg_humidity,
        sunshine_hours: row.sunshine_hours,
        source: sourceLabel,
      })),
      {
        onConflict: 'destination_id,month',
      },
    )
    .select('month');

  if (upsertError) {
    throw upsertError;
  }

  const { data: derivativeResult, error: derivativeError } = await options.supabase
    .rpc('refresh_destination_climate_derivatives', {
      p_destination_id: options.destination.id,
    })
    .single();

  if (derivativeError) {
    throw derivativeError;
  }

  const { error: importedStatusError } = await options.supabase
    .from('destinations')
    .update({ climate_import_status: 'imported' })
    .eq('id', options.destination.id);

  if (importedStatusError) {
    throw importedStatusError;
  }

  return {
    climateStatus: 'imported',
    bestMonths: derivativeResult?.best_months ?? [],
    climateRowsWritten: upsertedRows?.length ?? rows.length,
  };
}

async function processDestination(options: {
  supabase: ReturnType<typeof createClient>;
  destination: DestinationRecord;
  enrichment: DestinationEnrichment;
  selection: Selection;
  ingestionRunId: string;
  geminiModel: string;
  unsplashAccessKey: string;
  countryName: string;
  batchRawText: string | null;
  batchUsageMetadata: unknown;
}) {
  const hero = await fetchUnsplashHero({
    query: options.enrichment.heroQuery,
    unsplashAccessKey: options.unsplashAccessKey,
    subjectLabel: options.destination.slug,
  });

  const summary = options.selection.overwriteExisting || !normalizeOptionalText(options.destination.summary)
    ? options.enrichment.summary
    : options.destination.summary;
  const travelTags = options.selection.overwriteExisting || !Array.isArray(options.destination.travel_tags) || options.destination.travel_tags.length === 0
    ? options.enrichment.travelTags
    : options.destination.travel_tags;
  const collectionTags = options.selection.overwriteExisting || !Array.isArray(options.destination.collection_tags) || options.destination.collection_tags.length === 0
    ? options.enrichment.collectionTags
    : options.destination.collection_tags;
  const existingTopLandmarks = normalizeTopLandmarks(options.destination.top_landmarks);
  const topLandmarks = options.selection.overwriteExisting || existingTopLandmarks.length === 0
    ? options.enrichment.topLandmarks
    : existingTopLandmarks;
  const peakSeason = options.selection.overwriteExisting || !normalizeOptionalText(options.destination.peak_season)
    ? options.enrichment.peakSeason
    : options.destination.peak_season;
  const seasonalInsight = options.selection.overwriteExisting || !normalizeOptionalText(options.destination.seasonal_insight)
    ? options.enrichment.seasonalInsight
    : options.destination.seasonal_insight;
  const heroImageUrl = options.selection.overwriteExisting || !normalizeOptionalText(options.destination.hero_image_url)
    ? hero.heroImageUrl
    : options.destination.hero_image_url;
  const heroSourceName = options.selection.overwriteExisting || !normalizeOptionalText(options.destination.hero_image_source_name)
    ? hero.sourceName
    : options.destination.hero_image_source_name;
  const heroSourceUrl = options.selection.overwriteExisting || !normalizeOptionalText(options.destination.hero_image_source_url)
    ? hero.sourceUrl
    : options.destination.hero_image_source_url;
  const heroAttributionName = options.selection.overwriteExisting || !normalizeOptionalText(options.destination.hero_image_attribution_name)
    ? hero.photographerName
    : options.destination.hero_image_attribution_name;
  const heroAttributionUrl = options.selection.overwriteExisting || !normalizeOptionalText(options.destination.hero_image_attribution_url)
    ? hero.photographerUrl
    : options.destination.hero_image_attribution_url;

  const { error: destinationUpdateError } = await options.supabase
    .from('destinations')
    .update({
      summary,
      hero_image_url: heroImageUrl,
      hero_image_source_name: heroSourceName,
      hero_image_source_url: heroSourceUrl,
      hero_image_attribution_name: heroAttributionName,
      hero_image_attribution_url: heroAttributionUrl,
      travel_tags: travelTags,
      collection_tags: collectionTags,
      top_landmarks: topLandmarks,
      peak_season: peakSeason,
      seasonal_insight: seasonalInsight,
      enrichment_status: 'enriched',
    })
    .eq('id', options.destination.id);

  if (destinationUpdateError) {
    throw destinationUpdateError;
  }

  await insertDestinationSnapshot({
    supabase: options.supabase,
    destinationId: options.destination.id,
    ingestionRunId: options.ingestionRunId,
    promptPayload: {
      country_name: options.countryName,
      destination_slug: options.destination.slug,
      model: options.geminiModel,
      prompt_file_name: DESTINATION_ENRICH_PROMPT_FILE_NAME,
      generated_content: {
        summary: options.enrichment.summary,
        travel_tags: options.enrichment.travelTags,
        collection_tags: options.enrichment.collectionTags,
        top_landmarks: options.enrichment.topLandmarks,
        peak_season: options.enrichment.peakSeason,
        seasonal_insight: options.enrichment.seasonalInsight,
        hero_query: options.enrichment.heroQuery,
      },
      batch_raw_text: options.batchRawText,
      batch_usage_metadata: options.batchUsageMetadata,
    },
    unsplashPayload: {
      ...hero.payload,
      destination_slug: options.destination.slug,
      selected_photo_id: hero.photoId,
      hero_query: options.enrichment.heroQuery,
    },
  });

  const climateResult = await importDestinationClimate({
    supabase: options.supabase,
    destination: options.destination,
    ingestionRunId: options.ingestionRunId,
    overwriteExisting: options.selection.overwriteExisting,
    allowNonPending: options.selection.allowNonPending,
  });

  const { data: publishReadiness, error: publishReadinessError } = await options.supabase
    .rpc('refresh_destination_publish_readiness', {
      p_destination_id: options.destination.id,
    })
    .single();

  if (publishReadinessError) {
    throw publishReadinessError;
  }

  const { data: finalDestination, error: finalDestinationError } = await options.supabase
    .from('destinations')
    .select('slug, name, summary, hero_image_url, climate_import_status, best_months, is_published, enrichment_status')
    .eq('id', options.destination.id)
    .single();

  if (finalDestinationError) {
    throw finalDestinationError;
  }

  return {
    finalDestination,
    climateResult,
    publishReadiness,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, {
      error: 'Method not allowed.',
      allowed_method: 'POST',
    });
  }

  const startedAt = Date.now();

  try {
    const ingestionSecret = requireEnv('SEASONSCOUT_INGESTION_SECRET');
    const providedSecret = request.headers.get('x-seasonscout-ingestion-secret');

    if (providedSecret !== ingestionSecret) {
      return jsonResponse(401, {
        error: 'Unauthorized.',
      });
    }

    const selection = deriveSelection(parseRequestBody(await request.text()));
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
    const existingCountry = selection.countrySlug
      ? await fetchCountryBySlug(supabase, selection.countrySlug)
      : null;

    const runMetadata = {
      action: selection.action,
      country_name: selection.countryName || null,
      country_slug: selection.countrySlug || null,
      destination_id: selection.destinationId,
      destination_slug: selection.destinationSlug,
      max_destinations: selection.maxDestinations,
      allow_non_pending: selection.allowNonPending,
      overwrite_existing: selection.overwriteExisting,
      skip_destinations: selection.skipDestinations,
      source_version: SOURCE_VERSION,
    };

    const { data: ingestionRun, error: ingestionRunError } = await supabase
      .from('ingestion_runs')
      .insert({
        pipeline_name: PIPELINE_NAME,
        source_name: SOURCE_NAME,
        source_version: SOURCE_VERSION,
        status: 'running',
        metadata: runMetadata,
        records_seen: 1,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (ingestionRunError) {
      throw ingestionRunError;
    }

    if (selection.destinationId || selection.destinationSlug) {
      const existingDestination = selection.destinationId
        ? await fetchDestinationById(supabase, selection.destinationId)
        : await fetchDestinationBySlug(supabase, selection.destinationSlug!);

      if (!existingDestination) {
        throw new Error(
          selection.destinationId
            ? `Destination ${selection.destinationId} was not found.`
            : `Destination ${selection.destinationSlug} was not found.`,
        );
      }

      const retryCountryName = selection.countryName || normalizeText(existingDestination.country, 'destination country');
      const normalizedRetryCountryName = normalizeCountryName(retryCountryName);
      const retryEnrichments = await generateDestinationEnrichments({
        geminiApiKey,
        geminiModel,
        countryName: normalizedRetryCountryName,
        destinations: [{
          name: normalizeText(existingDestination.name, 'destination name'),
          slug: normalizeText(existingDestination.slug, 'destination slug'),
          country_code: normalizeCountryCode(existingDestination.country_code, 'destination country_code'),
          continent: normalizeContinent(existingDestination.continent, 'Unknown'),
          latitude: normalizeCoordinate(existingDestination.latitude, 'destination latitude', -90, 90),
          longitude: normalizeCoordinate(existingDestination.longitude, 'destination longitude', -180, 180),
          timezone: normalizeTimezone(existingDestination.timezone, 'destination timezone'),
        }],
      });
      const retryEnrichment = retryEnrichments.enrichmentsBySlug.get(existingDestination.slug);

      if (!retryEnrichment) {
        throw new Error(`Gemini did not return enrichment for ${existingDestination.slug}.`);
      }

      try {
        const processed = await processDestination({
          supabase,
          destination: existingDestination,
          enrichment: retryEnrichment,
          selection,
          ingestionRunId: ingestionRun.id,
          geminiModel,
          unsplashAccessKey,
          countryName: normalizedRetryCountryName,
          batchRawText: retryEnrichments.rawText,
          batchUsageMetadata: retryEnrichments.usageMetadata,
        });

        const { data: countryPublishReadiness, error: countryPublishReadinessError } = await supabase
          .rpc('refresh_country_publish_readiness', {
            p_country_code: existingDestination.country_code,
          })
          .single();

        if (countryPublishReadinessError) {
          throw countryPublishReadinessError;
        }

        const finalCountry = await fetchCountryByCode(supabase, existingDestination.country_code);

        const { error: finishRunError } = await supabase
          .from('ingestion_runs')
          .update({
            status: 'succeeded',
            records_written: 1,
            records_failed: 0,
            metadata: {
              ...runMetadata,
              country_name: normalizedRetryCountryName,
              country_slug: finalCountry?.slug ?? null,
              country_publish_readiness: countryPublishReadiness,
              generated_destination_count: 1,
              published_destination_count: processed.finalDestination.is_published ? 1 : 0,
              climate_imports_completed: processed.climateResult.climateStatus === 'imported' ? 1 : 0,
            },
            finished_at: new Date().toISOString(),
          })
          .eq('id', ingestionRun.id);

        if (finishRunError) {
          throw finishRunError;
        }

        return jsonResponse(200, {
          status: 'completed',
          country: finalCountry
            ? {
                slug: finalCountry.slug,
                code: finalCountry.code,
                name: finalCountry.name,
                is_published: finalCountry.is_published,
                summary: finalCountry.summary,
                seasonal_overview: finalCountry.seasonal_overview,
                hero_image_url: finalCountry.hero_image_url,
              }
            : null,
          destinations: [{
            slug: processed.finalDestination.slug,
            name: processed.finalDestination.name,
            status: processed.finalDestination.is_published ? 'published' : 'draft',
            summary: processed.finalDestination.summary,
            hero_image_url: processed.finalDestination.hero_image_url,
            climate_status: processed.finalDestination.climate_import_status,
            best_months: Array.isArray(processed.finalDestination.best_months)
              ? processed.finalDestination.best_months
              : processed.climateResult.bestMonths,
            publish_readiness: processed.publishReadiness,
          }],
          stats: {
            destinations_created: 1,
            destinations_published: processed.finalDestination.is_published ? 1 : 0,
            climate_imports_completed: processed.climateResult.climateStatus === 'imported' ? 1 : 0,
            total_duration_ms: Date.now() - startedAt,
          },
        });
      } catch (error) {
        await markDestinationFailed({
          supabase,
          destinationId: existingDestination.id,
          previousClimateImportStatus: existingDestination.climate_import_status,
        });

        const { error: finishRunError } = await supabase
          .from('ingestion_runs')
          .update({
            status: 'failed',
            records_written: 0,
            records_failed: 1,
            metadata: {
              ...runMetadata,
              country_name: normalizedRetryCountryName,
            },
            finished_at: new Date().toISOString(),
          })
          .eq('id', ingestionRun.id);

        if (finishRunError) {
          throw finishRunError;
        }

        throw error;
      }
    }

    const discovery = selection.skipDestinations
      ? await discoverCountryEditorial({
          geminiApiKey,
          geminiModel,
          selection,
        })
      : await discoverCountryPackage({
          geminiApiKey,
          geminiModel,
          selection,
        });
    const resolvedCountryCode = existingCountry?.code ?? discovery.countryCode;

    const countryHero = await fetchUnsplashHero({
      query: discovery.heroQuery,
      unsplashAccessKey,
      subjectLabel: selection.countryName,
    });

    const countrySummary = selection.overwriteExisting || !normalizeOptionalText(existingCountry?.summary)
      ? discovery.summary
      : existingCountry.summary;
    const countrySeasonalOverview = selection.overwriteExisting || !normalizeOptionalText(existingCountry?.seasonal_overview)
      ? discovery.seasonalOverview
      : existingCountry.seasonal_overview;
    const countryHeroImageUrl = selection.overwriteExisting || !normalizeOptionalText(existingCountry?.hero_image_url)
      ? countryHero.heroImageUrl
      : existingCountry?.hero_image_url;
    const countryHeroSourceName = selection.overwriteExisting || !normalizeOptionalText(existingCountry?.hero_image_source_name)
      ? countryHero.sourceName
      : existingCountry?.hero_image_source_name;
    const countryHeroSourceUrl = selection.overwriteExisting || !normalizeOptionalText(existingCountry?.hero_image_source_url)
      ? countryHero.sourceUrl
      : existingCountry?.hero_image_source_url;
    const countryHeroAttributionName = selection.overwriteExisting || !normalizeOptionalText(existingCountry?.hero_image_attribution_name)
      ? countryHero.photographerName
      : existingCountry?.hero_image_attribution_name;
    const countryHeroAttributionUrl = selection.overwriteExisting || !normalizeOptionalText(existingCountry?.hero_image_attribution_url)
      ? countryHero.photographerUrl
      : existingCountry?.hero_image_attribution_url;
    const countryQuickFacts = await fetchCountryQuickFacts(discovery.countryName);
    const countryPromptFileName = selection.skipDestinations
      ? COUNTRY_EDITORIAL_PROMPT_FILE_NAME
      : COUNTRY_FULL_PROMPT_FILE_NAME;
    const countrySummaryMetadata = {
      ...normalizeObject(existingCountry?.summary_metadata),
      source_name: SOURCE_NAME,
      source_version: SOURCE_VERSION,
      model: geminiModel,
      prompt_file_name: countryPromptFileName,
      generated_at: new Date().toISOString(),
    };
    const countryEnrichmentMetadata = {
      ...normalizeObject(existingCountry?.enrichment_metadata),
      pipeline_name: PIPELINE_NAME,
      source_name: SOURCE_NAME,
      source_version: SOURCE_VERSION,
      gemini_model: geminiModel,
      discovery_prompt_file: countryPromptFileName,
      hero_query_prompt_file: countryPromptFileName,
      hero_query: discovery.heroQuery,
      selected_photo_id: countryHero.photoId,
      last_attempted_at: new Date().toISOString(),
      last_completed_at: new Date().toISOString(),
      last_error: null,
      destination_slugs: discovery.destinations.map((destination) => destination.slug),
    };

    const { error: upsertCountryError } = await supabase
      .from('countries')
      .upsert({
        code: resolvedCountryCode,
        slug: selection.countrySlug,
        name: discovery.countryName,
        continent: discovery.continent,
        collection_tags: discovery.collectionTags,
        summary: countrySummary,
        summary_metadata: countrySummaryMetadata,
        seasonal_overview: countrySeasonalOverview,
        hero_image_url: countryHeroImageUrl,
        hero_image_source_name: countryHeroSourceName,
        hero_image_source_url: countryHeroSourceUrl,
        hero_image_attribution_name: countryHeroAttributionName,
        hero_image_attribution_url: countryHeroAttributionUrl,
        quick_facts: countryQuickFacts,
        enrichment_status: 'enriched',
        enrichment_metadata: countryEnrichmentMetadata,
        last_enriched_at: new Date().toISOString(),
      }, {
        onConflict: 'code',
      });

    if (upsertCountryError) {
      throw upsertCountryError;
    }

    await insertCountrySnapshots({
      supabase,
      countryCode: resolvedCountryCode,
      ingestionRunId: ingestionRun.id,
      discoveryPayload: {
        country_name: selection.countryName,
        normalized_country_name: discovery.countryName,
        model: geminiModel,
        raw_text: discovery.rawText,
        usage_metadata: discovery.usageMetadata,
        generated_country: {
          country_code: discovery.countryCode,
          continent: discovery.continent,
          summary: discovery.summary,
          seasonal_overview: discovery.seasonalOverview,
          destinations: discovery.destinations,
        },
      },
      unsplashPayload: {
        ...countryHero.payload,
        subject_label: selection.countryName,
        selected_photo_id: countryHero.photoId,
        hero_query: discovery.heroQuery,
        prompt_usage_metadata: discovery.usageMetadata,
      },
    });

    if (selection.skipDestinations) {
      const { data: countryPublishReadiness, error: countryPublishReadinessError } = await supabase
        .rpc('refresh_country_publish_readiness', {
          p_country_code: resolvedCountryCode,
        })
        .single();

      if (countryPublishReadinessError) {
        throw countryPublishReadinessError;
      }

      const { data: finalCountry, error: finalCountryError } = await supabase
        .from('countries')
        .select('slug, code, name, summary, seasonal_overview, hero_image_url, is_published')
        .eq('code', resolvedCountryCode)
        .single();

      if (finalCountryError) {
        throw finalCountryError;
      }

      const { error: finishRunError } = await supabase
        .from('ingestion_runs')
        .update({
          status: 'succeeded',
          records_written: 1,
          records_failed: 0,
          metadata: {
            ...runMetadata,
            country_publish_readiness: countryPublishReadiness,
            generated_destination_count: 0,
            published_destination_count: 0,
            climate_imports_completed: 0,
          },
          finished_at: new Date().toISOString(),
        })
        .eq('id', ingestionRun.id);

      if (finishRunError) {
        throw finishRunError;
      }

      return jsonResponse(200, {
        status: 'completed',
        country: {
          slug: finalCountry.slug,
          code: finalCountry.code,
          name: finalCountry.name,
          is_published: finalCountry.is_published,
          summary: finalCountry.summary,
          seasonal_overview: finalCountry.seasonal_overview,
          hero_image_url: finalCountry.hero_image_url,
        },
        destinations: [],
        stats: {
          destinations_created: 0,
          destinations_published: 0,
          climate_imports_completed: 0,
          total_duration_ms: Date.now() - startedAt,
        },
      });
    }

    const destinationEnrichments = await generateDestinationEnrichments({
      geminiApiKey,
      geminiModel,
      countryName: selection.countryName,
      destinations: discovery.destinations,
    });
    const baseDestinationRows = await upsertBaseDestinations({
      supabase,
      countryName: discovery.countryName,
      destinations: discovery.destinations.map((destination) => ({
        ...destination,
        country_code: resolvedCountryCode,
      })),
    });
    const baseDestinationRowsBySlug = new Map(baseDestinationRows.map((destination) => [destination.slug, destination]));
    const orderedGeneratedDestinations = discovery.destinations
      .map((destination) => baseDestinationRowsBySlug.get(destination.slug))
      .filter(Boolean) as DestinationRecord[];

    await syncCountryFeaturedDestinations({
      supabase,
      countryCode: resolvedCountryCode,
      destinations: orderedGeneratedDestinations,
    });

    const destinationResults = [];
    let destinationsPublished = 0;
    let climateImportsCompleted = 0;
    let failedDestinations = 0;

    for (const destination of baseDestinationRows) {
      const enrichment = destinationEnrichments.enrichmentsBySlug.get(destination.slug);

      if (!enrichment) {
        failedDestinations += 1;

        await markDestinationFailed({
          supabase,
          destinationId: destination.id,
          previousClimateImportStatus: destination.climate_import_status,
        });

        destinationResults.push({
          slug: destination.slug,
          name: destination.name,
          status: 'failed',
          error: `Gemini did not return enrichment for ${destination.slug}.`,
        });
        continue;
      }

      try {
        const processed = await processDestination({
          supabase,
          destination,
          enrichment,
          selection,
          ingestionRunId: ingestionRun.id,
          geminiModel,
          unsplashAccessKey,
          countryName: discovery.countryName,
          batchRawText: destinationEnrichments.rawText,
          batchUsageMetadata: destinationEnrichments.usageMetadata,
        });

        if (processed.climateResult.climateStatus === 'imported') {
          climateImportsCompleted += 1;
        }

        if (processed.finalDestination.is_published) {
          destinationsPublished += 1;
        }

        destinationResults.push({
          slug: processed.finalDestination.slug,
          name: processed.finalDestination.name,
          status: processed.finalDestination.is_published ? 'published' : 'draft',
          summary: processed.finalDestination.summary,
          hero_image_url: processed.finalDestination.hero_image_url,
          climate_status: processed.finalDestination.climate_import_status,
          best_months: Array.isArray(processed.finalDestination.best_months)
            ? processed.finalDestination.best_months
            : processed.climateResult.bestMonths,
          publish_readiness: processed.publishReadiness,
        });
      } catch (error) {
        failedDestinations += 1;

        await markDestinationFailed({
          supabase,
          destinationId: destination.id,
          previousClimateImportStatus: destination.climate_import_status,
        });

        destinationResults.push({
          slug: destination.slug,
          name: destination.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown destination failure.',
        });
      }
    }

    const { data: countryPublishReadiness, error: countryPublishReadinessError } = await supabase
      .rpc('refresh_country_publish_readiness', {
        p_country_code: resolvedCountryCode,
      })
      .single();

    if (countryPublishReadinessError) {
      throw countryPublishReadinessError;
    }

    const { data: finalCountry, error: finalCountryError } = await supabase
      .from('countries')
      .select('slug, code, name, summary, seasonal_overview, hero_image_url, is_published')
      .eq('code', resolvedCountryCode)
      .single();

    if (finalCountryError) {
      throw finalCountryError;
    }

    const overallStatus = failedDestinations === 0 ? 'completed' : 'partial';

    const { error: finishRunError } = await supabase
      .from('ingestion_runs')
      .update({
        status: overallStatus === 'completed' ? 'succeeded' : 'partial',
        records_written: destinationResults.length + 1 - failedDestinations,
        records_failed: failedDestinations,
        metadata: {
          ...runMetadata,
          country_publish_readiness: countryPublishReadiness,
          generated_destination_count: discovery.destinations.length,
          published_destination_count: destinationsPublished,
          climate_imports_completed: climateImportsCompleted,
        },
        finished_at: new Date().toISOString(),
      })
      .eq('id', ingestionRun.id);

    if (finishRunError) {
      throw finishRunError;
    }

    return jsonResponse(200, {
      status: overallStatus,
      country: {
        slug: finalCountry.slug,
        code: finalCountry.code,
        name: finalCountry.name,
        is_published: finalCountry.is_published,
        summary: finalCountry.summary,
        seasonal_overview: finalCountry.seasonal_overview,
        hero_image_url: finalCountry.hero_image_url,
      },
      destinations: destinationResults,
      stats: {
        destinations_created: discovery.destinations.length,
        destinations_published: destinationsPublished,
        climate_imports_completed: climateImportsCompleted,
        total_duration_ms: Date.now() - startedAt,
      },
    });
  } catch (error) {
    const isServerMisconfiguration =
      error instanceof Error && error.message.startsWith('Missing required environment variable:');

    return jsonResponse(isServerMisconfiguration ? 500 : 400, {
      error: error instanceof Error ? error.message : 'Invalid compose-country-full request.',
    });
  }
});
