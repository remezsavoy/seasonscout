import { createClient } from 'jsr:@supabase/supabase-js@2';

import { buildCountrySummaryCandidate, buildCountrySummarySignals } from './summaryPipelineV4.js';

type SupabaseClient = ReturnType<typeof createClient>;

type CountryEnrichmentRequestBody = {
  slug?: string;
  slugs?: string[];
  limit?: number;
  allow_non_pending?: boolean;
  overwrite_existing?: boolean;
  dry_run?: boolean;
  require_publish_ready?: boolean;
  source_version?: string;
};

type CountryRecord = {
  code: string;
  slug: string;
  name: string;
  continent: string | null;
  summary: string | null;
  summary_metadata?: Record<string, unknown>;
  hero_image_url: string | null;
  hero_image_source_name: string | null;
  hero_image_source_url: string | null;
  hero_image_attribution_name: string | null;
  hero_image_attribution_url: string | null;
  seasonal_overview: string | null;
  enrichment_status: 'pending' | 'enriching' | 'enriched' | 'failed';
  is_published: boolean;
};

type CountryDestinationRecord = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  travel_tags: string[] | null;
  best_months: number[] | null;
  featured_rank: number | null;
  is_published: boolean;
};

type CountryFeaturedLink = {
  destination_id: string;
  rank: number;
};

type WikimediaSearchResponse = {
  pages?: WikimediaSearchPage[];
};

type WikimediaSearchPage = {
  id: number;
  key: string;
  title: string;
  matched_title?: string | null;
  excerpt?: string | null;
  description?: string | null;
  thumbnail?: {
    url?: string;
  } | null;
};

type WikimediaPageHtmlResponse = {
  key?: string;
  title?: string;
  latest?: {
    id?: number;
  };
  html?: string;
};

type CountrySourceSnapshot = {
  sourceName: string;
  externalId: string | null;
  payload: Record<string, unknown>;
};

type CountrySummaryAttempt = {
  success: boolean;
  summary?: string;
  snapshots: CountrySourceSnapshot[];
  warnings: string[];
  review?: any;
  signals?: any;
};

type UnsplashSearchResponse = {
  results?: UnsplashPhoto[];
};

type UnsplashPhoto = {
  id: string;
  slug?: string;
  alt_description?: string | null;
  description?: string | null;
  width?: number;
  height?: number;
  likes?: number;
  urls: {
    raw?: string;
    regular?: string;
  };
  user?: {
    name?: string;
    username?: string;
    links?: {
      html?: string;
    };
  };
  links?: {
    html?: string;
    download_location?: string;
  };
};

type UnsplashHeroAttempt = {
  success: boolean;
  heroImageUrl?: string;
  attribution?: {
    sourceName: string | null;
    sourceUrl: string | null;
    photographerName: string | null;
    photographerUrl: string | null;
  };
  externalId?: string | null;
  payload: Record<string, unknown>;
  warning?: string;
};

type Selection = {
  allowNonPending: boolean;
  overwriteExisting: boolean;
  dryRun: boolean;
  requirePublishReady: boolean;
  requestedSlugs: string[] | null;
  limit: number;
  sourceVersion: string | null;
};

type CountryPublishReadiness = {
  is_published: boolean;
  missing_requirements: string[];
};

type CountryEnrichmentState = {
  summary: string | null;
  hero_image_url: string | null;
  hero_image_source_name: string | null;
  hero_image_source_url: string | null;
  hero_image_attribution_name: string | null;
  hero_image_attribution_url: string | null;
  seasonal_overview: string | null;
  enrichment_status: CountryRecord['enrichment_status'];
  is_published: boolean;
};

type CountrySummaryChange = 'unchanged' | 'created' | 'updated' | 'still_missing';
type CountryWriteAction =
  | 'updated'
  | 'no_change'
  | 'skipped_missing_readiness'
  | 'would_update'
  | 'would_no_change'
  | 'would_skip_missing_readiness';

type CountryEnrichmentPlan = {
  contextDestinations: CountryDestinationRecord[];
  publishedDestinationCount: number;
  warnings: string[];
  sourceSnapshots: CountrySourceSnapshot[];
  fieldsPlanned: string[];
  hadSummaryBefore: boolean;
  summaryChange: CountrySummaryChange;
  readinessBefore: CountryPublishReadiness;
  readinessAfter: CountryPublishReadiness;
  currentState: CountryEnrichmentState;
  nextState: CountryEnrichmentState;
  summaryMetadata: Record<string, unknown>;
};

type CountryResult = {
  slug: string;
  status: 'enriched' | 'failed' | 'skipped' | 'dry_run';
  is_published: boolean;
  missing_requirements: string[];
  write_action: CountryWriteAction;
  had_summary_before: boolean;
  summary_change: CountrySummaryChange;
  old_summary: string | null;
  new_summary: string | null;
  publish_readiness_before: CountryPublishReadiness;
  publish_readiness_after: CountryPublishReadiness;
  enrichment_status_before: CountryRecord['enrichment_status'];
  enrichment_status_after: CountryRecord['enrichment_status'];
  fields_planned: string[];
  fields_updated: string[];
  warnings?: string[];
};

type CountrySummarySourceKind = 'wikipedia' | 'wikivoyage' | 'destinations' | 'climate';

type CountrySummarySignal = {
  key: string;
  label: string;
  category: 'identity' | 'anchor' | 'trip_style' | 'seasonality';
  source: CountrySummarySourceKind;
  evidence: string;
  weight: number;
};

type CountrySummarySignals = {
  baseIdentity: string;
  travelIdentity: CountrySummarySignal;
  anchors: CountrySummarySignal[];
  tripStyles: CountrySummarySignal[];
  seasonality: {
    include: boolean;
    summaryText: string | null;
    planningLabel: string | null;
    reason: string | null;
    signals: CountrySummarySignal[];
  };
  context: {
    publishedDestinationCount: number;
    featuredDestinationCount: number;
    featuredDestinationNames: string[];
    usedSources: CountrySummarySourceKind[];
  };
};

type CountryContentSourceContext = {
  source: 'wikipedia' | 'wikivoyage';
  success: boolean;
  query: string;
  cleanedText: string;
  description: string | null;
  excerptText: string | null;
  leadParagraph: string | null;
  supportingParagraphs: string[];
  selectedPage: {
    id: number | null;
    key: string | null;
    title: string | null;
    matchedTitle: string | null;
    description: string | null;
    thumbnailUrl: string | null;
  } | null;
  revisionId: number | null;
  warning?: string;
  snapshot: CountrySourceSnapshot;
};

type CountryContentSourceConfig = {
  source: 'wikipedia' | 'wikivoyage';
  sourceName: string;
  searchApiUrl: string;
  pageApiBaseUrl: string;
  query: string;
  paragraphLimit: number;
  sectionHeadings?: string[];
  listHeadings?: string[];
  listItemLimit?: number;
  scorePage: (page: WikimediaSearchPage, country: CountryRecord) => number;
};

type ExtractedSourceSnippet = {
  title: string;
  text: string;
  kind: 'paragraph' | 'list_item' | 'fallback' | 'excerpt';
  order: number;
};

type CountrySummaryAnchorRule = {
  key: string;
  label: string;
  patterns: RegExp[];
  requireAllPatterns?: boolean;
  sourceWeights: Partial<Record<CountrySummarySourceKind, number>>;
  destinationLabelBuilder?: (destinationName: string) => string;
};

type CountryHeroCueRule = {
  key: string;
  querySuffix: string;
  reason: string;
  priority: number;
  patterns: RegExp[];
};

type CountryHeroQuery = {
  query: string;
  reason: string;
  priority: number;
  cueKey: string | null;
};

type ScoredUnsplashCandidate = {
  photo: UnsplashPhoto;
  score: number;
  reasons: string[];
  primaryQuery: string;
  primaryQueryReason: string;
  matchedQueries: string[];
};

type CountryContextSignals = {
  highlights: string[];
  tripStyles: string[];
  planningFocus: string | null;
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

const COUNTRY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ENRICHMENT_BATCH = 3;
const WIKIPEDIA_SOURCE_NAME = 'country_wikipedia_context';
const WIKIVOYAGE_SOURCE_NAME = 'country_wikivoyage_context';
const SUMMARY_PIPELINE_SOURCE_NAME = 'country_summary_pipeline';
const UNSPLASH_SOURCE_NAME = 'country_unsplash_photo';
const DERIVATION_SOURCE_NAME = 'country_enrichment_derivation';
const ENRICHMENT_SOURCE_NAME = 'country_enrichment_pipeline';
const ENRICHMENT_SOURCE_VERSION = '2026-03-14-v4-harden-final';
const WIKIPEDIA_SEARCH_API_URL = 'https://en.wikipedia.org/w/rest.php/v1/search/page';
const WIKIPEDIA_PAGE_API_BASE_URL = 'https://en.wikipedia.org/w/rest.php/v1/page';
const WIKIVOYAGE_SEARCH_API_URL = 'https://en.wikivoyage.org/w/rest.php/v1/search/page';
const WIKIVOYAGE_PAGE_API_BASE_URL = 'https://en.wikivoyage.org/w/rest.php/v1/page';
const UNSPLASH_SEARCH_API_URL = 'https://api.unsplash.com/search/photos';
const UNSPLASH_SOURCE_LABEL = 'Unsplash';
const DEFAULT_WIKIMEDIA_USER_AGENT = 'SeasonScout/0.1 (country enrichment backend)';
const UNSPLASH_SEARCH_RESULT_LIMIT = 8;
const MAX_COUNTRY_HERO_QUERIES = 4;
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const COUNTRY_SUMMARY_ANCHOR_RULES: CountrySummaryAnchorRule[] = [
  {
    key: 'rail-city-hops',
    label: 'rail-linked city hops',
    patterns: [/\b(?:rail|railway|train|shinkansen|bullet train)\b/i, /\b(?:city|cities|district|urban|capital)\b/i],
    requireAllPatterns: true,
    sourceWeights: {
      wikipedia: 8,
      wikivoyage: 20,
      destinations: 14,
    },
  },
  {
    key: 'temple-districts',
    label: 'temple districts and shrines',
    patterns: [/\b(?:temple|temples|shrine|shrines|pagoda|pagodas|monastery|monasteries)\b/i],
    sourceWeights: {
      wikipedia: 8,
      wikivoyage: 20,
      destinations: 16,
    },
    destinationLabelBuilder: (destinationName) => `${toPossessive(destinationName)} temple districts`,
  },
  {
    key: 'historic-gardens',
    label: 'historic gardens and quieter districts',
    patterns: [/\b(?:garden|gardens|historic district|old town|heritage|traditional|castle|palace)\b/i],
    sourceWeights: {
      wikipedia: 10,
      wikivoyage: 16,
      destinations: 14,
    },
    destinationLabelBuilder: (destinationName) => `${toPossessive(destinationName)} gardens`,
  },
  {
    key: 'food-stops',
    label: 'regional food stops',
    patterns: [/\b(?:cuisine|culinary|food|foods|market|markets|street food|ramen|sushi|wine|seafood)\b/i],
    sourceWeights: {
      wikipedia: 6,
      wikivoyage: 18,
      destinations: 14,
    },
  },
  {
    key: 'hot-spring-stays',
    label: 'onsen towns and hot-spring stays',
    patterns: [/\b(?:onsen|hot spring|hot springs|geothermal|thermal)\b/i],
    sourceWeights: {
      wikipedia: 4,
      wikivoyage: 20,
      destinations: 12,
    },
  },
  {
    key: 'mountain-routes',
    label: 'mountain routes and alpine scenery',
    patterns: [/\b(?:mountain|mountains|alpine|hiking|trail|trails|forest|volcanic|volcano|national park|geothermal)\b/i],
    sourceWeights: {
      wikipedia: 10,
      wikivoyage: 16,
      destinations: 12,
    },
  },
  {
    key: 'coastal-islands',
    label: 'coastal islands and ferry routes',
    patterns: [/\b(?:coast|coastal|beach|beaches|island|islands|archipelago|shore|reef|ferry)\b/i],
    sourceWeights: {
      wikipedia: 10,
      wikivoyage: 16,
      destinations: 12,
    },
  },
  {
    key: 'snow-country',
    label: 'snow-country winters and ski terrain',
    patterns: [/\b(?:ski|skiing|snow|snowfall|powder|winter sports)\b/i],
    sourceWeights: {
      wikipedia: 6,
      wikivoyage: 18,
      destinations: 10,
    },
  },
  {
    key: 'wildlife-days',
    label: 'wildlife viewing and reserve days',
    patterns: [/\b(?:wildlife|safari|penguin|whale|birdwatching|game reserve|reserve)\b/i],
    sourceWeights: {
      wikipedia: 8,
      wikivoyage: 16,
      destinations: 10,
    },
  },
  {
    key: 'carnival-festivals',
    label: 'carnival streets and festival routes',
    patterns: [/\b(?:carnival|carnaval|mardi gras|parade|parades|samba|festival|festivals|fiesta|fiestas)\b/i],
    sourceWeights: {
      wikipedia: 10,
      wikivoyage: 18,
      destinations: 14,
    },
  },
  {
    key: 'savanna-safari',
    label: 'savanna drives and safari camps',
    patterns: [/\b(?:savanna|savannah|safari|big five|big 5|game drive|game drives|bush|bushveld|kruger|serengeti|masai mara|okavango)\b/i],
    sourceWeights: {
      wikipedia: 10,
      wikivoyage: 20,
      destinations: 16,
    },
  },
  {
    key: 'river-cruises',
    label: 'river routes and waterway stops',
    patterns: [/\b(?:river cruise|river cruises|river boat|riverboat|felucca|sampan|junk boat|mekong|nile|danube|amazon|waterway|waterways|canal|canals)\b/i],
    sourceWeights: {
      wikipedia: 8,
      wikivoyage: 18,
      destinations: 14,
    },
  },
  {
    key: 'vineyard-regions',
    label: 'vineyard regions and wine-country stays',
    patterns: [/\b(?:vineyard|vineyards|winery|wineries|wine region|wine regions|wine country|wine route|wine routes|viticulture|cellar|cellars|wine estate|wine estates)\b/i],
    sourceWeights: {
      wikipedia: 8,
      wikivoyage: 18,
      destinations: 14,
    },
  },
];

const COUNTRY_HERO_CUE_RULES: CountryHeroCueRule[] = [
  {
    key: 'historic-temples',
    querySuffix: 'temples shrine',
    reason: 'historic temple cue',
    priority: 97,
    patterns: [/\b(?:temple|temples|shrine|shrines|pagoda|pagodas|monastery|monasteries)\b/i],
  },
  {
    key: 'historic-landmarks',
    querySuffix: 'historic landmarks',
    reason: 'historic landmark cue',
    priority: 95,
    patterns: [/\b(?:heritage|historic|unesco|palace|palaces|castle|castles|cathedral|cathedrals|old town|architecture)\b/i],
  },
  {
    key: 'mountain-landscapes',
    querySuffix: 'mountain landscape',
    reason: 'mountain landscape cue',
    priority: 93,
    patterns: [/\b(?:mountain|mountains|alpine|volcanic|volcano|volcanoes|forest|rainforest|national park|parks|fjord|glacier|lake|geothermal)\b/i],
  },
  {
    key: 'coastal-scenery',
    querySuffix: 'coastline landscape',
    reason: 'coastal scenery cue',
    priority: 91,
    patterns: [/\b(?:coast|coastal|beach|beaches|island|islands|archipelago|shore|bay|reef|sea)\b/i],
  },
  {
    key: 'city-skyline',
    querySuffix: 'city skyline',
    reason: 'city skyline cue',
    priority: 89,
    patterns: [/\b(?:city|cities|urban|metropolis|capital|skyline|street|district)\b/i],
  },
  {
    key: 'seasonal-scenery',
    querySuffix: 'seasonal scenery',
    reason: 'seasonal scenery cue',
    priority: 86,
    patterns: [/\b(?:seasonal|spring blossom|blossom season|cherry blossom|autumn leaves|fall foliage|foliage|snow|snowfall)\b/i],
  },
];

const COUNTRY_HERO_BLAND_PATTERNS = [
  /\b(?:background|wallpaper|texture|pattern|abstract|minimal|mockup|studio|stock photo)\b/i,
  /\b(?:close up|close-up|macro|detail shot)\b/i,
];

const COUNTRY_HERO_NON_HERO_PATTERNS = [
  /\b(?:portrait|selfie|face|fashion|wedding|model)\b/i,
  /\b(?:food|meal|dish|coffee|drink|cocktail)\b/i,
  /\b(?:room|interior|bedroom|office|desk)\b/i,
];

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

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function normalizeSlug(value: unknown, fieldName: string) {
  const slug = normalizeText(value, fieldName).toLowerCase();

  if (!COUNTRY_SLUG_PATTERN.test(slug)) {
    throw new Error(`${fieldName} must be lowercase kebab-case.`);
  }

  return slug;
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

function normalizeLimit(value: unknown, defaultValue: number) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_ENRICHMENT_BATCH) {
    throw new Error(
      `limit must be an integer between 1 and ${MAX_ENRICHMENT_BATCH} when provided.`,
    );
  }

  return limit;
}

function parseRequestBody(rawBody: string): CountryEnrichmentRequestBody {
  if (!rawBody.trim()) {
    return {};
  }

  const parsedBody = JSON.parse(rawBody);

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    throw new Error('Request body must be a JSON object.');
  }

  return parsedBody as CountryEnrichmentRequestBody;
}

function deriveSelection(body: CountryEnrichmentRequestBody): Selection {
  const allowNonPending = normalizeBoolean(body.allow_non_pending, 'allow_non_pending', false);
  const overwriteExisting = normalizeBoolean(body.overwrite_existing, 'overwrite_existing', false);
  const dryRun = normalizeBoolean(body.dry_run, 'dry_run', false);
  const requirePublishReady = normalizeBoolean(
    body.require_publish_ready,
    'require_publish_ready',
    false,
  );
  const sourceVersion = body.source_version || null;
  const hasSlug = body.slug !== undefined;
  const hasSlugs = body.slugs !== undefined;

  if (hasSlug && hasSlugs) {
    throw new Error('Provide either slug or slugs, not both.');
  }

  if (!hasSlug && !hasSlugs && (allowNonPending || overwriteExisting)) {
    throw new Error('Override flags require an explicit slug or slugs selection.');
  }

  if (hasSlug) {
    return {
      allowNonPending,
      overwriteExisting,
      dryRun,
      requirePublishReady,
      requestedSlugs: [normalizeSlug(body.slug, 'slug')],
      limit: 1,
      sourceVersion,
    };
  }

  if (hasSlugs) {
    if (!Array.isArray(body.slugs)) {
      throw new Error('slugs must be an array when provided.');
    }

    const requestedSlugs = [...new Set(body.slugs.map((slug) => normalizeSlug(slug, 'slugs item')))];

    if (requestedSlugs.length === 0) {
      throw new Error('At least one slug must be provided when filtering enrichment runs.');
    }

    if (requestedSlugs.length > MAX_ENRICHMENT_BATCH) {
      throw new Error(
        `Requested ${requestedSlugs.length} countries, which exceeds the allowed batch size of ${MAX_ENRICHMENT_BATCH}.`,
      );
    }

    return {
      allowNonPending,
      overwriteExisting,
      dryRun,
      requirePublishReady,
      requestedSlugs,
      limit: requestedSlugs.length,
      sourceVersion,
    };
  }

  return {
    allowNonPending,
    overwriteExisting,
    dryRun,
    requirePublishReady,
    requestedSlugs: null,
    limit: normalizeLimit(body.limit, 1),
    sourceVersion,
  };
}

function toArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function normalizeMonthNumbers(values: number[] | null | undefined) {
  return [...new Set(
    toArray(values)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 12),
  )].sort((left, right) => left - right);
}

function areConsecutiveMonths(currentMonth: number, nextMonth: number) {
  return nextMonth === currentMonth + 1 || (currentMonth === 12 && nextMonth === 1);
}

function orderMonthNumbersForDisplay(values: number[] | null | undefined) {
  const normalizedMonths = normalizeMonthNumbers(values);

  if (normalizedMonths.length < 2) {
    return normalizedMonths;
  }

  let largestGap = 0;
  let rotationIndex = 0;

  for (let index = 0; index < normalizedMonths.length; index += 1) {
    const currentMonth = normalizedMonths[index];
    const nextMonth = normalizedMonths[(index + 1) % normalizedMonths.length];
    const gap = index === normalizedMonths.length - 1
      ? nextMonth + 12 - currentMonth
      : nextMonth - currentMonth;

    if (gap > largestGap) {
      largestGap = gap;
      rotationIndex = (index + 1) % normalizedMonths.length;
    }
  }

  if (largestGap <= 1 || rotationIndex === 0) {
    return normalizedMonths;
  }

  return normalizedMonths.slice(rotationIndex).concat(normalizedMonths.slice(0, rotationIndex));
}

function formatMonthRange(monthNumbers: number[] | null | undefined) {
  const orderedMonthNumbers = orderMonthNumbersForDisplay(monthNumbers);

  if (orderedMonthNumbers.length === 0) {
    return 'the strongest travel window';
  }

  const ranges: Array<[number, number]> = [];
  let start = orderedMonthNumbers[0];
  let end = orderedMonthNumbers[0];

  for (let index = 1; index < orderedMonthNumbers.length; index += 1) {
    const month = orderedMonthNumbers[index];

    if (areConsecutiveMonths(end, month)) {
      end = month;
      continue;
    }

    ranges.push([start, end]);
    start = month;
    end = month;
  }

  ranges.push([start, end]);

  return ranges
    .map(([rangeStart, rangeEnd]) => {
      if (rangeStart === rangeEnd) {
        return monthNumberToName(rangeStart);
      }

      return `${monthNumberToName(rangeStart)} to ${monthNumberToName(rangeEnd)}`;
    })
    .join(', ');
}

function normalizeForComparison(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtmlEntities(value: string) {
  const htmlEntities: Record<string, string> = {
    amp: '&',
    quot: '"',
    apos: "'",
    lt: '<',
    gt: '>',
    nbsp: ' ',
    '#39': "'",
  };

  return value.replace(/&([a-z0-9#]+);/gi, (match, entity) => htmlEntities[entity] ?? match);
}

function cleanExtractedText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/^\s*\d{1,3}(?:\.\d+)?\s+\d{1,3}(?:\.\d+)?\s+\d+\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLowQualityExtractedParagraph(value: string) {
  return /(?:upload\.wikimedia|tools\.wmflabs|resource=|src=|id=\"mw|mw-parser-output)/i.test(value);
}

function stripWikimediaSummaryNoise(value: string) {
  return value
    .replace(/\((?:[^)]{0,140}(?:IPA|pronounced|listen|romanized|lit\.|meaning|help(?:\s+)?info|French:|German:|Spanish:|Arabic:|Chinese:|Japanese:)[^)]*)\)/gi, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/,\s*(?:officially|formerly|historically)\s+[^,.;]+/gi, '')
    .replace(/\bwith a population of[^.]+/gi, ' ')
    .replace(/\bas of \d{4}[^.]+/gi, ' ')
    .replace(/\baccording to [^.]+/gi, ' ')
    .replace(/\bcovering an area of[^.]+/gi, ' ')
    .replace(/\b(?:founded|established|annexed|merged|colonized|independent since)\b[^.]+/gi, ' ')
    .replace(/\b\d{4}\b/g, ' ')
    .replace(/\s*[;:]\s*/g, '. ')
    .replace(/\s+,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLeadParagraph(html: string) {
  const paragraphMatches = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];

  for (const match of paragraphMatches) {
    const paragraphText = cleanExtractedText(stripWikimediaSummaryNoise(match[1] ?? ''));

    if (paragraphText.length >= 120 && !isLowQualityExtractedParagraph(paragraphText)) {
      return paragraphText;
    }
  }

  for (const match of paragraphMatches) {
    const paragraphText = cleanExtractedText(stripWikimediaSummaryNoise(match[1] ?? ''));

    if (paragraphText.length >= 60 && !isLowQualityExtractedParagraph(paragraphText)) {
      return paragraphText;
    }
  }

  return '';
}

function trimToSentenceBoundary(value: string, maxLength: number) {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  const truncatedValue = normalizedValue.slice(0, maxLength);
  const sentenceBoundaryIndex = Math.max(
    truncatedValue.lastIndexOf('. '),
    truncatedValue.lastIndexOf('! '),
    truncatedValue.lastIndexOf('? '),
  );

  if (sentenceBoundaryIndex >= Math.floor(maxLength * 0.6)) {
    return truncatedValue.slice(0, sentenceBoundaryIndex + 1).trim();
  }

  const wordBoundaryIndex = truncatedValue.lastIndexOf(' ');
  return `${truncatedValue.slice(0, wordBoundaryIndex > 0 ? wordBoundaryIndex : maxLength).trim()}.`;
}

function humanizeList(values: string[]) {
  const normalizedValues = [...new Set(values.map((value) => value.trim()).filter(Boolean))];

  if (normalizedValues.length === 0) {
    return '';
  }

  if (normalizedValues.length === 1) {
    return normalizedValues[0];
  }

  if (normalizedValues.length === 2) {
    return `${normalizedValues[0]} and ${normalizedValues[1]}`;
  }

  return `${normalizedValues.slice(0, -1).join(', ')}, and ${normalizedValues[normalizedValues.length - 1]}`;
}

function uniquePhrases(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim() ?? '').filter(Boolean))];
}

function computeCountryPublishReadiness(state: Pick<
  CountryEnrichmentState,
  'summary' | 'hero_image_url' | 'seasonal_overview' | 'enrichment_status'
>): CountryPublishReadiness {
  const missingRequirements: string[] = [];

  if (!state.summary) {
    missingRequirements.push('summary');
  }

  if (!state.hero_image_url) {
    missingRequirements.push('hero_image_url');
  }

  if (!state.seasonal_overview) {
    missingRequirements.push('seasonal_overview');
  }

  if (state.enrichment_status !== 'enriched') {
    missingRequirements.push('enrichment_complete');
  }

  return {
    is_published: missingRequirements.length === 0,
    missing_requirements: missingRequirements,
  };
}

function determineCountrySummaryChange(previousSummary: string | null, nextSummary: string | null): CountrySummaryChange {
  if (!nextSummary) {
    return 'still_missing';
  }

  if (!previousSummary) {
    return 'created';
  }

  if (previousSummary !== nextSummary) {
    return 'updated';
  }

  return 'unchanged';
}

function buildCountryResult(
  country: CountryRecord,
  plan: CountryEnrichmentPlan,
  options: {
    status: CountryResult['status'];
    writeAction: CountryWriteAction;
    isPublished: boolean;
    missingRequirements: string[];
    fieldsUpdated: string[];
    warnings?: string[];
  },
): CountryResult {
  return {
    slug: country.slug,
    status: options.status,
    is_published: options.isPublished,
    missing_requirements: options.missingRequirements,
    write_action: options.writeAction,
    had_summary_before: plan.hadSummaryBefore,
    summary_change: plan.summaryChange,
    old_summary: plan.currentState.summary,
    new_summary: plan.nextState.summary,
    publish_readiness_before: plan.readinessBefore,
    publish_readiness_after: plan.readinessAfter,
    enrichment_status_before: plan.currentState.enrichment_status,
    enrichment_status_after: plan.nextState.enrichment_status,
    fields_planned: plan.fieldsPlanned,
    fields_updated: options.fieldsUpdated,
    warnings: options.warnings && options.warnings.length > 0 ? options.warnings : undefined,
  };
}

function extractOpeningFamilyFromPlan(plan: CountryEnrichmentPlan): string | null {
  const pipelineSnapshot = plan.sourceSnapshots.find(
    (snapshot) => snapshot.sourceName === SUMMARY_PIPELINE_SOURCE_NAME,
  );
  const review = (pipelineSnapshot?.payload as Record<string, unknown> | undefined)?.review as
    | { metrics?: { opening_family?: string } }
    | null
    | undefined;

  return review?.metrics?.opening_family ?? null;
}

type BatchOpeningDiversityCheck = {
  has_warning: boolean;
  threshold_pct: number;
  distribution: Record<string, { count: number; pct: number; slugs: string[] }>;
  warnings: string[];
};

function checkBatchOpeningDiversity(
  entries: Array<{ slug: string; openingFamily: string }>,
  thresholdPct = 30,
): BatchOpeningDiversityCheck {
  if (entries.length < 2) {
    return {
      has_warning: false,
      threshold_pct: thresholdPct,
      distribution: {},
      warnings: [],
    };
  }

  const counts = new Map<string, string[]>();

  for (const entry of entries) {
    const slugs = counts.get(entry.openingFamily) ?? [];
    slugs.push(entry.slug);
    counts.set(entry.openingFamily, slugs);
  }

  const distribution: Record<string, { count: number; pct: number; slugs: string[] }> = {};
  const warnings: string[] = [];

  for (const [family, slugs] of counts) {
    const pct = Math.round((slugs.length / entries.length) * 100);
    distribution[family] = { count: slugs.length, pct, slugs };

    if (pct > thresholdPct) {
      warnings.push(
        `Opening pattern "${family}" appears in ${slugs.length}/${entries.length} summaries (${pct}%), exceeding the ${thresholdPct}% diversity threshold: ${slugs.join(', ')}.`,
      );
    }
  }

  return {
    has_warning: warnings.length > 0,
    threshold_pct: thresholdPct,
    distribution,
    warnings,
  };
}

function summarizeCountryResults(countryResults: CountryResult[]) {
  return {
    already_had_summary_count: countryResults.filter((result) => result.had_summary_before).length,
    missing_summary_before_count: countryResults.filter((result) => !result.had_summary_before).length,
    summaries_created_count: countryResults.filter((result) => result.summary_change === 'created').length,
    summaries_updated_count: countryResults.filter((result) => result.summary_change === 'updated').length,
    unchanged_summary_count: countryResults.filter((result) => result.summary_change === 'unchanged').length,
    still_missing_summary_count: countryResults.filter((result) => result.summary_change === 'still_missing').length,
    would_update_count: countryResults.filter((result) => result.write_action === 'would_update').length,
    would_no_change_count: countryResults.filter((result) => result.write_action === 'would_no_change').length,
    would_skip_missing_readiness_count: countryResults.filter((result) => result.write_action === 'would_skip_missing_readiness').length,
    updated_count: countryResults.filter((result) => result.write_action === 'updated').length,
    no_change_count: countryResults.filter((result) => result.write_action === 'no_change').length,
    skipped_missing_readiness_count: countryResults.filter((result) => result.write_action === 'skipped_missing_readiness').length,
  };
}

function buildCurrentCountryEnrichmentState(country: CountryRecord): CountryEnrichmentState {
  return {
    summary: normalizeOptionalText(country.summary),
    hero_image_url: normalizeOptionalText(country.hero_image_url),
    hero_image_source_name: normalizeOptionalText(country.hero_image_source_name),
    hero_image_source_url: normalizeOptionalText(country.hero_image_source_url),
    hero_image_attribution_name: normalizeOptionalText(country.hero_image_attribution_name),
    hero_image_attribution_url: normalizeOptionalText(country.hero_image_attribution_url),
    seasonal_overview: normalizeOptionalText(country.seasonal_overview),
    enrichment_status: country.enrichment_status,
    is_published: country.is_published,
  };
}

function monthNumberToName(monthNumber: number) {
  return MONTH_NAMES[monthNumber - 1] ?? `Month ${monthNumber}`;
}

function buildWikimediaHeaders() {
  const userAgent = Deno.env.get('SEASONSCOUT_WIKIMEDIA_USER_AGENT') || DEFAULT_WIKIMEDIA_USER_AGENT;

  return {
    'api-user-agent': userAgent,
    'user-agent': userAgent,
  };
}

async function fetchJson<T>(url: string, init: RequestInit, label: string) {
  const response = await fetch(url, init);

  if (!response.ok) {
    const failureBody = await response.text();
    throw new Error(`${label} failed with ${response.status}: ${failureBody.slice(0, 400)}`);
  }

  return response.json() as Promise<T>;
}

function matchesAnyPattern(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function normalizeIdentityPhrase(value: string | null | undefined) {
  const cleanedValue = normalizeOptionalText(value);

  if (!cleanedValue) {
    return null;
  }

  const strippedValue = cleanExtractedText(stripWikimediaSummaryNoise(cleanedValue))
    .replace(/\.$/, '')
    .trim();

  if (!strippedValue) {
    return null;
  }

  const lowerValue = strippedValue.toLowerCase();

  if (!/\b(?:country|nation|state|republic|kingdom)\b/.test(lowerValue)) {
    return null;
  }

  if (lowerValue.startsWith('a ') || lowerValue.startsWith('an ')) {
    return lowerValue;
  }

  return `a ${lowerValue}`;
}

function toPossessive(value: string) {
  return /s$/i.test(value) ? `${value}'` : `${value}'s`;
}

function capitalizeFirstLetter(value: string) {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function extractParagraphs(
  html: string,
  options: { minLength?: number; maxCount?: number } = {},
) {
  const minLength = options.minLength ?? 60;
  const maxCount = options.maxCount ?? 5;
  const paragraphMatches = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
  const paragraphs = uniquePhrases(
    paragraphMatches.map((match) => cleanExtractedText(stripWikimediaSummaryNoise(match[1] ?? ''))),
  )
    .filter((paragraph) => paragraph.length >= minLength)
    .filter((paragraph) => !isLowQualityExtractedParagraph(paragraph))
    .slice(0, maxCount);

  return paragraphs;
}

function extractSectionParagraphs(
  html: string,
  sectionHeadings: string[],
  maxPerSection = 2,
) {
  const headingMatches = [...html.matchAll(/<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const normalizedHeadings = sectionHeadings.map((heading) => normalizeForComparison(heading));
  const extracted: Array<{ title: string; paragraph: string }> = [];

  for (let index = 0; index < headingMatches.length; index += 1) {
    const currentHeading = headingMatches[index];
    const headingTitle = cleanExtractedText(currentHeading[2] ?? '');
    const normalizedHeadingTitle = normalizeForComparison(headingTitle);

    if (!normalizedHeadings.includes(normalizedHeadingTitle)) {
      continue;
    }

    const sectionStart = (currentHeading.index ?? 0) + currentHeading[0].length;
    const nextHeadingIndex = headingMatches[index + 1]?.index ?? html.length;
    const sectionHtml = html.slice(sectionStart, nextHeadingIndex);
    const paragraphs = extractParagraphs(sectionHtml, { minLength: 50, maxCount: maxPerSection });

    for (const paragraph of paragraphs) {
      extracted.push({
        title: headingTitle,
        paragraph,
      });
    }
  }

  return extracted;
}

function extractSectionListItems(
  html: string,
  sectionHeadings: string[],
  maxPerSection = 1,
) {
  const headingMatches = [...html.matchAll(/<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const normalizedHeadings = sectionHeadings.map((heading) => normalizeForComparison(heading));
  const extracted: Array<{ title: string; item: string }> = [];

  for (let index = 0; index < headingMatches.length; index += 1) {
    const currentHeading = headingMatches[index];
    const headingTitle = cleanExtractedText(currentHeading[2] ?? '');
    const normalizedHeadingTitle = normalizeForComparison(headingTitle);

    if (!normalizedHeadings.includes(normalizedHeadingTitle)) {
      continue;
    }

    const sectionStart = (currentHeading.index ?? 0) + currentHeading[0].length;
    const nextHeadingIndex = headingMatches[index + 1]?.index ?? html.length;
    const sectionHtml = html.slice(sectionStart, nextHeadingIndex);
    const items = uniquePhrases(
      [...sectionHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((match) =>
        cleanExtractedText(stripWikimediaSummaryNoise(match[1] ?? ''))
      ),
    )
      .filter((item) => item.length >= 24)
      .slice(0, maxPerSection);

    for (const item of items) {
      extracted.push({
        title: headingTitle,
        item,
      });
    }
  }

  return extracted;
}

function extractMatchingParagraphs(
  html: string,
  patterns: RegExp[],
  maxCount: number,
) {
  return uniquePhrases(
    [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) =>
      cleanExtractedText(stripWikimediaSummaryNoise(match[1] ?? ''))
    ),
  )
    .filter((paragraph) => paragraph.length >= 60)
    .filter((paragraph) => !isLowQualityExtractedParagraph(paragraph))
    .filter((paragraph) => patterns.some((pattern) => pattern.test(paragraph)))
    .slice(0, maxCount);
}

function scoreSupportingSourceSnippet(source: CountryContentSourceConfig['source'], snippet: ExtractedSourceSnippet) {
  const normalizedTitle = normalizeForComparison(snippet.title);
  const normalizedText = normalizeForComparison(snippet.text);
  let score = 0;

  if (snippet.kind === 'list_item') {
    score += 14;
  }

  if (normalizedTitle === 'climate') {
    score += 22;
  }

  if (normalizedTitle === 'cities') {
    score += 18;
  }

  if (normalizedTitle === 'other destinations') {
    score += 8;
  }

  if (['get around', 'understand', 'do'].includes(normalizedTitle)) {
    score += 10;
  }

  if (/\b(?:spring|autumn|fall|cherry blossom|foliage)\b/.test(normalizedText)) {
    score += 22;
  }

  if (/\b(?:onsen|hot spring|hot springs|bath|bathing|ryokan)\b/.test(normalizedText)) {
    score += 20;
  }

  if (/\b(?:rail|train|shinkansen|bullet train|transport)\b/.test(normalizedText)) {
    score += 18;
  }

  if (/\b(?:city|cities|district|districts|capital|financial center|modern)\b/.test(normalizedText)) {
    score += 12;
  }

  if (/\b(?:food|foods|market|markets|culinary|street life)\b/.test(normalizedText)) {
    score += 10;
  }

  if (/\b(?:temple|shrines?|historic|heritage|garden|gardens)\b/.test(normalizedText)) {
    score += 10;
  }

  if (/\b(?:often called|land of the rising sun|population|officially|country in east asia)\b/.test(normalizedText)) {
    score -= 22;
  }

  if (/\bnot really known for\b/.test(normalizedText)) {
    score -= 12;
  }

  if (source === 'wikivoyage') {
    score += 4;
  }

  return score;
}

function selectSupportingSourceSnippets(
  source: CountryContentSourceConfig['source'],
  snippets: ExtractedSourceSnippet[],
  maxCount: number,
) {
  const dedupedSnippets = snippets.filter((snippet, index) =>
    snippets.findIndex((entry) => normalizeForComparison(entry.text) === normalizeForComparison(snippet.text)) === index
  );

  return [...dedupedSnippets]
    .sort((left, right) =>
      scoreSupportingSourceSnippet(source, right) - scoreSupportingSourceSnippet(source, left)
      || left.order - right.order
    )
    .slice(0, maxCount);
}

function findFirstMatchingFragment(fragments: string[], patterns: RegExp[]) {
  for (const fragment of fragments) {
    if (matchesAnyPattern(fragment, patterns)) {
      return trimToSentenceBoundary(fragment, 140);
    }
  }

  return trimToSentenceBoundary(fragments[0] ?? '', 140);
}

function includesAnyNormalizedFragment(values: string[], fragments: string[]) {
  return values.some((value) => fragments.some((fragment) => value.includes(fragment)));
}

function extractCountryBaseIdentity(
  country: CountryRecord,
  wikipediaContext: CountryContentSourceContext,
) {
  const descriptionIdentity = normalizeIdentityPhrase(wikipediaContext.description);

  if (descriptionIdentity) {
    return descriptionIdentity;
  }

  const leadText = wikipediaContext.leadParagraph ?? wikipediaContext.cleanedText;

  if (leadText) {
    const firstSentence = leadText.split(/[.!?]/, 1)[0] ?? '';
    const identityMatch = firstSentence.match(
      new RegExp(`^${escapeRegex(country.name)}\\s+is\\s+([^.,;]{0,120})`, 'i'),
    );
    const leadIdentity = normalizeIdentityPhrase(identityMatch?.[1] ?? null);

    if (leadIdentity) {
      return leadIdentity;
    }
  }

  return country.continent ? `a country in ${country.continent}` : 'a country';
}

function buildCountrySourceSignalContexts(
  wikipediaContext: CountryContentSourceContext,
  wikivoyageContext: CountryContentSourceContext,
  contextDestinations: CountryDestinationRecord[],
) {
  const destinationFragments = contextDestinations.flatMap((destination) =>
    [destination.name, destination.summary, ...toArray(destination.travel_tags)].filter(Boolean) as string[]
  );

  return [
    {
      source: 'wikipedia' as const,
      text: wikipediaContext.cleanedText,
      fragments: uniquePhrases(
        [wikipediaContext.description, wikipediaContext.leadParagraph, ...wikipediaContext.supportingParagraphs]
          .filter(Boolean) as string[],
      ),
    },
    {
      source: 'wikivoyage' as const,
      text: wikivoyageContext.cleanedText,
      fragments: uniquePhrases(
        [wikivoyageContext.description, wikivoyageContext.leadParagraph, ...wikivoyageContext.supportingParagraphs]
          .filter(Boolean) as string[],
      ),
    },
    {
      source: 'destinations' as const,
      text: normalizeForComparison(destinationFragments.join(' ')),
      fragments: uniquePhrases(destinationFragments),
    },
  ];
}

function scoreWikipediaPage(page: WikimediaSearchPage, country: CountryRecord) {
  const normalizedName = normalizeForComparison(country.name);
  const pageTitle = normalizeForComparison(page.title);
  const matchedTitle = normalizeForComparison(page.matched_title ?? '');
  const description = normalizeForComparison(page.description ?? '');

  let score = 0;

  if (pageTitle === normalizedName) {
    score += 120;
  }

  if (matchedTitle === normalizedName) {
    score += 80;
  }

  if (pageTitle.includes(normalizedName)) {
    score += 30;
  }

  if (matchedTitle.includes(normalizedName)) {
    score += 20;
  }

  if (/\b(?:country|nation|state|republic|kingdom)\b/.test(description)) {
    score += 35;
  }

  if (/\b(?:disambiguation|history|geography|economy|demographics|flag|culture of|music|film|language)\b/.test(description)) {
    score -= 90;
  }

  if (page.thumbnail?.url) {
    score += 4;
  }

  return score;
}

function scoreWikivoyagePage(page: WikimediaSearchPage, country: CountryRecord) {
  const normalizedName = normalizeForComparison(country.name);
  const pageTitle = normalizeForComparison(page.title);
  const matchedTitle = normalizeForComparison(page.matched_title ?? '');
  const description = normalizeForComparison(page.description ?? '');

  let score = 0;

  if (pageTitle === normalizedName) {
    score += 130;
  }

  if (pageTitle.includes(normalizedName)) {
    score += 25;
  }

  if (matchedTitle === normalizedName) {
    score += 90;
  }

  if (/\b(?:country|region|archipelago|island)\b/.test(description)) {
    score += 20;
  }

  if (/\b(?:phrasebook|itinerary|travel topic|user|template|category|guidebook)\b/.test(description)) {
    score -= 90;
  }

  return score;
}

async function fetchCountryContentSourceContext(
  country: CountryRecord,
  config: CountryContentSourceConfig,
): Promise<CountryContentSourceContext> {
  const sourceLabel = config.source === 'wikipedia' ? 'Wikipedia' : 'Wikivoyage';

  const buildFailureContext = (warning: string, payload: Record<string, unknown>): CountryContentSourceContext => ({
    source: config.source,
    success: false,
    query: config.query,
    cleanedText: '',
    description: null,
    excerptText: null,
    leadParagraph: null,
    supportingParagraphs: [],
    selectedPage: null,
    revisionId: null,
    warning,
    snapshot: {
      sourceName: config.sourceName,
      externalId: null,
      payload,
    },
  });

  try {
    const searchUrl = new URL(config.searchApiUrl);
    searchUrl.searchParams.set('q', config.query);
    searchUrl.searchParams.set('limit', '5');

    const searchResponse = await fetchJson<WikimediaSearchResponse>(
      searchUrl.toString(),
      {
        headers: buildWikimediaHeaders(),
      },
      `${sourceLabel} search request for ${country.slug}`,
    );
    const pages = toArray(searchResponse.pages);

    if (pages.length === 0) {
      return buildFailureContext(
        `No ${sourceLabel} context candidate was found for ${country.slug}.`,
        {
          request: {
            endpoint: config.searchApiUrl,
            query: config.query,
            limit: 5,
          },
          error: 'No search results returned.',
        },
      );
    }

    const selectedPage = [...pages].sort(
      (left, right) => config.scorePage(right, country) - config.scorePage(left, country),
    )[0];
    const pageHtmlUrl = `${config.pageApiBaseUrl}/${encodeURIComponent(selectedPage.key)}/with_html`;
    const pageResponse = await fetchJson<WikimediaPageHtmlResponse>(
      pageHtmlUrl,
      {
        headers: buildWikimediaHeaders(),
      },
      `${sourceLabel} page request for ${country.slug}`,
    );
    const description = normalizeOptionalText(selectedPage.description);
    const excerptText = normalizeOptionalText(cleanExtractedText(selectedPage.excerpt ?? ''));
    const leadParagraph = normalizeOptionalText(extractLeadParagraph(pageResponse.html ?? ''));
    const sectionParagraphs = config.sectionHeadings
      ? extractSectionParagraphs(pageResponse.html ?? '', config.sectionHeadings, 4)
      : [];
    const sectionListItems = config.listHeadings
      ? extractSectionListItems(pageResponse.html ?? '', config.listHeadings, config.listItemLimit ?? 1)
      : [];
    const cueParagraphs = config.source === 'wikivoyage'
      ? extractMatchingParagraphs(
        pageResponse.html ?? '',
        [
          /\b(?:onsen|hot spring|hot springs|thermal|ryokan)\b/i,
          /\b(?:spring|autumn|fall)\b[^.]{0,100}\b(?:aim|best|excellent|pleasant|comfortable|reliable)\b/i,
        ],
        6,
      )
      : [];
    const fallbackParagraphs = extractParagraphs(pageResponse.html ?? '', {
      minLength: 60,
      maxCount: config.source === 'wikivoyage' ? 60 : 18,
    });
    let snippetOrder = 0;
    const supportingSnippetCandidates: ExtractedSourceSnippet[] = [
      ...sectionParagraphs.map((sectionParagraph) => ({
        title: sectionParagraph.title,
        text: sectionParagraph.paragraph,
        kind: 'paragraph' as const,
        order: snippetOrder++,
      })),
      ...sectionListItems.map((sectionListItem) => ({
        title: sectionListItem.title,
        text: sectionListItem.item,
        kind: 'list_item' as const,
        order: snippetOrder++,
      })),
      ...cueParagraphs.map((paragraph) => ({
        title: 'Travel cue',
        text: paragraph,
        kind: 'paragraph' as const,
        order: snippetOrder++,
      })),
      ...fallbackParagraphs
        .filter((paragraph) => paragraph !== leadParagraph)
        .map((paragraph) => ({
          title: 'Fallback',
          text: paragraph,
          kind: 'fallback' as const,
          order: snippetOrder++,
        })),
      ...(excerptText
        ? [{
          title: 'Excerpt',
          text: excerptText,
          kind: 'excerpt' as const,
          order: snippetOrder++,
        }]
        : []),
    ];
    const selectedSupportingSnippets = selectSupportingSourceSnippets(
      config.source,
      supportingSnippetCandidates,
      config.paragraphLimit,
    );
    const supportingParagraphs = selectedSupportingSnippets.map((snippet) => snippet.text);
    const cleanedText = normalizeOptionalText(
      stripWikimediaSummaryNoise(
        [
          description ? `${country.name} is ${description}.` : null,
          leadParagraph,
          ...supportingParagraphs,
        ]
          .filter(Boolean)
          .join(' '),
      ),
    ) ?? '';

    if (!cleanedText) {
      return buildFailureContext(
        `${sourceLabel} did not return usable context for ${country.slug}.`,
        {
          request: {
            search_endpoint: config.searchApiUrl,
            page_endpoint: pageHtmlUrl,
            query: config.query,
            limit: 5,
          },
          selected_page: {
            id: selectedPage.id,
            key: selectedPage.key,
            title: selectedPage.title,
            description: selectedPage.description ?? null,
          },
          error: 'The selected page did not contain usable context paragraphs.',
        },
      );
    }

    return {
      source: config.source,
      success: true,
      query: config.query,
      cleanedText,
      description,
      excerptText,
      leadParagraph,
      supportingParagraphs,
      selectedPage: {
        id: selectedPage.id ?? null,
        key: selectedPage.key ?? null,
        title: selectedPage.title ?? null,
        matchedTitle: selectedPage.matched_title ?? null,
        description: selectedPage.description ?? null,
        thumbnailUrl: selectedPage.thumbnail?.url ?? null,
      },
      revisionId: pageResponse.latest?.id ?? null,
      snapshot: {
        sourceName: config.sourceName,
        externalId: selectedPage.key ?? null,
        payload: {
          request: {
            search_endpoint: config.searchApiUrl,
            page_endpoint: pageHtmlUrl,
            query: config.query,
            limit: 5,
          },
          selected_page: {
            id: selectedPage.id,
            key: selectedPage.key,
            title: selectedPage.title,
            matched_title: selectedPage.matched_title ?? null,
            description: selectedPage.description ?? null,
            thumbnail_url: selectedPage.thumbnail?.url ?? null,
          },
          revision_id: pageResponse.latest?.id ?? null,
          description,
          supporting_excerpt: excerptText,
          lead_paragraph: leadParagraph,
          supporting_paragraphs: supportingParagraphs,
          section_snippets: sectionParagraphs.map((sectionParagraph) => ({
            title: sectionParagraph.title,
            paragraph: sectionParagraph.paragraph,
          })),
          section_list_items: sectionListItems.map((sectionListItem) => ({
            title: sectionListItem.title,
            item: sectionListItem.item,
          })),
          cleaned_context: cleanedText,
        },
      },
    };
  } catch (error) {
    return buildFailureContext(
      error instanceof Error ? error.message : `${sourceLabel} context enrichment failed for ${country.slug}.`,
      {
        request: {
          endpoint: config.searchApiUrl,
          query: config.query,
          limit: 5,
        },
        error: error instanceof Error ? error.message : `Unknown ${sourceLabel} enrichment failure.`,
      },
    );
  }
}

async function fetchWikipediaCountryContext(country: CountryRecord) {
  return fetchCountryContentSourceContext(country, {
    source: 'wikipedia',
    sourceName: WIKIPEDIA_SOURCE_NAME,
    searchApiUrl: WIKIPEDIA_SEARCH_API_URL,
    pageApiBaseUrl: WIKIPEDIA_PAGE_API_BASE_URL,
    query: `${country.name} country`,
    paragraphLimit: 2,
    scorePage: scoreWikipediaPage,
  });
}

async function fetchWikivoyageCountryContext(country: CountryRecord) {
  return fetchCountryContentSourceContext(country, {
    source: 'wikivoyage',
    sourceName: WIKIVOYAGE_SOURCE_NAME,
    searchApiUrl: WIKIVOYAGE_SEARCH_API_URL,
    pageApiBaseUrl: WIKIVOYAGE_PAGE_API_BASE_URL,
    query: country.name,
    paragraphLimit: 5,
    sectionHeadings: ['Climate', 'Get around', 'Understand', 'Do', 'Eat', 'Drink', 'See'],
    listHeadings: ['Cities', 'Other destinations'],
    listItemLimit: 1,
    scorePage: scoreWikivoyagePage,
  });
}

async function fetchCountrySummaryCandidate(
  country: CountryRecord,
  contextDestinations: CountryDestinationRecord[],
  publishedDestinationCount: number,
): Promise<CountrySummaryAttempt> {
  const [wikipediaContext, wikivoyageContext] = await Promise.all([
    fetchWikipediaCountryContext(country),
    fetchWikivoyageCountryContext(country),
  ]);
  const generatedSummary = buildCountrySummaryCandidate({
    country,
    wikipediaContext,
    wikivoyageContext,
    contextDestinations,
    publishedDestinationCount,
  });
  const summarySignals = generatedSummary?.signals ?? buildCountrySummarySignals(
    country,
    wikipediaContext,
    wikivoyageContext,
    contextDestinations,
    publishedDestinationCount,
  );
  const warnings = uniquePhrases([
    wikipediaContext.warning,
    wikivoyageContext.warning,
    ...(generatedSummary?.validation.warnings ?? []),
    ...((generatedSummary?.review.issues ?? [])
      .filter((issue) => issue.severity === 'warn')
      .map((issue) => issue.message)),
    ...(!(generatedSummary?.validation.isValid) ? generatedSummary?.validation.errors ?? [] : []),
  ]);
  const snapshots: CountrySourceSnapshot[] = [
    wikipediaContext.snapshot,
    wikivoyageContext.snapshot,
    {
      sourceName: SUMMARY_PIPELINE_SOURCE_NAME,
      externalId: null,
      payload: {
        source_statuses: {
          wikipedia: {
            success: wikipediaContext.success,
            query: wikipediaContext.query,
            selected_page: wikipediaContext.selectedPage,
            warning: wikipediaContext.warning ?? null,
          },
          wikivoyage: {
            success: wikivoyageContext.success,
            query: wikivoyageContext.query,
            selected_page: wikivoyageContext.selectedPage,
            warning: wikivoyageContext.warning ?? null,
          },
        },
        summary_signals: {
          base_identity: summarySignals.baseIdentity,
          travel_identity: summarySignals.travelIdentity,
          anchors: summarySignals.anchors,
          trip_styles: summarySignals.tripStyles,
          seasonality: summarySignals.seasonality,
          context: summarySignals.context,
        },
        selected_variant: generatedSummary?.selectedVariant ?? null,
        validation: generatedSummary?.validation ?? null,
        review: generatedSummary?.review ?? null,
        candidate_summary: generatedSummary?.summary ?? null,
        normalized_summary: generatedSummary?.validation.isValid ? generatedSummary.summary : null,
        summary_score: generatedSummary?.validation.score ?? null,
      },
    },
  ];

  if (!generatedSummary || !generatedSummary.validation.isValid) {
    return {
      success: false,
      snapshots,
      warnings: warnings.length > 0 ? warnings : [`No valid country summary could be generated for ${country.slug}.`],
    };
  }

  return {
    success: true,
    summary: generatedSummary.summary,
    snapshots,
    warnings,
    review: generatedSummary.review,
    signals: summarySignals,
  };
}

function buildUnsplashHeroUrl(photo: UnsplashPhoto) {
  if (photo.urls.raw) {
    const heroUrl = new URL(photo.urls.raw);
    heroUrl.searchParams.set('w', '1600');
    heroUrl.searchParams.set('fit', 'crop');
    heroUrl.searchParams.set('auto', 'format');
    heroUrl.searchParams.set('q', '80');
    return heroUrl.toString();
  }

  return photo.urls.regular ?? '';
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

function deriveCountryHeroCueRules(
  summary: string | null,
  contextDestinations: CountryDestinationRecord[],
) {
  const contextCorpus = normalizeForComparison(
    [
      summary,
      ...contextDestinations.flatMap((destination) => [
        destination.name,
        destination.summary,
        ...toArray(destination.travel_tags),
      ]),
    ]
      .filter(Boolean)
      .join(' '),
  );

  return COUNTRY_HERO_CUE_RULES
    .filter((rule) => matchesAnyPattern(contextCorpus, rule.patterns))
    .sort((left, right) => right.priority - left.priority);
}

function buildCountryHeroSearchQueries(
  country: CountryRecord,
  contextDestinations: CountryDestinationRecord[],
  preferredCueRules: CountryHeroCueRule[],
) {
  const primaryDestinationName = normalizeOptionalText(contextDestinations[0]?.name);
  const queryCandidates = [
    {
      query: `${country.name} iconic landmarks`,
      reason: 'country iconic landmark query',
      priority: 100,
      cueKey: null,
    },
    ...preferredCueRules.slice(0, 2).map((rule) => ({
      query: `${country.name} ${rule.querySuffix}`,
      reason: rule.reason,
      priority: rule.priority,
      cueKey: rule.key,
    })),
    primaryDestinationName
      ? {
        query: `${country.name} ${primaryDestinationName}`,
        reason: 'featured destination cue',
        priority: 84,
        cueKey: null,
      }
      : null,
    {
      query: `${country.name} scenic landscape`,
      reason: 'country scenic landscape query',
      priority: 82,
      cueKey: 'mountain-landscapes',
    },
  ].filter(Boolean) as CountryHeroQuery[];

  const dedupedQueries = new Map<string, CountryHeroQuery>();

  for (const queryCandidate of queryCandidates) {
    const dedupeKey = normalizeForComparison(queryCandidate.query);

    if (!dedupedQueries.has(dedupeKey)) {
      dedupedQueries.set(dedupeKey, queryCandidate);
    }
  }

  return [...dedupedQueries.values()].slice(0, MAX_COUNTRY_HERO_QUERIES);
}

function normalizeUnsplashPhotoText(photo: UnsplashPhoto) {
  return normalizeForComparison(
    [
      photo.slug,
      photo.alt_description,
      photo.description,
      photo.user?.username,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function scoreCountryHeroPhoto(
  photo: UnsplashPhoto,
  country: CountryRecord,
  searchQuery: CountryHeroQuery,
  preferredCueRules: CountryHeroCueRule[],
  contextDestinations: CountryDestinationRecord[],
) {
  const photoText = normalizeUnsplashPhotoText(photo);
  const featuredDestinationNames = uniquePhrases(contextDestinations.map((destination) => destination.name))
    .map((name) => normalizeForComparison(name));
  const countryName = normalizeForComparison(country.name);
  const reasons = [searchQuery.reason];
  let score = searchQuery.priority;

  if (photoText.includes(countryName)) {
    score += 28;
    reasons.push('country mention');
  }

  const matchedDestinationNames = featuredDestinationNames.filter((name) => name && photoText.includes(name));

  if (matchedDestinationNames.length > 0) {
    score += Math.min(24, matchedDestinationNames.length * 12);
    reasons.push('featured destination match');
  }

  const matchedPreferredCueRules = preferredCueRules.filter((rule) => matchesAnyPattern(photoText, rule.patterns));

  if (matchedPreferredCueRules.length > 0) {
    score += matchedPreferredCueRules.length * 10;
    reasons.push('preferred travel cue');
  }

  if (searchQuery.cueKey && matchedPreferredCueRules.some((rule) => rule.key === searchQuery.cueKey)) {
    score += 12;
    reasons.push('query cue match');
  }

  const landscapeRatio = Number(photo.width) > 0 && Number(photo.height) > 0
    ? Number(photo.width) / Number(photo.height)
    : null;

  if (landscapeRatio !== null) {
    if (landscapeRatio >= 1.9) {
      score += 20;
      reasons.push('panoramic frame');
    } else if (landscapeRatio >= 1.55) {
      score += 14;
      reasons.push('landscape frame');
    } else if (landscapeRatio < 1.25) {
      score -= 22;
      reasons.push('weak hero ratio');
    }
  }

  if (Number.isFinite(photo.likes)) {
    score += Math.min(12, Math.log10(Number(photo.likes) + 1) * 5);
  }

  const blandHitCount = COUNTRY_HERO_BLAND_PATTERNS.filter((pattern) => pattern.test(photoText)).length;

  if (blandHitCount > 0) {
    score -= blandHitCount * 18;
    reasons.push('generic image cue');
  }

  const nonHeroHitCount = COUNTRY_HERO_NON_HERO_PATTERNS.filter((pattern) => pattern.test(photoText)).length;

  if (nonHeroHitCount > 0) {
    score -= nonHeroHitCount * 14;
    reasons.push('non-hero subject cue');
  }

  if (!photoText) {
    score -= 4;
  }

  return {
    score,
    reasons,
  };
}

async function fetchUnsplashHeroCandidate(
  country: CountryRecord,
  unsplashAccessKey: string,
  summary: string | null,
  contextDestinations: CountryDestinationRecord[],
): Promise<UnsplashHeroAttempt> {
  const preferredCueRules = deriveCountryHeroCueRules(summary, contextDestinations);
  const searchQueries = buildCountryHeroSearchQueries(country, contextDestinations, preferredCueRules);

  try {
    const candidateById = new Map<string, ScoredUnsplashCandidate>();
    const requestSummaries: Array<Record<string, unknown>> = [];
    const requestErrors: Array<Record<string, unknown>> = [];

    for (const searchQuery of searchQueries) {
      const searchUrl = new URL(UNSPLASH_SEARCH_API_URL);
      searchUrl.searchParams.set('query', searchQuery.query);
      searchUrl.searchParams.set('orientation', 'landscape');
      searchUrl.searchParams.set('per_page', String(UNSPLASH_SEARCH_RESULT_LIMIT));
      searchUrl.searchParams.set('content_filter', 'high');

      try {
        const searchResponse = await fetchJson<UnsplashSearchResponse>(
          searchUrl.toString(),
          {
            headers: {
              authorization: `Client-ID ${unsplashAccessKey}`,
              'accept-version': 'v1',
            },
          },
          `Unsplash search request for ${country.slug}`,
        );

        const results = toArray(searchResponse.results);
        requestSummaries.push({
          query: searchQuery.query,
          reason: searchQuery.reason,
          priority: searchQuery.priority,
          result_count: results.length,
        });

        for (const photo of results) {
          const heroImageUrl = buildUnsplashHeroUrl(photo);

          if (!heroImageUrl) {
            continue;
          }

          const nextCandidate = scoreCountryHeroPhoto(
            photo,
            country,
            searchQuery,
            preferredCueRules,
            contextDestinations,
          );
          const existingCandidate = candidateById.get(photo.id);

          if (existingCandidate) {
            existingCandidate.matchedQueries = uniquePhrases([
              ...existingCandidate.matchedQueries,
              searchQuery.query,
            ]);

            if (nextCandidate.score > existingCandidate.score) {
              existingCandidate.photo = photo;
              existingCandidate.score = nextCandidate.score;
              existingCandidate.reasons = nextCandidate.reasons;
              existingCandidate.primaryQuery = searchQuery.query;
              existingCandidate.primaryQueryReason = searchQuery.reason;
            }

            continue;
          }

          candidateById.set(photo.id, {
            photo,
            score: nextCandidate.score,
            reasons: nextCandidate.reasons,
            primaryQuery: searchQuery.query,
            primaryQueryReason: searchQuery.reason,
            matchedQueries: [searchQuery.query],
          });
        }
      } catch (error) {
        requestErrors.push({
          query: searchQuery.query,
          reason: searchQuery.reason,
          error: error instanceof Error ? error.message : 'Unknown Unsplash search failure.',
        });
      }
    }

    const rankedCandidates = [...candidateById.values()]
      .map((candidate) => ({
        ...candidate,
        finalScore: candidate.score + Math.min(10, (candidate.matchedQueries.length - 1) * 5),
      }))
      .sort((left, right) => right.finalScore - left.finalScore);

    const selectedCandidate = rankedCandidates[0];

    if (!selectedCandidate) {
      return {
        success: false,
        warning: `No Unsplash image candidate was found for ${country.slug}.`,
        payload: {
          request: {
            endpoint: UNSPLASH_SEARCH_API_URL,
            queries: searchQueries.map((searchQuery) => ({
              query: searchQuery.query,
              reason: searchQuery.reason,
              priority: searchQuery.priority,
            })),
            orientation: 'landscape',
            per_page: UNSPLASH_SEARCH_RESULT_LIMIT,
            content_filter: 'high',
          },
          preferred_cues: preferredCueRules.map((rule) => ({
            key: rule.key,
            query_suffix: rule.querySuffix,
            reason: rule.reason,
          })),
          requests: requestSummaries,
          request_errors: requestErrors,
          error: 'No usable search results returned.',
        },
      };
    }

    const heroImageUrl = buildUnsplashHeroUrl(selectedCandidate.photo);

    return {
      success: true,
      heroImageUrl,
      attribution: {
        sourceName: UNSPLASH_SOURCE_LABEL,
        sourceUrl: buildUnsplashReferralUrl(selectedCandidate.photo.links?.html ?? 'https://unsplash.com'),
        photographerName: normalizeOptionalText(selectedCandidate.photo.user?.name),
        photographerUrl: buildUnsplashReferralUrl(selectedCandidate.photo.user?.links?.html ?? null),
      },
      externalId: selectedCandidate.photo.id,
      payload: {
        request: {
          endpoint: UNSPLASH_SEARCH_API_URL,
          queries: searchQueries.map((searchQuery) => ({
            query: searchQuery.query,
            reason: searchQuery.reason,
            priority: searchQuery.priority,
          })),
          orientation: 'landscape',
          per_page: UNSPLASH_SEARCH_RESULT_LIMIT,
          content_filter: 'high',
        },
        preferred_cues: preferredCueRules.map((rule) => ({
          key: rule.key,
          query_suffix: rule.querySuffix,
          reason: rule.reason,
        })),
        requests: requestSummaries,
        request_errors: requestErrors,
        selected_photo: {
          id: selectedCandidate.photo.id,
          slug: selectedCandidate.photo.slug ?? null,
          alt_description: selectedCandidate.photo.alt_description ?? null,
          description: selectedCandidate.photo.description ?? null,
          width: selectedCandidate.photo.width ?? null,
          height: selectedCandidate.photo.height ?? null,
          likes: selectedCandidate.photo.likes ?? null,
          hero_image_url: heroImageUrl,
          selection_score: Number(selectedCandidate.finalScore.toFixed(2)),
          selection_reasons: selectedCandidate.reasons,
          primary_query: selectedCandidate.primaryQuery,
          matched_queries: selectedCandidate.matchedQueries,
          attribution_source_name: UNSPLASH_SOURCE_LABEL,
          attribution_source_url: buildUnsplashReferralUrl(selectedCandidate.photo.links?.html ?? 'https://unsplash.com'),
          photo_page_url: buildUnsplashReferralUrl(selectedCandidate.photo.links?.html ?? 'https://unsplash.com'),
          download_location: selectedCandidate.photo.links?.download_location ?? null,
          photographer_name: selectedCandidate.photo.user?.name ?? null,
          photographer_username: selectedCandidate.photo.user?.username ?? null,
          photographer_profile_url: buildUnsplashReferralUrl(selectedCandidate.photo.user?.links?.html ?? null),
        },
        top_candidates: rankedCandidates.slice(0, 5).map((candidate) => ({
          id: candidate.photo.id,
          slug: candidate.photo.slug ?? null,
          alt_description: candidate.photo.alt_description ?? null,
          description: candidate.photo.description ?? null,
          width: candidate.photo.width ?? null,
          height: candidate.photo.height ?? null,
          likes: candidate.photo.likes ?? null,
          score: Number(candidate.finalScore.toFixed(2)),
          primary_query: candidate.primaryQuery,
          matched_queries: candidate.matchedQueries,
          reasons: candidate.reasons,
          photo_page_url: buildUnsplashReferralUrl(candidate.photo.links?.html ?? 'https://unsplash.com'),
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      warning: error instanceof Error
        ? error.message
        : `Unsplash hero enrichment failed for ${country.slug}.`,
      payload: {
        request: {
          endpoint: UNSPLASH_SEARCH_API_URL,
          queries: searchQueries.map((searchQuery) => ({
            query: searchQuery.query,
            reason: searchQuery.reason,
            priority: searchQuery.priority,
          })),
          orientation: 'landscape',
          per_page: UNSPLASH_SEARCH_RESULT_LIMIT,
          content_filter: 'high',
        },
        error: error instanceof Error ? error.message : 'Unknown Unsplash enrichment failure.',
      },
    };
  }
}

async function fetchCountryPublishedDestinationCount(
  supabase: ReturnType<typeof createClient>,
  countryCode: string,
) {
  const { count, error } = await supabase
    .from('destinations')
    .select('id', { count: 'exact', head: true })
    .eq('country_code', countryCode)
    .eq('is_published', true);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function fetchCountryContextDestinations(
  supabase: ReturnType<typeof createClient>,
  country: CountryRecord,
) {
  const { data: featuredLinks, error: featuredLinksError } = await supabase
    .from('country_featured_destinations')
    .select('destination_id, rank')
    .eq('country_code', country.code)
    .order('rank', { ascending: true })
    .limit(3);

  if (featuredLinksError) {
    throw featuredLinksError;
  }

  const orderedLinks = toArray(featuredLinks) as CountryFeaturedLink[];

  if (orderedLinks.length > 0) {
    const { data: featuredDestinations, error: featuredDestinationsError } = await supabase
      .from('destinations')
      .select('id, slug, name, summary, travel_tags, best_months, featured_rank, is_published')
      .in('id', orderedLinks.map((link) => link.destination_id))
      .eq('country_code', country.code)
      .eq('is_published', true);

    if (featuredDestinationsError) {
      throw featuredDestinationsError;
    }

    const destinationById = new Map(
      toArray(featuredDestinations).map((destination) => [destination.id, destination as CountryDestinationRecord]),
    );
    const orderedFeaturedDestinations = orderedLinks
      .map((link) => destinationById.get(link.destination_id))
      .filter(Boolean) as CountryDestinationRecord[];

    if (orderedFeaturedDestinations.length > 0) {
      return orderedFeaturedDestinations;
    }
  }

  const { data: destinations, error: destinationsError } = await supabase
    .from('destinations')
    .select('id, slug, name, summary, travel_tags, best_months, featured_rank, is_published')
    .eq('country_code', country.code)
    .eq('is_published', true)
    .order('featured_rank', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })
    .limit(3);

  if (destinationsError) {
    throw destinationsError;
  }

  return toArray(destinations) as CountryDestinationRecord[];
}

async function buildCountryEnrichmentPlan(
  supabase: SupabaseClient,
  country: CountryRecord,
  unsplashAccessKey: string,
  overwriteExisting: boolean,
  sourceVersion: string | null,
): Promise<CountryEnrichmentPlan> {
  const [contextDestinations, publishedDestinationCount] = await Promise.all([
    fetchCountryContextDestinations(supabase, country),
    fetchCountryPublishedDestinationCount(supabase, country.code),
  ]);

  const warnings: string[] = [];
  const sourceSnapshots: CountrySourceSnapshot[] = [];
  const fieldsPlanned = new Set<string>();

  const currentState = buildCurrentCountryEnrichmentState(country);
  const nextState: CountryEnrichmentState = {
    ...currentState,
  };
  const readinessBefore = computeCountryPublishReadiness(currentState);
  let summaryMetadata: Record<string, unknown> = country.summary_metadata || {};

  if (!nextState.summary || overwriteExisting) {
    const summaryAttempt = await fetchCountrySummaryCandidate(
      country,
      contextDestinations,
      publishedDestinationCount,
    );

    sourceSnapshots.push(...summaryAttempt.snapshots);

    if (summaryAttempt.success && summaryAttempt.summary) {
      if (summaryAttempt.summary !== nextState.summary) {
        fieldsPlanned.add('summary');
      }

      nextState.summary = summaryAttempt.summary;
      
      summaryMetadata = {
        ...summaryMetadata,
        source_version: sourceVersion,
        review_classification: summaryAttempt.review?.classification,
        review_issues: summaryAttempt.review?.issues?.map((issue: any) => issue.key),
        enriched_at: new Date().toISOString(),
      };
      
      fieldsPlanned.add('summary_metadata');
    }

    warnings.push(...summaryAttempt.warnings);

    if (!summaryAttempt.success && summaryAttempt.warnings.length === 0) {
      warnings.push(`Country summary enrichment did not produce a valid summary for ${country.slug}.`);
    }
  }

  if (!nextState.hero_image_url || overwriteExisting) {
    const unsplashAttempt = await fetchUnsplashHeroCandidate(
      country,
      unsplashAccessKey,
      nextState.summary,
      contextDestinations,
    );

    sourceSnapshots.push({
      sourceName: UNSPLASH_SOURCE_NAME,
      externalId: unsplashAttempt.externalId ?? null,
      payload: unsplashAttempt.payload,
    });

    if (unsplashAttempt.success && unsplashAttempt.heroImageUrl) {
      if (unsplashAttempt.heroImageUrl !== nextState.hero_image_url) {
        fieldsPlanned.add('hero_image_url');
      }

      nextState.hero_image_url = unsplashAttempt.heroImageUrl;

      const nextHeroImageSourceName = normalizeOptionalText(unsplashAttempt.attribution?.sourceName);
      const nextHeroImageSourceUrl = normalizeOptionalText(unsplashAttempt.attribution?.sourceUrl);
      const nextHeroImageAttributionName = normalizeOptionalText(unsplashAttempt.attribution?.photographerName);
      const nextHeroImageAttributionUrl = normalizeOptionalText(unsplashAttempt.attribution?.photographerUrl);

      if (nextHeroImageSourceName !== nextState.hero_image_source_name) {
        fieldsPlanned.add('hero_image_source_name');
      }

      if (nextHeroImageSourceUrl !== nextState.hero_image_source_url) {
        fieldsPlanned.add('hero_image_source_url');
      }

      if (nextHeroImageAttributionName !== nextState.hero_image_attribution_name) {
        fieldsPlanned.add('hero_image_attribution_name');
      }

      if (nextHeroImageAttributionUrl !== nextState.hero_image_attribution_url) {
        fieldsPlanned.add('hero_image_attribution_url');
      }

      nextState.hero_image_source_name = nextHeroImageSourceName;
      nextState.hero_image_source_url = nextHeroImageSourceUrl;
      nextState.hero_image_attribution_name = nextHeroImageAttributionName;
      nextState.hero_image_attribution_url = nextHeroImageAttributionUrl;
    } else if (unsplashAttempt.warning) {
      warnings.push(unsplashAttempt.warning);
    }
  }

  nextState.enrichment_status = nextState.summary && nextState.hero_image_url
    ? 'enriched'
    : 'failed';

  const readinessAfter = computeCountryPublishReadiness(nextState);
  nextState.is_published = readinessAfter.is_published;

  if (nextState.enrichment_status !== currentState.enrichment_status) {
    fieldsPlanned.add('enrichment_status');
  }

  if (readinessBefore.is_published !== readinessAfter.is_published) {
    fieldsPlanned.add('is_published');
  }

  sourceSnapshots.push({
    sourceName: DERIVATION_SOURCE_NAME,
    externalId: null,
    payload: {
      context_destination_count: contextDestinations.length,
      context_destinations: contextDestinations.map((destination) => ({
        slug: destination.slug,
        name: destination.name,
        best_months: normalizeMonthNumbers(destination.best_months),
        best_window_label: formatMonthRange(destination.best_months),
      })),
      published_destination_count: publishedDestinationCount,
      readiness_before: readinessBefore,
      readiness_after: readinessAfter,
      summary_before: currentState.summary,
      summary_after: nextState.summary,
      summary_change: determineCountrySummaryChange(currentState.summary, nextState.summary),
      derived_seasonal_overview: nextState.seasonal_overview,
      hero_image_attribution: {
        source_name: nextState.hero_image_source_name,
        source_url: nextState.hero_image_source_url,
        photographer_name: nextState.hero_image_attribution_name,
        photographer_url: nextState.hero_image_attribution_url,
      },
      summary_metadata: summaryMetadata,
    },
  });

  return {
    contextDestinations,
    publishedDestinationCount,
    warnings: uniquePhrases(warnings),
    sourceSnapshots,
    fieldsPlanned: [...fieldsPlanned],
    hadSummaryBefore: Boolean(currentState.summary),
    summaryChange: determineCountrySummaryChange(currentState.summary, nextState.summary),
    readinessBefore,
    readinessAfter,
    currentState,
    nextState,
    summaryMetadata,
  };
}

Deno.serve(async (request) => {
  console.log('Enrich Country Logic Version: 2026-03-14-v4-harden-v2');
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

    const unsplashAccessKey = requireEnv('UNSPLASH_ACCESS_KEY');
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

    const body = parseRequestBody(await request.text());
    const selection = deriveSelection(body);
    let selectedCountries: CountryRecord[] = [];

    if (selection.requestedSlugs) {
      const { data, error } = await supabase
        .from('countries')
        .select(
          'code, slug, name, continent, summary, summary_metadata, hero_image_url, hero_image_source_name, hero_image_source_url, hero_image_attribution_name, hero_image_attribution_url, seasonal_overview, enrichment_status, is_published',
        )
        .in('slug', selection.requestedSlugs);

      if (error) {
        throw error;
      }

      const countryBySlug = new Map((data ?? []).map((country) => [country.slug, country as CountryRecord]));
      const missingSlugs = selection.requestedSlugs.filter((slug) => !countryBySlug.has(slug));

      if (missingSlugs.length > 0) {
        throw new Error(`Unknown country slugs requested: ${missingSlugs.join(', ')}`);
      }

      selectedCountries = selection.requestedSlugs.map((slug) => countryBySlug.get(slug)!);

      if (!selection.allowNonPending) {
        const blockedCountries = selectedCountries.filter((country) => country.enrichment_status !== 'pending');

        if (blockedCountries.length > 0) {
          throw new Error(
            `Only pending countries can be enriched without override. Blocked slugs: ${blockedCountries
              .map((country) => `${country.slug} (${country.enrichment_status})`)
              .join(', ')}`,
          );
        }
      }
    } else {
      const { data, error } = await supabase
        .from('countries')
        .select(
          'code, slug, name, continent, summary, summary_metadata, hero_image_url, hero_image_source_name, hero_image_source_url, hero_image_attribution_name, hero_image_attribution_url, seasonal_overview, enrichment_status, is_published',
        )
        .eq('enrichment_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(selection.limit);

      if (error) {
        throw error;
      }

      selectedCountries = (data ?? []) as CountryRecord[];
    }

    if (selectedCountries.length === 0) {
      return jsonResponse(200, {
        message: 'No countries matched the enrichment selection.',
        selected_country_count: 0,
      });
    }

    const runMetadata = {
      enrichment_mode: selection.requestedSlugs ? 'explicit_selection' : 'pending_queue',
      allow_non_pending: selection.allowNonPending,
      overwrite_existing: selection.overwriteExisting,
      dry_run: selection.dryRun,
      require_publish_ready: selection.requirePublishReady,
      selected_slugs: selectedCountries.map((country) => country.slug),
      source_names: [
        WIKIPEDIA_SOURCE_NAME,
        WIKIVOYAGE_SOURCE_NAME,
        SUMMARY_PIPELINE_SOURCE_NAME,
        UNSPLASH_SOURCE_NAME,
      ],
    };

    let ingestionRunId: string | null = null;

    if (!selection.dryRun) {
      const { data: ingestionRun, error: ingestionRunError } = await supabase
        .from('ingestion_runs')
        .insert({
          pipeline_name: 'enrich-country',
          source_name: ENRICHMENT_SOURCE_NAME,
          source_version: ENRICHMENT_SOURCE_VERSION,
          status: 'running',
          records_seen: selectedCountries.length,
          metadata: runMetadata,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (ingestionRunError) {
        throw ingestionRunError;
      }

      ingestionRunId = ingestionRun.id;
    }

    const countryResults: CountryResult[] = [];
    const batchOpeningFamilies: Array<{ slug: string; openingFamily: string }> = [];
    let successfulCountryCount = 0;
    let failedCountryCount = 0;
    let skippedCountryCount = 0;
    let snapshotsWritten = 0;

    for (const country of selectedCountries) {
      const previousEnrichmentStatus = country.enrichment_status;
      let plannedEnrichment: CountryEnrichmentPlan | null = null;
      let didSetEnriching = false;

      try {
        plannedEnrichment = await buildCountryEnrichmentPlan(
          supabase,
          country,
          unsplashAccessKey,
          selection.overwriteExisting,
          selection.sourceVersion,
        );

        const openingFamily = extractOpeningFamilyFromPlan(plannedEnrichment);

        if (openingFamily) {
          batchOpeningFamilies.push({ slug: country.slug, openingFamily });
        }

        const writeAction: CountryWriteAction = selection.requirePublishReady &&
            plannedEnrichment.readinessAfter.missing_requirements.length > 0
          ? selection.dryRun
            ? 'would_skip_missing_readiness'
            : 'skipped_missing_readiness'
          : plannedEnrichment.fieldsPlanned.length > 0
            ? selection.dryRun
              ? 'would_update'
              : 'updated'
            : selection.dryRun
              ? 'would_no_change'
              : 'no_change';

        console.log(JSON.stringify({
          event: selection.dryRun ? 'country_enrichment_dry_run_review' : 'country_enrichment_review',
          slug: country.slug,
          dry_run: selection.dryRun,
          require_publish_ready: selection.requirePublishReady,
          write_action: writeAction,
          had_summary_before: plannedEnrichment.hadSummaryBefore,
          summary_change: plannedEnrichment.summaryChange,
          fields_planned: plannedEnrichment.fieldsPlanned,
          publish_readiness_before: plannedEnrichment.readinessBefore,
          publish_readiness_after: plannedEnrichment.readinessAfter,
        }));

        if (selection.dryRun) {
          countryResults.push(buildCountryResult(country, plannedEnrichment, {
            status: 'dry_run',
            writeAction,
            isPublished: plannedEnrichment.readinessAfter.is_published,
            missingRequirements: plannedEnrichment.readinessAfter.missing_requirements,
            fieldsUpdated: [],
            warnings: plannedEnrichment.warnings,
          }));
          continue;
        }

        if (selection.requirePublishReady && plannedEnrichment.readinessAfter.missing_requirements.length > 0) {
          skippedCountryCount += 1;
          countryResults.push(buildCountryResult(country, plannedEnrichment, {
            status: 'skipped',
            writeAction,
            isPublished: plannedEnrichment.readinessBefore.is_published,
            missingRequirements: plannedEnrichment.readinessAfter.missing_requirements,
            fieldsUpdated: [],
            warnings: uniquePhrases([
              ...plannedEnrichment.warnings,
              `Skipped write because ${country.slug} would remain unpublished: ${plannedEnrichment.readinessAfter.missing_requirements.join(', ')}.`,
            ]),
          }));
          continue;
        }

        const { error: setEnrichingError } = await supabase
          .from('countries')
          .update({ enrichment_status: 'enriching' })
          .eq('code', country.code);

        if (setEnrichingError) {
          throw setEnrichingError;
        }

        didSetEnriching = true;

        const snapshotRows = plannedEnrichment.sourceSnapshots.map((snapshot) => ({
          country_code: country.code,
          ingestion_run_id: ingestionRunId!,
          source_name: snapshot.sourceName,
          external_id: snapshot.externalId,
          payload: snapshot.payload,
        }));

        const { error: snapshotInsertError } = await supabase
          .from('country_source_snapshots')
          .insert(snapshotRows);

        if (snapshotInsertError) {
          throw snapshotInsertError;
        }

        snapshotsWritten += snapshotRows.length;

        const { error: updateCountryError } = await supabase
          .from('countries')
          .update({
            summary: plannedEnrichment.nextState.summary,
            summary_metadata: plannedEnrichment.summaryMetadata,
            hero_image_url: plannedEnrichment.nextState.hero_image_url,
            hero_image_source_name: plannedEnrichment.nextState.hero_image_source_name,
            hero_image_source_url: plannedEnrichment.nextState.hero_image_source_url,
            hero_image_attribution_name: plannedEnrichment.nextState.hero_image_attribution_name,
            hero_image_attribution_url: plannedEnrichment.nextState.hero_image_attribution_url,
            seasonal_overview: plannedEnrichment.nextState.seasonal_overview,
            enrichment_status: plannedEnrichment.nextState.enrichment_status,
          })
          .eq('code', country.code);

        if (updateCountryError) {
          throw updateCountryError;
        }

        const { data: publishReadiness, error: publishReadinessError } = await supabase
          .rpc('refresh_country_publish_readiness', {
            p_country_code: country.code,
          })
          .single();

        if (publishReadinessError) {
          throw publishReadinessError;
        }

        const resultStatus = plannedEnrichment.nextState.enrichment_status === 'enriched' ? 'enriched' : 'failed';
        const missingRequirements = publishReadiness?.missing_requirements ?? plannedEnrichment.readinessAfter.missing_requirements;
        const isPublished = publishReadiness?.is_published ?? plannedEnrichment.readinessAfter.is_published;

        if (resultStatus === 'enriched') {
          successfulCountryCount += 1;
        } else {
          failedCountryCount += 1;
        }

        countryResults.push(buildCountryResult(country, plannedEnrichment, {
          status: resultStatus,
          writeAction,
          isPublished,
          missingRequirements,
          fieldsUpdated: plannedEnrichment.fieldsPlanned,
          warnings: plannedEnrichment.warnings,
        }));
      } catch (error) {
        if (!selection.dryRun && didSetEnriching) {
          const restoredStatus = previousEnrichmentStatus === 'enriched'
            ? 'enriched'
            : previousEnrichmentStatus === 'failed'
              ? 'failed'
              : 'failed';

          await supabase
            .from('countries')
            .update({ enrichment_status: restoredStatus })
            .eq('code', country.code);

          if (restoredStatus === 'enriched') {
            await supabase.rpc('refresh_country_publish_readiness', {
              p_country_code: country.code,
            });
          }
        }

        failedCountryCount += 1;
        const fallbackState = buildCurrentCountryEnrichmentState(country);
        const fallbackReadiness = computeCountryPublishReadiness(fallbackState);
        const failurePlan = plannedEnrichment ?? {
          contextDestinations: [],
          publishedDestinationCount: 0,
          warnings: [],
          sourceSnapshots: [],
          fieldsPlanned: [],
          hadSummaryBefore: Boolean(fallbackState.summary),
          summaryChange: determineCountrySummaryChange(fallbackState.summary, fallbackState.summary),
          readinessBefore: fallbackReadiness,
          readinessAfter: fallbackReadiness,
          currentState: fallbackState,
          nextState: fallbackState,
        };

        countryResults.push(buildCountryResult(country, failurePlan, {
          status: 'failed',
          writeAction: selection.dryRun ? 'would_no_change' : 'no_change',
          isPublished: failurePlan.currentState.is_published,
          missingRequirements: failurePlan.readinessAfter.missing_requirements,
          fieldsUpdated: [],
          warnings: uniquePhrases([
            ...failurePlan.warnings,
            error instanceof Error ? error.message : 'Unknown country enrichment failure.',
          ]),
        }));
      }
    }

    const reviewSummary = summarizeCountryResults(countryResults);
    const openingDiversityCheck = checkBatchOpeningDiversity(batchOpeningFamilies);

    if (!selection.dryRun && ingestionRunId) {
      const ingestionStatus = failedCountryCount === 0 && skippedCountryCount === 0
        ? 'succeeded'
        : successfulCountryCount > 0 || skippedCountryCount > 0
          ? 'partial'
          : 'failed';
      const errorSummary = countryResults
        .filter((result) => result.status === 'failed' && result.warnings && result.warnings.length > 0)
        .map((result) => `${result.slug}: ${result.warnings?.join('; ')}`)
        .join(' | ');

      const { error: finishRunError } = await supabase
        .from('ingestion_runs')
        .update({
          status: ingestionStatus,
          records_written: successfulCountryCount,
          records_failed: failedCountryCount,
          error_summary: errorSummary ? errorSummary.slice(0, 2000) : null,
          metadata: {
            ...runMetadata,
            country_source_snapshots_written: snapshotsWritten,
            skipped_country_count: skippedCountryCount,
            review_summary: reviewSummary,
            opening_diversity_check: openingDiversityCheck,
          },
          finished_at: new Date().toISOString(),
        })
        .eq('id', ingestionRunId);

      if (finishRunError) {
        throw finishRunError;
      }
    }

    return jsonResponse(200, {
      verification_key: 'HARDENED_V4_LIVE_20260314',
      dry_run: selection.dryRun,
      require_publish_ready: selection.requirePublishReady,
      ingestion_run_id: ingestionRunId,
      source_name: ENRICHMENT_SOURCE_NAME,
      source_version: ENRICHMENT_SOURCE_VERSION,
      selected_country_count: selectedCountries.length,
      enriched_country_count: successfulCountryCount,
      failed_country_count: failedCountryCount,
      skipped_country_count: skippedCountryCount,
      review_summary: reviewSummary,
      opening_diversity_check: openingDiversityCheck,
      countries_processed: countryResults,
    });
  } catch (error) {
    const isServerMisconfiguration =
      error instanceof Error && error.message.startsWith('Missing required environment variable:');

    return jsonResponse(isServerMisconfiguration ? 500 : 400, {
      error: error instanceof Error ? error.message : 'Invalid country enrichment request.',
    });
  }
});
