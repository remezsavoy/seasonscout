import { createClient } from 'jsr:@supabase/supabase-js@2';

type EnrichmentRequestBody = {
  slug?: string;
  slugs?: string[];
  limit?: number;
  allow_non_pending?: boolean;
  allow_reenrich_existing?: boolean;
  overwrite_existing?: boolean;
};

type DestinationRecord = {
  id: string;
  slug: string;
  name: string;
  country: string;
  country_code: string;
  continent: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  summary: string | null;
  hero_image_url: string | null;
  hero_image_source_name: string | null;
  hero_image_source_url: string | null;
  hero_image_attribution_name: string | null;
  hero_image_attribution_url: string | null;
  best_months: number[] | null;
  travel_tags: string[] | null;
  seasonal_insight: string | null;
  climate_import_status: 'pending' | 'importing' | 'imported' | 'failed';
  enrichment_status: 'pending' | 'enriching' | 'enriched' | 'failed';
  is_published: boolean;
};

type MonthlyClimateRecord = {
  month: number;
  avg_high_c: number;
  avg_low_c: number;
  avg_precip_mm: number | null;
  avg_humidity: number | null;
  sunshine_hours: number | null;
  comfort_score: number | null;
  recommendation_label: string | null;
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
    width?: number;
    height?: number;
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

type WikimediaSummaryAttempt = {
  success: boolean;
  summary?: string;
  externalId?: string | null;
  payload: Record<string, unknown>;
  warning?: string;
};

type UnsplashSearchResponse = {
  total?: number;
  total_pages?: number;
  results?: UnsplashPhoto[];
};

type UnsplashPhoto = {
  id: string;
  slug?: string;
  alt_description?: string | null;
  description?: string | null;
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

type TravelTagRule = {
  tag: string;
  patterns: RegExp[];
  summaryHighlight: string;
  tripStyle: string;
};

type SummaryIdentityKey =
  | 'historic_city'
  | 'coastal_city'
  | 'scenic_base'
  | 'town'
  | 'city'
  | 'destination';

type SummaryFacts = {
  identityKey: SummaryIdentityKey;
  identityLabel: string;
  knownForHighlights: string[];
  tripStyles: string[];
  sourceTags: string[];
  cleanedSourceText: string;
  cleanedDescription: string | null;
};

type Selection = {
  allowNonPending: boolean;
  allowReenrichExisting: boolean;
  overwriteExisting: boolean;
  requestedSlugs: string[] | null;
  limit: number;
};

type DestinationResult = {
  slug: string;
  status: 'enriched' | 'failed';
  is_published: boolean;
  missing_requirements: string[];
  fields_updated: string[];
  warnings?: string[];
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

const DESTINATION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ENRICHMENT_BATCH = 3;
const WIKIMEDIA_SOURCE_NAME = 'wikimedia_summary';
const UNSPLASH_SOURCE_NAME = 'unsplash_photo';
const DERIVATION_SOURCE_NAME = 'destination_enrichment_derivation';
const ENRICHMENT_SOURCE_NAME = 'destination_enrichment_pipeline';
const ENRICHMENT_SOURCE_VERSION = '2026-03-13-v3';
const WIKIMEDIA_SEARCH_API_URL = 'https://en.wikipedia.org/w/rest.php/v1/search/page';
const WIKIMEDIA_PAGE_API_BASE_URL = 'https://en.wikipedia.org/w/rest.php/v1/page';
const UNSPLASH_SEARCH_API_URL = 'https://api.unsplash.com/search/photos';
const UNSPLASH_SOURCE_LABEL = 'Unsplash';
const DEFAULT_WIKIMEDIA_USER_AGENT = 'SeasonScout/0.1 (destination enrichment backend)';
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
const TAG_RULES: TravelTagRule[] = [
  {
    tag: 'Temples',
    patterns: [/\b(?:temple|temples|shrine|shrines|pagoda|pagodas)\b/i],
    summaryHighlight: 'temple districts and shrines',
    tripStyle: 'heritage-focused city breaks',
  },
  {
    tag: 'History',
    patterns: [/\b(?:historic|history|heritage|old town|former capital|imperial)\b/i],
    summaryHighlight: 'historic neighborhoods',
    tripStyle: 'heritage-focused city breaks',
  },
  {
    tag: 'Culture',
    patterns: [/\b(?:cultural|culture|museum|museums|gallery|galleries|traditional)\b/i],
    summaryHighlight: 'cultural landmarks',
    tripStyle: 'heritage-focused city breaks',
  },
  {
    tag: 'Gardens',
    patterns: [/\b(?:garden|gardens|park|parks|blossom|blossoms)\b/i],
    summaryHighlight: 'gardens and seasonal walks',
    tripStyle: 'slower seasonal trips',
  },
  {
    tag: 'Food',
    patterns: [/\b(?:food|foods|cuisine|culinary|market|markets|restaurant|restaurants|dining)\b/i],
    summaryHighlight: 'strong local food neighborhoods',
    tripStyle: 'food-led city breaks',
  },
  {
    tag: 'Coast',
    patterns: [/\b(?:beach|beaches|coast|coastal|bay|harbour|harbor|waterfront|ocean|sea|atlantic|seaside)\b/i],
    summaryHighlight: 'coastal scenery',
    tripStyle: 'coastal stays',
  },
  {
    tag: 'Hiking',
    patterns: [/\b(?:hike|hikes|hiking|trail|trails|trek|treks|summit|summits|climb|climbs)\b/i],
    summaryHighlight: 'hiking routes',
    tripStyle: 'active outdoor trips',
  },
  {
    tag: 'Mountains',
    patterns: [/\b(?:mountain|mountains|peak|peaks|cliff|cliffs|ridge|ridges)\b/i],
    summaryHighlight: 'mountain views',
    tripStyle: 'scenic outdoor escapes',
  },
  {
    tag: 'Nature',
    patterns: [/\b(?:nature|landscape|landscapes|waterfall|waterfalls|fjord|fjords|volcanic|volcano|volcanoes|geothermal)\b/i],
    summaryHighlight: 'dramatic landscapes',
    tripStyle: 'landscape-heavy itineraries',
  },
  {
    tag: 'Design',
    patterns: [/\b(?:design|design-led|architecture|architectural|creative|art scene)\b/i],
    summaryHighlight: 'design-forward neighborhoods',
    tripStyle: 'design-led city breaks',
  },
  {
    tag: 'Road trips',
    patterns: [/\b(?:road trip|road-trip|self-drive|ring road|scenic route|scenic routes)\b/i],
    summaryHighlight: 'easy access to scenic drives',
    tripStyle: 'scenic self-drive itineraries',
  },
  {
    tag: 'Hot springs',
    patterns: [/\b(?:hot spring|hot springs|thermal bath|thermal baths|geothermal spa|geothermal lagoon)\b/i],
    summaryHighlight: 'hot springs and geothermal stops',
    tripStyle: 'geothermal breaks',
  },
  {
    tag: 'Wine',
    patterns: [/\b(?:wine|vineyard|vineyards|winery|wineries)\b/i],
    summaryHighlight: 'wine-country outings',
    tripStyle: 'food-and-wine escapes',
  },
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

  if (!DESTINATION_SLUG_PATTERN.test(slug)) {
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

function parseRequestBody(rawBody: string): EnrichmentRequestBody {
  if (!rawBody.trim()) {
    return {};
  }

  const parsedBody = JSON.parse(rawBody);

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    throw new Error('Request body must be a JSON object.');
  }

  return parsedBody as EnrichmentRequestBody;
}

function deriveSelection(body: EnrichmentRequestBody): Selection {
  const allowNonPending = normalizeBoolean(body.allow_non_pending, 'allow_non_pending', false);
  const allowReenrichExisting = normalizeBoolean(
    body.allow_reenrich_existing,
    'allow_reenrich_existing',
    false,
  );
  const overwriteExisting = normalizeBoolean(body.overwrite_existing, 'overwrite_existing', false);
  const hasSlug = body.slug !== undefined;
  const hasSlugs = body.slugs !== undefined;

  if (hasSlug && hasSlugs) {
    throw new Error('Provide either slug or slugs, not both.');
  }

  if (allowReenrichExisting && !hasSlug) {
    throw new Error('allow_reenrich_existing requires exactly one explicit slug.');
  }

  if (hasSlug) {
    return {
      allowNonPending: allowNonPending || allowReenrichExisting,
      allowReenrichExisting,
      overwriteExisting: overwriteExisting || allowReenrichExisting,
      requestedSlugs: [normalizeSlug(body.slug, 'slug')],
      limit: 1,
    };
  }

  if (hasSlugs) {
    if (allowNonPending || overwriteExisting || allowReenrichExisting) {
      throw new Error(
        'Override flags are only supported for a single explicit slug. Batch enrichment must stay pending-only.',
      );
    }

    if (!Array.isArray(body.slugs)) {
      throw new Error('slugs must be an array when provided.');
    }

    const requestedSlugs = [...new Set(body.slugs.map((slug) => normalizeSlug(slug, 'slugs item')))];

    if (requestedSlugs.length === 0) {
      throw new Error('At least one slug must be provided when filtering enrichment runs.');
    }

    if (requestedSlugs.length > MAX_ENRICHMENT_BATCH) {
      throw new Error(
        `Requested ${requestedSlugs.length} destinations, which exceeds the allowed batch size of ${MAX_ENRICHMENT_BATCH}.`,
      );
    }

    return {
      allowNonPending,
      allowReenrichExisting,
      overwriteExisting,
      requestedSlugs,
      limit: requestedSlugs.length,
    };
  }

  if (allowNonPending || overwriteExisting || allowReenrichExisting) {
    throw new Error(
      'Override flags require exactly one explicit slug. Queue mode only supports pending destinations.',
    );
  }

  return {
    allowNonPending,
    allowReenrichExisting,
    overwriteExisting,
    requestedSlugs: null,
    limit: normalizeLimit(body.limit, 1),
  };
}

function toArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function average(values: Array<number | null | undefined>) {
  const numericValues = values.filter((value): value is number => Number.isFinite(value));

  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

function normalizeForComparison(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
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
  return decodeHtmlEntities(
    value
      .replace(/<[^>]+>/g, ' ')
      .replace(/\[[^\]]+\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function stripWikimediaSummaryNoise(value: string) {
  return value
    .replace(/\((?:[^)]{0,140}(?:IPA|pronounced|listen|romanized|kana|lit\.|meaning|help(?:\s+)?info|Japanese|Icelandic|Zulu|Xhosa|French:|German:|Spanish:|Arabic:|Korean:|Chinese:)[^)]*)\)/gi, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/,\s*(?:officially|formerly|historically)\s+[^,.;]+/gi, '')
    .replace(/\bwith a population of[^.]+/gi, ' ')
    .replace(/\bas of \d{4}[^.]+/gi, ' ')
    .replace(/\baccording to [^.]+/gi, ' ')
    .replace(/\bcovering an area of[^.]+/gi, ' ')
    .replace(/\b(?:founded|established|rebuilt|incorporated|annexed|merged|designated)\b[^.]+/gi, ' ')
    .replace(/\b(?:in|since|from)\s+\d{3,4}\b/gi, ' ')
    .replace(/\b\d{4}\b/g, ' ')
    .replace(/\s*[;:]\s*/g, '. ')
    .replace(/\s+,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLeadParagraph(html: string) {
  const paragraphMatches = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];

  for (const match of paragraphMatches) {
    const paragraphText = cleanExtractedText(match[1] ?? '');

    if (paragraphText.length >= 120) {
      return paragraphText;
    }
  }

  for (const match of paragraphMatches) {
    const paragraphText = cleanExtractedText(match[1] ?? '');

    if (paragraphText.length >= 60) {
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

function matchesAnyPattern(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function includesAnyTag(tags: string[], candidateTags: string[]) {
  const normalizedTags = new Set(tags.map((tag) => tag.toLowerCase()));
  return candidateTags.some((tag) => normalizedTags.has(tag.toLowerCase()));
}

function collectSourceTags(sourceText: string) {
  return TAG_RULES
    .filter((rule) => matchesAnyPattern(sourceText, rule.patterns))
    .map((rule) => rule.tag);
}

function lookupTagRule(tag: string) {
  return TAG_RULES.find((rule) => rule.tag === tag);
}

function monthNumberToName(monthNumber: number) {
  return MONTH_NAMES[monthNumber - 1] ?? `Month ${monthNumber}`;
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

function buildSummaryIdentityFacts(
  destination: DestinationRecord,
  sourceText: string,
  description: string | null,
  sourceTags: string[],
) {
  const summaryCorpus = `${description ?? ''} ${sourceText}`;
  const mentionsTown = /\b(?:town|village)\b/i.test(summaryCorpus);
  const mentionsCity = /\b(?:city|municipality|urban|capital)\b/i.test(summaryCorpus);
  const mentionsHistoric = /\b(?:historic|heritage|old town|traditional|former imperial)\b/i.test(summaryCorpus);
  const mentionsScenicBase = /\b(?:base|gateway|hub)\b/i.test(summaryCorpus);
  const hasScenicCue = /\b(?:mountain|alpine|highland|volcanic|geothermal|fjord|waterfall|landscape|island)\b/i
    .test(summaryCorpus)
    || includesAnyTag(sourceTags, ['Nature', 'Hiking', 'Mountains', 'Hot springs', 'Road trips']);

  if (
    /\b(?:coastal|seaside|harbour|harbor|waterfront|port|bay)\b/i.test(summaryCorpus)
    || includesAnyTag(sourceTags, ['Coast'])
  ) {
    return {
      identityKey: 'coastal_city' as const,
      identityLabel: mentionsTown
        ? `a coastal town in ${destination.country}`
        : mentionsCity
          ? `a coastal city in ${destination.country}`
          : `a coastal destination in ${destination.country}`,
    };
  }

  if (
    mentionsHistoric
    || includesAnyTag(sourceTags, ['Temples', 'History'])
  ) {
    return {
      identityKey: 'historic_city' as const,
      identityLabel: mentionsTown
        ? `a historic town in ${destination.country}`
        : mentionsCity
          ? `a historic city in ${destination.country}`
          : `a historic destination in ${destination.country}`,
    };
  }

  if ((mentionsScenicBase && hasScenicCue) || (!mentionsCity && !mentionsTown && hasScenicCue)) {
    return {
      identityKey: 'scenic_base' as const,
      identityLabel: `a scenic base in ${destination.country}`,
    };
  }

  if (mentionsTown) {
    return {
      identityKey: 'town' as const,
      identityLabel: `a town in ${destination.country}`,
    };
  }

  if (mentionsCity) {
    return {
      identityKey: 'city' as const,
      identityLabel: `a city in ${destination.country}`,
    };
  }

  return {
    identityKey: 'destination' as const,
    identityLabel: `a destination in ${destination.country}`,
  };
}

function buildFallbackKnownForHighlights(identityKey: SummaryIdentityKey) {
  switch (identityKey) {
    case 'historic_city':
      return ['historic neighborhoods', 'cultural landmarks'];
    case 'coastal_city':
      return ['coastal scenery', 'waterfront districts'];
    case 'scenic_base':
      return ['dramatic landscapes', 'easy scenic day trips'];
    case 'town':
      return ['a walkable center', 'easy local exploring'];
    case 'city':
      return ['distinct neighborhoods', 'easy sightseeing'];
    case 'destination':
    default:
      return ['a strong sense of place', 'easy sightseeing'];
  }
}

function buildFallbackTripStyles(identityKey: SummaryIdentityKey) {
  switch (identityKey) {
    case 'historic_city':
      return ['heritage-focused city breaks', 'slower neighborhood walks'];
    case 'coastal_city':
      return ['coastal stays', 'scenic day trips'];
    case 'scenic_base':
      return ['outdoor day trips', 'scenic itineraries'];
    case 'town':
      return ['slower short breaks', 'easy local exploring'];
    case 'city':
      return ['city breaks', 'full sightseeing days'];
    case 'destination':
    default:
      return ['slower sightseeing trips', 'flexible day trips'];
  }
}

function buildSummaryKnownForHighlights(sourceTags: string[], identityKey: SummaryIdentityKey) {
  const highlights = sourceTags
    .map((tag) => lookupTagRule(tag)?.summaryHighlight ?? '')
    .filter(Boolean)
    .slice(0, 3);

  return highlights.length > 0 ? highlights : buildFallbackKnownForHighlights(identityKey);
}

function buildSummaryTripStyles(sourceTags: string[], identityKey: SummaryIdentityKey) {
  const tripStyles = sourceTags
    .map((tag) => lookupTagRule(tag)?.tripStyle ?? '')
    .filter(Boolean)
    .slice(0, 4);

  const uniqueTripStyles = [...new Set(tripStyles)];
  return uniqueTripStyles.length > 0 ? uniqueTripStyles.slice(0, 2) : buildFallbackTripStyles(identityKey);
}

function deriveSummaryFacts(
  destination: DestinationRecord,
  sourceText: string,
  description: string | null,
): SummaryFacts | null {
  const cleanedSourceText = stripWikimediaSummaryNoise(sourceText);
  const cleanedDescription = normalizeOptionalText(stripWikimediaSummaryNoise(description ?? ''));

  if (!cleanedSourceText && !cleanedDescription) {
    return null;
  }

  const sourceTags = collectSourceTags(
    `${cleanedSourceText} ${cleanedDescription ?? ''} ${destination.name} ${destination.country}`,
  );
  const identityFacts = buildSummaryIdentityFacts(
    destination,
    cleanedSourceText,
    cleanedDescription,
    sourceTags,
  );

  return {
    identityKey: identityFacts.identityKey,
    identityLabel: identityFacts.identityLabel,
    knownForHighlights: buildSummaryKnownForHighlights(sourceTags, identityFacts.identityKey),
    tripStyles: buildSummaryTripStyles(sourceTags, identityFacts.identityKey),
    sourceTags,
    cleanedSourceText,
    cleanedDescription,
  };
}

function buildPolishedSummary(destination: DestinationRecord, facts: SummaryFacts | null) {
  if (!facts) {
    return '';
  }

  const firstSentence = `${destination.name} is ${facts.identityLabel}, known for ${humanizeList(facts.knownForHighlights)}.`;
  const secondSentence = `It is especially good for ${humanizeList(facts.tripStyles)}.`;

  return trimToSentenceBoundary(`${firstSentence} ${secondSentence}`, 260);
}

function normalizeTag(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 40);
}

function normalizeTags(values: string[] | null | undefined) {
  const seenTags = new Set<string>();
  const normalizedTags: string[] = [];

  for (const value of toArray(values)) {
    const normalizedValue = normalizeTag(String(value));

    if (!normalizedValue) {
      continue;
    }

    const tagKey = normalizedValue.toLowerCase();

    if (seenTags.has(tagKey)) {
      continue;
    }

    seenTags.add(tagKey);
    normalizedTags.push(normalizedValue);
  }

  return normalizedTags;
}

function mergeTags(existingTags: string[], derivedTags: string[], maxTags = 4) {
  const mergedTags: string[] = [];
  const seenTags = new Set<string>();

  for (const tag of [...existingTags, ...derivedTags]) {
    const normalizedTag = normalizeTag(tag);

    if (!normalizedTag) {
      continue;
    }

    const tagKey = normalizedTag.toLowerCase();

    if (seenTags.has(tagKey)) {
      continue;
    }

    seenTags.add(tagKey);
    mergedTags.push(normalizedTag);

    if (mergedTags.length >= maxTags) {
      break;
    }
  }

  return mergedTags;
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function describeTemperature(avgHigh: number | null) {
  if (avgHigh === null) {
    return 'conditions are generally more manageable';
  }

  if (avgHigh < 10) {
    return 'cooler temperatures that still work with the right layers';
  }

  if (avgHigh < 18) {
    return 'mild daytime temperatures for longer sightseeing days';
  }

  if (avgHigh < 27) {
    return 'comfortable temperatures for full sightseeing days';
  }

  return 'warmer but still travel-friendly temperatures';
}

function describeRain(avgPrecip: number | null) {
  if (avgPrecip === null) {
    return 'conditions that are usually easier to plan around';
  }

  if (avgPrecip <= 40) {
    return 'lower rainfall';
  }

  if (avgPrecip <= 100) {
    return 'manageable rainfall';
  }

  return 'rain that is usually easier to work around than the rest of the year';
}

function describeHumidity(avgHumidity: number | null) {
  if (avgHumidity === null) {
    return '';
  }

  if (avgHumidity >= 75) {
    return 'Humidity remains noticeable across the best months, so lighter layers help.';
  }

  if (avgHumidity <= 45) {
    return 'The air usually feels drier and easier for longer outdoor stretches.';
  }

  return '';
}

function describeSunshine(avgSunshine: number | null) {
  if (avgSunshine === null) {
    return '';
  }

  if (avgSunshine >= 8) {
    return 'long usable daylight';
  }

  if (avgSunshine >= 5) {
    return 'solid daylight for full days out';
  }

  return '';
}

function buildSeasonalConditionsPhrase(
  avgHigh: number | null,
  avgPrecip: number | null,
  avgHumidity: number | null,
  avgSunshine: number | null,
) {
  return humanizeList(
    [
      describeTemperature(avgHigh),
      describeRain(avgPrecip),
      avgHumidity !== null && avgHumidity <= 50 ? 'drier air' : '',
      describeSunshine(avgSunshine),
    ].filter(Boolean).slice(0, 3),
  );
}

function buildExperienceCue(travelTags: string[]) {
  const lowerCaseTags = travelTags.map((tag) => tag.toLowerCase());

  if (lowerCaseTags.includes('temples') || lowerCaseTags.includes('gardens')) {
    return 'temple visits, garden walks, and slower neighborhood exploring';
  }

  if (lowerCaseTags.includes('coast') && (lowerCaseTags.includes('hiking') || lowerCaseTags.includes('mountains'))) {
    return 'coastal drives, lookout stops, and longer outdoor days';
  }

  if (lowerCaseTags.includes('coast')) {
    return 'waterfront time, beach-adjacent plans, and scenic meals';
  }

  if (lowerCaseTags.includes('hot springs') || lowerCaseTags.includes('road trips')) {
    return 'self-drive days, geothermal stops, and scenic detours';
  }

  if (lowerCaseTags.includes('nature') || lowerCaseTags.includes('hiking') || lowerCaseTags.includes('mountains')) {
    return 'outdoor plans, day trips, and longer time in the landscape';
  }

  if (lowerCaseTags.includes('beach days')) {
    return 'beach time, waterfront meals, and slower scenic afternoons';
  }

  if (lowerCaseTags.includes('outdoor days')) {
    return 'longer days outdoors, scenic stops, and flexible side trips';
  }

  if (lowerCaseTags.includes('food') && lowerCaseTags.includes('culture')) {
    return 'museum stops, neighborhood meals, and slower city days';
  }

  if (lowerCaseTags.includes('food')) {
    return 'slower city days built around neighborhoods and meals';
  }

  if (lowerCaseTags.includes('design')) {
    return 'design stops, cafes, and longer walks between neighborhoods';
  }

  if (lowerCaseTags.includes('city breaks')) {
    return 'slower city breaks, longer walks, and full sightseeing days';
  }

  if (lowerCaseTags.includes('long daylight')) {
    return 'longer sightseeing days and easier day-trip planning';
  }

  return 'full sightseeing days and a slower trip rhythm';
}

function buildOffSeasonConstraint(
  climateRows: MonthlyClimateRecord[],
  bestMonthNumbers: number[],
  avgBestPrecip: number | null,
) {
  const offSeasonRows = climateRows.filter((row) => !bestMonthNumbers.includes(Number(row.month)));

  if (offSeasonRows.length === 0) {
    return '';
  }

  const hottestOffSeasonRow = [...offSeasonRows].sort(
    (left, right) => Number(right.avg_high_c ?? 0) - Number(left.avg_high_c ?? 0),
  )[0];
  const wettestOffSeasonRow = [...offSeasonRows]
    .filter((row) => Number.isFinite(row.avg_precip_mm))
    .sort((left, right) => Number(right.avg_precip_mm ?? 0) - Number(left.avg_precip_mm ?? 0))[0];
  const coldestOffSeasonRow = [...offSeasonRows].sort(
    (left, right) => Number(left.avg_high_c ?? 0) - Number(right.avg_high_c ?? 0),
  )[0];

  if (hottestOffSeasonRow && Number(hottestOffSeasonRow.avg_high_c) >= 31) {
    return 'Outside that stretch, stronger heat can make all-day plans feel heavier.';
  }

  if (
    wettestOffSeasonRow
    && Number.isFinite(wettestOffSeasonRow.avg_precip_mm)
    && Number(wettestOffSeasonRow.avg_precip_mm) >= 120
    && (avgBestPrecip === null || Number(wettestOffSeasonRow.avg_precip_mm) - avgBestPrecip >= 35)
  ) {
    return 'Outside that stretch, heavier rain makes plans less predictable.';
  }

  if (coldestOffSeasonRow && Number(coldestOffSeasonRow.avg_high_c) <= 6) {
    return 'Outside that stretch, colder days can shrink the amount of comfortable time outdoors.';
  }

  return '';
}

function deriveTravelTags(
  destination: DestinationRecord,
  climateRows: MonthlyClimateRecord[],
  summary: string | null,
  existingTags: string[],
) {
  const sourceText = `${destination.name} ${destination.country} ${summary ?? ''}`;
  const derivedTags = collectSourceTags(sourceText);

  const bestMonthNumbers = normalizeMonthNumbers(destination.best_months);
  const bestRows = climateRows.filter((row) => bestMonthNumbers.includes(Number(row.month)));
  const avgBestHigh = average(bestRows.map((row) => row.avg_high_c));
  const avgBestPrecip = average(bestRows.map((row) => row.avg_precip_mm));
  const avgBestSunshine = average(bestRows.map((row) => row.sunshine_hours));

  if (
    derivedTags.includes('Coast')
    && avgBestHigh !== null
    && avgBestHigh >= 20
    && (avgBestPrecip === null || avgBestPrecip <= 90)
  ) {
    derivedTags.push('Beach days');
  }

  if (
    (derivedTags.includes('Hiking') || derivedTags.includes('Nature') || derivedTags.includes('Mountains'))
    && avgBestHigh !== null
    && avgBestHigh >= 8
    && avgBestHigh <= 26
    && (avgBestPrecip === null || avgBestPrecip <= 120)
  ) {
    derivedTags.push('Outdoor days');
  }

  if (
    !derivedTags.includes('Road trips')
    && (derivedTags.includes('Nature') || derivedTags.includes('Coast') || derivedTags.includes('Mountains'))
    && /\b(?:drive|drives|road)\b/i.test(sourceText)
  ) {
    derivedTags.push('Road trips');
  }

  if (
    !derivedTags.includes('City breaks')
    && avgBestHigh !== null
    && avgBestHigh >= 12
    && avgBestHigh <= 26
    && (avgBestPrecip === null || avgBestPrecip <= 120)
  ) {
    derivedTags.push('City breaks');
  }

  if (!derivedTags.includes('Long daylight') && avgBestSunshine !== null && avgBestSunshine >= 8) {
    derivedTags.push('Long daylight');
  }

  return mergeTags(existingTags, derivedTags);
}

function deriveSeasonalInsight(
  destination: DestinationRecord,
  climateRows: MonthlyClimateRecord[],
  summary: string | null,
  travelTags: string[],
) {
  const bestMonthNumbers = normalizeMonthNumbers(destination.best_months);
  const fallbackBestRows = [...climateRows]
    .filter((row) => Number.isFinite(row.comfort_score))
    .sort((left, right) => Number(right.comfort_score ?? 0) - Number(left.comfort_score ?? 0))
    .slice(0, 3);
  const bestRows = bestMonthNumbers.length > 0
    ? climateRows.filter((row) => bestMonthNumbers.includes(Number(row.month)))
    : fallbackBestRows;
  const windowLabel = formatMonthRange(
    bestMonthNumbers.length > 0 ? bestMonthNumbers : fallbackBestRows.map((row) => row.month),
  );
  const avgBestHigh = average(bestRows.map((row) => row.avg_high_c));
  const avgBestPrecip = average(bestRows.map((row) => row.avg_precip_mm));
  const avgBestHumidity = average(bestRows.map((row) => row.avg_humidity));
  const avgBestSunshine = average(bestRows.map((row) => row.sunshine_hours));
  const conditionsPhrase = buildSeasonalConditionsPhrase(
    avgBestHigh,
    avgBestPrecip,
    avgBestHumidity,
    avgBestSunshine,
  );
  const humidityNote = describeHumidity(avgBestHumidity);
  const experienceCue = buildExperienceCue(travelTags);
  const offSeasonConstraint = buildOffSeasonConstraint(
    climateRows,
    bestMonthNumbers.length > 0 ? bestMonthNumbers : fallbackBestRows.map((row) => row.month),
    avgBestPrecip,
  );
  const summaryCue = summary && /\b(?:temple|garden|coast|beach|mountain|design|nature|food)\b/i.test(summary)
    ? 'That is usually when the destination feels easiest to enjoy at full pace.'
    : '';

  return trimToSentenceBoundary(
    [
      `${windowLabel} is usually the easiest time to plan a trip to ${destination.name}, thanks to ${conditionsPhrase || 'more travel-friendly conditions'}.`,
      `That window is best for ${experienceCue}.`,
      humidityNote,
      offSeasonConstraint,
      summaryCue,
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' '),
    320,
  );
}

function scoreWikimediaPage(page: WikimediaSearchPage, destination: DestinationRecord) {
  const normalizedName = normalizeForComparison(destination.name);
  const normalizedCountry = normalizeForComparison(destination.country);
  const pageTitle = normalizeForComparison(page.title);
  const matchedTitle = normalizeForComparison(page.matched_title ?? '');
  const description = normalizeForComparison(page.description ?? '');

  let score = 0;

  if (pageTitle === normalizedName) {
    score += 100;
  }

  if (matchedTitle === normalizedName) {
    score += 70;
  }

  if (pageTitle.includes(normalizedName)) {
    score += 30;
  }

  if (matchedTitle.includes(normalizedName)) {
    score += 20;
  }

  if (description.includes('city')) {
    score += 12;
  }

  if (description.includes(normalizedCountry)) {
    score += 10;
  }

  if (page.thumbnail?.url) {
    score += 4;
  }

  return score;
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

async function fetchWikimediaSummaryCandidate(destination: DestinationRecord): Promise<WikimediaSummaryAttempt> {
  const query = `${destination.name} ${destination.country}`;

  try {
    const searchUrl = new URL(WIKIMEDIA_SEARCH_API_URL);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('limit', '5');

    const searchResponse = await fetchJson<WikimediaSearchResponse>(
      searchUrl.toString(),
      {
        headers: buildWikimediaHeaders(),
      },
      `Wikimedia search request for ${destination.slug}`,
    );

    const pages = toArray(searchResponse.pages);

    if (pages.length === 0) {
      return {
        success: false,
        warning: `No Wikimedia summary candidate was found for ${destination.slug}.`,
        payload: {
          request: {
            endpoint: WIKIMEDIA_SEARCH_API_URL,
            query,
            limit: 5,
          },
          error: 'No search results returned.',
        },
      };
    }

    const selectedPage = [...pages].sort(
      (left, right) => scoreWikimediaPage(right, destination) - scoreWikimediaPage(left, destination),
    )[0];

    const pageHtmlUrl = `${WIKIMEDIA_PAGE_API_BASE_URL}/${encodeURIComponent(selectedPage.key)}/with_html`;
    const pageResponse = await fetchJson<WikimediaPageHtmlResponse>(
      pageHtmlUrl,
      {
        headers: buildWikimediaHeaders(),
      },
      `Wikimedia page request for ${destination.slug}`,
    );

    const leadParagraph = extractLeadParagraph(pageResponse.html ?? '');
    const excerptText = cleanExtractedText(selectedPage.excerpt ?? '');
    const description = normalizeOptionalText(selectedPage.description);
    const rawSummaryText = stripWikimediaSummaryNoise(
      leadParagraph
        || excerptText
        || (description ? `${destination.name} is ${description}.` : ''),
    );
    const summaryFacts = deriveSummaryFacts(
      destination,
      rawSummaryText,
      description,
    );
    const summaryText = buildPolishedSummary(destination, summaryFacts);

    if (!summaryText) {
      return {
        success: false,
        warning: `Wikimedia did not return a usable summary for ${destination.slug}.`,
        payload: {
          request: {
            endpoint: WIKIMEDIA_SEARCH_API_URL,
            query,
            limit: 5,
          },
          selected_page: {
            id: selectedPage.id,
            key: selectedPage.key,
            title: selectedPage.title,
            description: selectedPage.description ?? null,
          },
          error: 'The selected page did not contain a usable summary paragraph.',
        },
      };
    }

    return {
      success: true,
      summary: summaryText,
      externalId: selectedPage.key,
      payload: {
        request: {
          search_endpoint: WIKIMEDIA_SEARCH_API_URL,
          page_endpoint: pageHtmlUrl,
          query,
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
        raw_summary: rawSummaryText || null,
        summary_facts: summaryFacts
          ? {
            identity_key: summaryFacts.identityKey,
            identity_label: summaryFacts.identityLabel,
            known_for_highlights: summaryFacts.knownForHighlights,
            trip_styles: summaryFacts.tripStyles,
            source_tags: summaryFacts.sourceTags,
            cleaned_source_text: summaryFacts.cleanedSourceText,
            cleaned_description: summaryFacts.cleanedDescription,
          }
          : null,
        normalized_summary: summaryText,
        supporting_excerpt: excerptText || null,
      },
    };
  } catch (error) {
    return {
      success: false,
      warning: error instanceof Error
        ? error.message
        : `Wikimedia summary enrichment failed for ${destination.slug}.`,
      payload: {
        request: {
          endpoint: WIKIMEDIA_SEARCH_API_URL,
          query,
          limit: 5,
        },
        error: error instanceof Error ? error.message : 'Unknown Wikimedia enrichment failure.',
      },
    };
  }
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

async function fetchUnsplashHeroCandidate(
  destination: DestinationRecord,
  unsplashAccessKey: string,
): Promise<UnsplashHeroAttempt> {
  const query = `${destination.name} ${destination.country}`;

  try {
    const searchUrl = new URL(UNSPLASH_SEARCH_API_URL);
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('orientation', 'landscape');
    searchUrl.searchParams.set('per_page', '5');
    searchUrl.searchParams.set('content_filter', 'high');

    const searchResponse = await fetchJson<UnsplashSearchResponse>(
      searchUrl.toString(),
      {
        headers: {
          authorization: `Client-ID ${unsplashAccessKey}`,
          'accept-version': 'v1',
        },
      },
      `Unsplash search request for ${destination.slug}`,
    );

    const selectedPhoto = toArray(searchResponse.results)[0];

    if (!selectedPhoto) {
      return {
        success: false,
        warning: `No Unsplash image candidate was found for ${destination.slug}.`,
        payload: {
          request: {
            endpoint: UNSPLASH_SEARCH_API_URL,
            query,
            orientation: 'landscape',
            per_page: 5,
            content_filter: 'high',
          },
          error: 'No search results returned.',
        },
      };
    }

    const heroImageUrl = buildUnsplashHeroUrl(selectedPhoto);

    if (!heroImageUrl) {
      return {
        success: false,
        warning: `Unsplash returned a photo without a usable image URL for ${destination.slug}.`,
        payload: {
          request: {
            endpoint: UNSPLASH_SEARCH_API_URL,
            query,
            orientation: 'landscape',
            per_page: 5,
            content_filter: 'high',
          },
          selected_photo: {
            id: selectedPhoto.id,
            slug: selectedPhoto.slug ?? null,
          },
          error: 'No usable image URL was returned for the selected photo.',
        },
      };
    }

    return {
      success: true,
      heroImageUrl,
      attribution: {
        sourceName: UNSPLASH_SOURCE_LABEL,
        sourceUrl: buildUnsplashReferralUrl(selectedPhoto.links?.html ?? 'https://unsplash.com'),
        photographerName: normalizeOptionalText(selectedPhoto.user?.name),
        photographerUrl: buildUnsplashReferralUrl(selectedPhoto.user?.links?.html ?? null),
      },
      externalId: selectedPhoto.id,
      payload: {
        request: {
          endpoint: UNSPLASH_SEARCH_API_URL,
          query,
          orientation: 'landscape',
          per_page: 5,
          content_filter: 'high',
        },
        selected_photo: {
          id: selectedPhoto.id,
          slug: selectedPhoto.slug ?? null,
          alt_description: selectedPhoto.alt_description ?? null,
          description: selectedPhoto.description ?? null,
          hero_image_url: heroImageUrl,
          attribution_source_name: UNSPLASH_SOURCE_LABEL,
          attribution_source_url: buildUnsplashReferralUrl(selectedPhoto.links?.html ?? 'https://unsplash.com'),
          photo_page_url: buildUnsplashReferralUrl(selectedPhoto.links?.html ?? 'https://unsplash.com'),
          download_location: selectedPhoto.links?.download_location ?? null,
          photographer_name: selectedPhoto.user?.name ?? null,
          photographer_username: selectedPhoto.user?.username ?? null,
          photographer_profile_url: buildUnsplashReferralUrl(selectedPhoto.user?.links?.html ?? null),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      warning: error instanceof Error
        ? error.message
        : `Unsplash hero enrichment failed for ${destination.slug}.`,
      payload: {
        request: {
          endpoint: UNSPLASH_SEARCH_API_URL,
          query,
          orientation: 'landscape',
          per_page: 5,
          content_filter: 'high',
        },
        error: error instanceof Error ? error.message : 'Unknown Unsplash enrichment failure.',
      },
    };
  }
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
    let selectedDestinations: DestinationRecord[] = [];

    if (selection.requestedSlugs) {
      const { data, error } = await supabase
        .from('destinations')
        .select(
          'id, slug, name, country, country_code, continent, latitude, longitude, timezone, summary, hero_image_url, hero_image_source_name, hero_image_source_url, hero_image_attribution_name, hero_image_attribution_url, best_months, travel_tags, seasonal_insight, climate_import_status, enrichment_status, is_published',
        )
        .in('slug', selection.requestedSlugs);

      if (error) {
        throw error;
      }

      const destinationBySlug = new Map((data ?? []).map((destination) => [destination.slug, destination]));
      const missingSlugs = selection.requestedSlugs.filter((slug) => !destinationBySlug.has(slug));

      if (missingSlugs.length > 0) {
        throw new Error(`Unknown destination slugs requested: ${missingSlugs.join(', ')}`);
      }

      selectedDestinations = selection.requestedSlugs.map((slug) => destinationBySlug.get(slug)!);

      const climateBlockedDestinations = selectedDestinations.filter(
        (destination) => destination.climate_import_status !== 'imported',
      );

      if (climateBlockedDestinations.length > 0) {
        throw new Error(
          `Only climate-imported destinations can be enriched. Blocked slugs: ${climateBlockedDestinations
            .map((destination) => `${destination.slug} (${destination.climate_import_status})`)
            .join(', ')}`,
        );
      }

      if (selection.allowReenrichExisting) {
        const blockedDestinations = selectedDestinations.filter(
          (destination) => destination.enrichment_status !== 'enriched',
        );

        if (blockedDestinations.length > 0) {
          throw new Error(
            `allow_reenrich_existing only applies to already enriched destinations. Blocked slugs: ${blockedDestinations
              .map((destination) => `${destination.slug} (${destination.enrichment_status})`)
              .join(', ')}`,
          );
        }
      } else if (!selection.allowNonPending) {
        const blockedDestinations = selectedDestinations.filter(
          (destination) => destination.enrichment_status !== 'pending',
        );

        if (blockedDestinations.length > 0) {
          throw new Error(
            `Only pending destinations can be enriched without override. Blocked slugs: ${blockedDestinations
              .map((destination) => `${destination.slug} (${destination.enrichment_status})`)
              .join(', ')}`,
          );
        }
      } else {
        const enrichedDestinations = selectedDestinations.filter(
          (destination) => destination.enrichment_status === 'enriched',
        );

        if (enrichedDestinations.length > 0) {
          throw new Error(
            `Already enriched destinations require allow_reenrich_existing on a single explicit slug. Blocked slugs: ${enrichedDestinations
              .map((destination) => destination.slug)
              .join(', ')}`,
          );
        }
      }
    } else {
      const { data, error } = await supabase
        .from('destinations')
        .select(
          'id, slug, name, country, country_code, continent, latitude, longitude, timezone, summary, hero_image_url, hero_image_source_name, hero_image_source_url, hero_image_attribution_name, hero_image_attribution_url, best_months, travel_tags, seasonal_insight, climate_import_status, enrichment_status, is_published',
        )
        .eq('climate_import_status', 'imported')
        .eq('enrichment_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(selection.limit);

      if (error) {
        throw error;
      }

      selectedDestinations = data ?? [];
    }

    if (selectedDestinations.length === 0) {
      return jsonResponse(200, {
        message: 'No destinations matched the enrichment selection.',
        selected_destination_count: 0,
      });
    }

    const runMetadata = {
      enrichment_mode: selection.allowReenrichExisting
        ? 'single_slug_reenrichment'
        : selection.requestedSlugs
          ? 'explicit_selection'
          : 'pending_queue',
      allow_non_pending: selection.allowNonPending,
      allow_reenrich_existing: selection.allowReenrichExisting,
      overwrite_existing: selection.overwriteExisting,
      selected_slugs: selectedDestinations.map((destination) => destination.slug),
      source_names: [WIKIMEDIA_SOURCE_NAME, UNSPLASH_SOURCE_NAME],
    };

    const { data: ingestionRun, error: ingestionRunError } = await supabase
      .from('ingestion_runs')
      .insert({
        pipeline_name: 'enrich-destination',
        source_name: ENRICHMENT_SOURCE_NAME,
        source_version: ENRICHMENT_SOURCE_VERSION,
        status: 'running',
        records_seen: selectedDestinations.length,
        metadata: runMetadata,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (ingestionRunError) {
      throw ingestionRunError;
    }

    const destinationResults: DestinationResult[] = [];
    let successfulDestinationCount = 0;
    let failedDestinationCount = 0;
    let snapshotsWritten = 0;

    for (const destination of selectedDestinations) {
      const previousEnrichmentStatus = destination.enrichment_status;

      try {
        const { error: setEnrichingError } = await supabase
          .from('destinations')
          .update({ enrichment_status: 'enriching' })
          .eq('id', destination.id);

        if (setEnrichingError) {
          throw setEnrichingError;
        }

        const { data: climateRows, error: climateRowsError } = await supabase
          .from('monthly_climate')
          .select(
            'month, avg_high_c, avg_low_c, avg_precip_mm, avg_humidity, sunshine_hours, comfort_score, recommendation_label',
          )
          .eq('destination_id', destination.id)
          .order('month', { ascending: true });

        if (climateRowsError) {
          throw climateRowsError;
        }

        if ((climateRows ?? []).length !== 12) {
          throw new Error(
            `Destination ${destination.slug} is not enrichment-ready because it does not have 12 monthly climate rows.`,
          );
        }

        const warnings: string[] = [];
        const fieldsUpdated: string[] = [];
        const snapshotRows: Array<{
          destination_id: string;
          ingestion_run_id: string;
          source_name: string;
          external_id: string | null;
          payload: Record<string, unknown>;
        }> = [];

        let summary = normalizeOptionalText(destination.summary);

        if (!summary || selection.overwriteExisting) {
          const wikimediaAttempt = await fetchWikimediaSummaryCandidate(destination);

          snapshotRows.push({
            destination_id: destination.id,
            ingestion_run_id: ingestionRun.id,
            source_name: WIKIMEDIA_SOURCE_NAME,
            external_id: wikimediaAttempt.externalId ?? null,
            payload: wikimediaAttempt.payload,
          });

          if (wikimediaAttempt.success && wikimediaAttempt.summary) {
            if (wikimediaAttempt.summary !== summary) {
              fieldsUpdated.push('summary');
            }

            summary = wikimediaAttempt.summary;
          } else if (wikimediaAttempt.warning) {
            warnings.push(wikimediaAttempt.warning);
          }
        }

        let heroImageUrl = normalizeOptionalText(destination.hero_image_url);
        let heroImageSourceName = normalizeOptionalText(destination.hero_image_source_name);
        let heroImageSourceUrl = normalizeOptionalText(destination.hero_image_source_url);
        let heroImageAttributionName = normalizeOptionalText(destination.hero_image_attribution_name);
        let heroImageAttributionUrl = normalizeOptionalText(destination.hero_image_attribution_url);

        if (!heroImageUrl || selection.overwriteExisting) {
          const unsplashAttempt = await fetchUnsplashHeroCandidate(destination, unsplashAccessKey);

          snapshotRows.push({
            destination_id: destination.id,
            ingestion_run_id: ingestionRun.id,
            source_name: UNSPLASH_SOURCE_NAME,
            external_id: unsplashAttempt.externalId ?? null,
            payload: unsplashAttempt.payload,
          });

          if (unsplashAttempt.success && unsplashAttempt.heroImageUrl) {
            if (unsplashAttempt.heroImageUrl !== heroImageUrl) {
              fieldsUpdated.push('hero_image_url');
            }

            heroImageUrl = unsplashAttempt.heroImageUrl;

            const nextHeroImageSourceName = normalizeOptionalText(unsplashAttempt.attribution?.sourceName);
            const nextHeroImageSourceUrl = normalizeOptionalText(unsplashAttempt.attribution?.sourceUrl);
            const nextHeroImageAttributionName = normalizeOptionalText(unsplashAttempt.attribution?.photographerName);
            const nextHeroImageAttributionUrl = normalizeOptionalText(unsplashAttempt.attribution?.photographerUrl);

            if (nextHeroImageSourceName !== heroImageSourceName) {
              fieldsUpdated.push('hero_image_source_name');
            }

            if (nextHeroImageSourceUrl !== heroImageSourceUrl) {
              fieldsUpdated.push('hero_image_source_url');
            }

            if (nextHeroImageAttributionName !== heroImageAttributionName) {
              fieldsUpdated.push('hero_image_attribution_name');
            }

            if (nextHeroImageAttributionUrl !== heroImageAttributionUrl) {
              fieldsUpdated.push('hero_image_attribution_url');
            }

            heroImageSourceName = nextHeroImageSourceName;
            heroImageSourceUrl = nextHeroImageSourceUrl;
            heroImageAttributionName = nextHeroImageAttributionName;
            heroImageAttributionUrl = nextHeroImageAttributionUrl;
          } else if (unsplashAttempt.warning) {
            warnings.push(unsplashAttempt.warning);
          }
        }

        const existingTags = normalizeTags(destination.travel_tags);
        const enrichedTags = deriveTravelTags(destination, climateRows ?? [], summary, existingTags);

        if (!arraysEqual(existingTags, enrichedTags)) {
          fieldsUpdated.push('travel_tags');
        }

        let seasonalInsight = normalizeOptionalText(destination.seasonal_insight);
        const derivedSeasonalInsight = deriveSeasonalInsight(
          destination,
          climateRows ?? [],
          summary,
          enrichedTags,
        );

        if ((selection.overwriteExisting || !seasonalInsight) && derivedSeasonalInsight) {
          if (derivedSeasonalInsight !== seasonalInsight) {
            fieldsUpdated.push('seasonal_insight');
          }

          seasonalInsight = derivedSeasonalInsight;
        }

        snapshotRows.push({
          destination_id: destination.id,
          ingestion_run_id: ingestionRun.id,
          source_name: DERIVATION_SOURCE_NAME,
          external_id: null,
          payload: {
            best_months: normalizeMonthNumbers(destination.best_months),
            derived_travel_tags: enrichedTags,
            derived_seasonal_insight: seasonalInsight,
            input_summary: summary,
            hero_image_attribution: {
              source_name: heroImageSourceName,
              source_url: heroImageSourceUrl,
              photographer_name: heroImageAttributionName,
              photographer_url: heroImageAttributionUrl,
            },
            climate_row_count: climateRows?.length ?? 0,
          },
        });

        const enrichmentMissingRequirements: string[] = [];

        if (!summary) {
          enrichmentMissingRequirements.push('summary');
        }

        if (!heroImageUrl) {
          enrichmentMissingRequirements.push('hero_image_url');
        }

        if (enrichedTags.length === 0) {
          enrichmentMissingRequirements.push('travel_tags');
        }

        if (!seasonalInsight) {
          enrichmentMissingRequirements.push('seasonal_insight');
        }

        const enrichmentStatus = enrichmentMissingRequirements.length === 0 ? 'enriched' : 'failed';

        const { error: snapshotInsertError } = await supabase
          .from('destination_source_snapshots')
          .insert(snapshotRows);

        if (snapshotInsertError) {
          throw snapshotInsertError;
        }

        snapshotsWritten += snapshotRows.length;

        const { error: updateDestinationError } = await supabase
          .from('destinations')
          .update({
            summary,
            hero_image_url: heroImageUrl,
            hero_image_source_name: heroImageSourceName,
            hero_image_source_url: heroImageSourceUrl,
            hero_image_attribution_name: heroImageAttributionName,
            hero_image_attribution_url: heroImageAttributionUrl,
            travel_tags: enrichedTags,
            seasonal_insight: seasonalInsight,
            enrichment_status: enrichmentStatus,
          })
          .eq('id', destination.id);

        if (updateDestinationError) {
          throw updateDestinationError;
        }

        const { data: publishReadiness, error: publishReadinessError } = await supabase
          .rpc('refresh_destination_publish_readiness', {
            p_destination_id: destination.id,
          })
          .single();

        if (publishReadinessError) {
          throw publishReadinessError;
        }

        const resultStatus = enrichmentStatus === 'enriched' ? 'enriched' : 'failed';
        const missingRequirements = publishReadiness?.missing_requirements ?? enrichmentMissingRequirements;

        if (resultStatus === 'enriched') {
          successfulDestinationCount += 1;
        } else {
          failedDestinationCount += 1;
        }

        destinationResults.push({
          slug: destination.slug,
          status: resultStatus,
          is_published: publishReadiness?.is_published ?? false,
          missing_requirements: missingRequirements,
          fields_updated: [...new Set(fieldsUpdated)],
          warnings: warnings.length > 0 ? warnings : undefined,
        });
      } catch (error) {
        const restoredStatus = previousEnrichmentStatus === 'enriched'
          ? 'enriched'
          : previousEnrichmentStatus === 'failed'
            ? 'failed'
            : 'failed';

        await supabase
          .from('destinations')
          .update({ enrichment_status: restoredStatus })
          .eq('id', destination.id);

        if (restoredStatus === 'enriched') {
          await supabase.rpc('refresh_destination_publish_readiness', {
            p_destination_id: destination.id,
          });
        }

        failedDestinationCount += 1;
        destinationResults.push({
          slug: destination.slug,
          status: 'failed',
          is_published: destination.is_published,
          missing_requirements: [],
          fields_updated: [],
          warnings: [
            error instanceof Error ? error.message : 'Unknown destination enrichment failure.',
          ],
        });
      }
    }

    const ingestionStatus = successfulDestinationCount === selectedDestinations.length
      ? 'succeeded'
      : successfulDestinationCount > 0
        ? 'partial'
        : 'failed';
    const errorSummary = destinationResults
      .filter((result) => result.status === 'failed' && result.warnings && result.warnings.length > 0)
      .map((result) => `${result.slug}: ${result.warnings?.join('; ')}`)
      .join(' | ');

    const { error: finishRunError } = await supabase
      .from('ingestion_runs')
      .update({
        status: ingestionStatus,
        records_written: successfulDestinationCount,
        records_failed: failedDestinationCount,
        error_summary: errorSummary ? errorSummary.slice(0, 2000) : null,
        metadata: {
          ...runMetadata,
          destination_source_snapshots_written: snapshotsWritten,
        },
        finished_at: new Date().toISOString(),
      })
      .eq('id', ingestionRun.id);

    if (finishRunError) {
      throw finishRunError;
    }

    return jsonResponse(200, {
      ingestion_run_id: ingestionRun.id,
      source_name: ENRICHMENT_SOURCE_NAME,
      source_version: ENRICHMENT_SOURCE_VERSION,
      enriched_destination_count: successfulDestinationCount,
      failed_destination_count: failedDestinationCount,
      destinations_processed: destinationResults,
    });
  } catch (error) {
    const isServerMisconfiguration =
      error instanceof Error && error.message.startsWith('Missing required environment variable:');

    return jsonResponse(isServerMisconfiguration ? 500 : 400, {
      error: error instanceof Error ? error.message : 'Invalid destination enrichment request.',
    });
  }
});
