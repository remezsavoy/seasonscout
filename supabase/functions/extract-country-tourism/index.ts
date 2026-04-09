import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type TourismRequestBody = {
  country?: string;
};

type WikipediaQueryResponse = {
  query?: {
    pages?: WikipediaPage[];
  };
};

type WikipediaPage = {
  title?: string;
  missing?: boolean;
  invalid?: boolean;
  extract?: string;
};

type WikipediaSource = {
  title: string;
  extract: string;
};

type GeminiGenerateContentResponse = {
  candidates?: GeminiCandidate[];
  promptFeedback?: {
    blockReason?: string;
    blockReasonMessage?: string;
  };
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
  finishReason?: string;
};

type GeminiPart = {
  text?: string;
};

type TourismExtraction = {
  country: string;
  sourcePage: string;
  mostVisitedConfirmed: string[];
  featuredCities: string[];
  featuredDestinations: string[];
  featuredExperiences: string[];
  tourismSignals: string[];
  notes: string[];
  confidence: number;
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'OPTIONS, POST',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  'content-type': 'application/json; charset=utf-8',
};

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const WIKIPEDIA_USER_AGENT = 'SeasonScout/0.1 (extract-country-tourism edge function)';
const SOURCE_PREVIEW_LIMIT = 3000;
const SOURCE_TEXT_LIMIT_FOR_MODEL = 25000;
const MIN_READABLE_SOURCE_LENGTH = 200;
const DEFAULT_CONFIDENCE = 0.5;
const MIN_CONFIDENCE = 0.5;
const MAX_CONFIDENCE = 0.95;
const MAX_MOST_VISITED = 10;
const MAX_FEATURED_CITIES = 12;
const MAX_FEATURED_DESTINATIONS = 12;
const MAX_FEATURED_EXPERIENCES = 8;
const MAX_TOURISM_SIGNALS = 10;
const MAX_NOTES = 5;

const EXPERIENCE_KEYWORDS = [
  'onsen',
  'ryokan',
  'shinkansen',
  'rail travel',
  'train travel',
  'skiing',
  'ski',
  'diving',
  'whale watching',
  'safari',
  'nightlife',
  'hot springs',
  'hot spring',
  'temple stays',
  'temple stay',
] as const;

const PLACE_HINT_PATTERNS = [
  /\bmount\b/i,
  /\bmountain\b/i,
  /\bbeach\b/i,
  /\blake\b/i,
  /\bisland\b/i,
  /\bpark\b/i,
  /\bshrine\b/i,
  /\bcastle\b/i,
  /\bdistrict\b/i,
  /\bregion\b/i,
  /\barea\b/i,
  /\bsite\b/i,
  /\bmonument\b/i,
  /\bgeopark\b/i,
  /\bpeninsula\b/i,
  /\bbay\b/i,
  /\bcoast\b/i,
  /\bgarden\b/i,
  /\btemple\b/i,
  /\bvillage\b/i,
  /\barchipelago\b/i,
] as const;

const STRONG_DESTINATION_PATTERNS = [
  /\bmount\b/i,
  /\bmountain\b/i,
  /\bisland\b/i,
  /\bpeninsula\b/i,
  /\bpark\b/i,
  /\blake\b/i,
  /\bshrine\b/i,
  /\bcastle\b/i,
  /\bgeopark\b/i,
  /\bheritage\b/i,
  /\bmonument\b/i,
  /\bsite\b/i,
  /\barea\b/i,
  /\bdistrict\b/i,
  /\bcoast\b/i,
  /\bbeach\b/i,
  /\bcaldera\b/i,
  /\bvolcanic\b/i,
  /\bgroup\b/i,
] as const;

const TOURISM_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    country: {
      type: 'string',
      description: 'The requested country as supported by the source text.',
    },
    sourcePage: {
      type: 'string',
      description: 'The exact Wikipedia page title used as the source.',
    },
    mostVisitedConfirmed: {
      type: 'array',
      description:
        'Places explicitly described as most visited, primary destinations, or top tourist attractions.',
      maxItems: 10,
      items: {
        type: 'string',
      },
    },
    featuredCities: {
      type: 'array',
      description: 'Cities explicitly supported by the source text.',
      maxItems: 12,
      items: {
        type: 'string',
      },
    },
    featuredDestinations: {
      type: 'array',
      description:
        'Places only, excluding cities and excluding experiences.',
      maxItems: MAX_FEATURED_DESTINATIONS,
      items: {
        type: 'string',
      },
    },
    featuredExperiences: {
      type: 'array',
      description:
        'Non-place tourism experiences only, excluding destinations and cities.',
      maxItems: MAX_FEATURED_EXPERIENCES,
      items: {
        type: 'string',
      },
    },
    tourismSignals: {
      type: 'array',
      description:
        'Short lowercase tourism tags such as culture, beaches, heritage, islands, wildlife, mountains, cities, food, rail travel.',
      maxItems: MAX_TOURISM_SIGNALS,
      items: {
        type: 'string',
      },
    },
    notes: {
      type: 'array',
      description: 'Short evidence-based notes useful for a travel profile only.',
      maxItems: MAX_NOTES,
      items: {
        type: 'string',
      },
    },
    confidence: {
      type: 'number',
      minimum: MIN_CONFIDENCE,
      maximum: MAX_CONFIDENCE,
      description: 'A confidence score between 0.50 and 0.95 based only on source clarity.',
    },
  },
  required: [
    'country',
    'sourcePage',
    'mostVisitedConfirmed',
    'featuredCities',
    'featuredDestinations',
    'featuredExperiences',
    'tourismSignals',
    'notes',
    'confidence',
  ],
} as const;

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: JSON_HEADERS,
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new HttpError(500, `Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeCountry(value: unknown) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'country must be a string.');
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new HttpError(400, 'country is required.');
  }

  return normalizedValue;
}

function parseRequestBody(rawBody: string): TourismRequestBody {
  if (!rawBody.trim()) {
    throw new HttpError(400, 'Request body is required.');
  }

  try {
    const parsedBody = JSON.parse(rawBody);

    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
      throw new HttpError(400, 'Request body must be a JSON object.');
    }

    return parsedBody as TourismRequestBody;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(400, 'Request body must be valid JSON.');
  }
}

function cleanSourceText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isReadableSource(value: string) {
  return value.length >= MIN_READABLE_SOURCE_LENGTH
    && !/^#redirect/i.test(value)
    && !/\bmay refer to:\b/i.test(value);
}

function buildWikipediaExtractUrl(title: string) {
  const url = new URL(WIKIPEDIA_API_URL);
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('prop', 'extracts');
  url.searchParams.set('explaintext', '1');
  url.searchParams.set('exsectionformat', 'plain');
  url.searchParams.set('redirects', '1');
  url.searchParams.set('titles', title);
  return url;
}

async function fetchWikipediaPage(title: string): Promise<WikipediaSource | null> {
  const response = await fetch(buildWikipediaExtractUrl(title), {
    headers: {
      accept: 'application/json',
      'user-agent': WIKIPEDIA_USER_AGENT,
    },
  });

  if (!response.ok) {
    const failureBody = await response.text();
    throw new HttpError(
      502,
      `Wikipedia request failed with ${response.status}: ${failureBody.slice(0, 300)}`,
    );
  }

  const payload = await response.json() as WikipediaQueryResponse;
  const page = payload.query?.pages?.[0];

  if (!page || page.missing || page.invalid || typeof page.title !== 'string') {
    return null;
  }

  const extract = cleanSourceText(page.extract ?? '');

  if (!isReadableSource(extract)) {
    return null;
  }

  return {
    title: page.title,
    extract,
  };
}

async function findWikipediaTourismSource(country: string) {
  const attemptedTitles = [
    `Tourism in ${country}`,
    `${country} tourism`,
  ];

  for (const title of attemptedTitles) {
    const source = await fetchWikipediaPage(title);

    if (source) {
      return {
        source,
        attemptedTitles,
      };
    }
  }

  return {
    source: null,
    attemptedTitles,
  };
}

function buildGeminiSystemInstruction() {
  return [
    'You are extracting tourism information from exactly one Wikipedia page.',
    'Use ONLY information explicitly supported by the source text.',
    'Do NOT use outside knowledge.',
    'Do NOT guess.',
    'Return valid JSON only.',
    'Required JSON shape:',
    '{',
    '  "country": string,',
    '  "sourcePage": string,',
    '  "mostVisitedConfirmed": string[],',
    '  "featuredCities": string[],',
    '  "featuredDestinations": string[],',
    '  "featuredExperiences": string[],',
    '  "tourismSignals": string[],',
    '  "notes": string[],',
    '  "confidence": number',
    '}',
    'Strict rules:',
    '- featuredCities: cities only. No regions, no landmarks, no transport, no lodging types, no cultural concepts.',
    '- featuredDestinations: places only. These may include regions, islands, parks, heritage sites, shrines, mountains, beaches, lakes, districts, or tourism areas. Do NOT include cities here. Do NOT include experiences here.',
    '- featuredExperiences: non-place tourism experiences only. Examples: hot springs, rail travel, skiing, diving, temple stays, safari, whale watching, nightlife. Do NOT include places here.',
    '- tourismSignals: short lowercase tags only, such as culture, beaches, heritage, islands, wildlife, mountains, cities, food, rail travel.',
    'mostVisitedConfirmed only for places explicitly described as most visited, primary destination, or top tourist attraction.',
    '- notes: maximum 5 short evidence-based notes. Include only information useful for a travel profile. Do NOT include deep history unless directly relevant to tourism.',
    '- confidence: a number between 0.50 and 0.95. Never return 1.',
    'Output quality rules:',
    '- Prefer precision over recall.',
    '- If unsure, leave the item out.',
    '- Remove duplicates.',
    '- Keep lists focused and product-useful.',
  ].join('\n');
}

function buildGeminiUserPrompt(country: string, wikipediaPageTitle: string, sourceText: string) {
  return [
    `Requested country: ${country}`,
    `Source page: ${wikipediaPageTitle}`,
    'Extract the structured tourism data from the following source text.',
    '',
    'Source text:',
    sourceText,
  ].join('\n');
}

function unwrapJsonText(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith('```')) {
    return trimmedValue
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  return trimmedValue;
}

function removeTrailingCommas(value: string) {
  return value.replace(/,\s*([}\]])/g, '$1');
}

function extractJsonSubstring(value: string) {
  const objectStart = value.indexOf('{');
  const objectEnd = value.lastIndexOf('}');

  if (objectStart >= 0 && objectEnd > objectStart) {
    return value.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = value.indexOf('[');
  const arrayEnd = value.lastIndexOf(']');

  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return value.slice(arrayStart, arrayEnd + 1);
  }

  return value;
}

function parseJsonFromModelText(value: string) {
  const candidates = [
    value,
    unwrapJsonText(value),
    extractJsonSubstring(unwrapJsonText(value)),
    removeTrailingCommas(extractJsonSubstring(unwrapJsonText(value))),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next normalization step.
    }
  }

  const preview = unwrapJsonText(value).slice(0, 200).replace(/\s+/g, ' ');
  throw new HttpError(502, `Gemini returned invalid JSON. Preview: ${preview}`);
}

function extractGeminiText(payload: GeminiGenerateContentResponse) {
  const candidate = payload.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts
    .map((part) => typeof part.text === 'string' ? part.text : '')
    .join('')
    .trim();

  if (text) {
    return text;
  }

  if (payload.promptFeedback?.blockReason) {
    const details = payload.promptFeedback.blockReasonMessage
      ? ` ${payload.promptFeedback.blockReasonMessage}`
      : '';
    throw new HttpError(502, `Gemini blocked the request: ${payload.promptFeedback.blockReason}.${details}`);
  }

  if (candidate?.finishReason) {
    throw new HttpError(502, `Gemini returned no text output. Finish reason: ${candidate.finishReason}.`);
  }

  throw new HttpError(502, 'Gemini returned an empty completion.');
}

function expectObject(value: unknown, fieldName: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(502, `${fieldName} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(value);
  }

  return result;
}

function sanitizeStringList(value: unknown, limit: number, options?: { lowercase?: boolean }) {
  if (!Array.isArray(value)) {
    return [];
  }

  const sanitizedValues = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => normalizeWhitespace(options?.lowercase ? item.toLowerCase() : item))
    .filter(Boolean);

  return uniqueStrings(sanitizedValues).slice(0, limit);
}

function clampConfidence(value: unknown) {
  const numericValue = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value)
      : NaN;

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_CONFIDENCE;
  }

  return Math.min(MAX_CONFIDENCE, Math.max(MIN_CONFIDENCE, numericValue));
}

function isExperienceKeyword(value: string) {
  const normalizedValue = value.toLowerCase();
  return EXPERIENCE_KEYWORDS.some((keyword) => normalizedValue.includes(keyword));
}

function isClearlyPlace(value: string) {
  return PLACE_HINT_PATTERNS.some((pattern) => pattern.test(value));
}

function limitList(values: string[], limit: number) {
  return uniqueStrings(values).slice(0, limit);
}

function canonicalizeExperience(value: string) {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue.includes('shinkansen')) {
    return 'shinkansen travel';
  }

  if (normalizedValue.includes('ryokan')) {
    return 'ryokan stays';
  }

  if (normalizedValue.includes('onsen') || normalizedValue.includes('hot spring')) {
    return 'onsen';
  }

  if (normalizedValue.includes('ski')) {
    return 'skiing';
  }

  if (normalizedValue.includes('rail travel') || normalizedValue.includes('train travel')) {
    return 'rail travel';
  }

  if (normalizedValue.includes('whale watching')) {
    return 'whale watching';
  }

  if (normalizedValue.includes('safari')) {
    return 'safari';
  }

  if (normalizedValue.includes('nightlife')) {
    return 'nightlife';
  }

  if (normalizedValue.includes('diving')) {
    return 'diving';
  }

  if (normalizedValue.includes('temple stay')) {
    return 'temple stays';
  }

  if (normalizedValue.includes('pilgrimage')) {
    return 'pilgrimages';
  }

  const cleanedValue = normalizedValue
    .replace(/^(riding|taking|enjoying|experiencing|trying)\s+/i, '')
    .replace(/^japan['’]s network of\s+/i, '')
    .replace(/^traditional\s+/i, '')
    .replace(/[().]/g, '')
    .trim();

  return cleanedValue || null;
}

function normalizeFeaturedExperiences(values: string[]) {
  let normalizedValues = values
    .map(canonicalizeExperience)
    .filter((value): value is string => Boolean(value));

  normalizedValues = uniqueStrings(normalizedValues);

  if (normalizedValues.includes('shinkansen travel')) {
    normalizedValues = normalizedValues.filter((value) => value !== 'rail travel');
  }

  return normalizedValues.slice(0, MAX_FEATURED_EXPERIENCES);
}

function appearsAsCityInSource(item: string, sourceText: string) {
  const escapedItem = escapeRegExp(item);
  const patterns = [
    new RegExp(`\\bcities? like[^.]{0,200}\\b${escapedItem}\\b`, 'i'),
    new RegExp(`\\b${escapedItem}\\b[^.]{0,40}\\bcity\\b`, 'i'),
    new RegExp(`\\bcity\\b[^.]{0,40}\\b${escapedItem}\\b`, 'i'),
    new RegExp(`\\btown\\b[^.]{0,40}\\b${escapedItem}\\b`, 'i'),
  ];

  return patterns.some((pattern) => pattern.test(sourceText));
}

function appearsInPopularAttractions(item: string, sourceText: string) {
  const escapedItem = escapeRegExp(item);
  return new RegExp(`\\bpopular attractions[^.]{0,250}\\b${escapedItem}\\b`, 'i').test(sourceText);
}

function hasStrongDestinationShape(item: string) {
  return STRONG_DESTINATION_PATTERNS.some((pattern) => pattern.test(item));
}

function tightenFeaturedDestinations(
  values: string[],
  sourceText: string,
  featuredCities: string[],
) {
  const nextFeaturedCities = [...featuredCities];
  const cityKeys = new Set(nextFeaturedCities.map((item) => item.toLowerCase()));
  const keptDestinations: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();

    if (cityKeys.has(key)) {
      continue;
    }

    if (appearsAsCityInSource(value, sourceText)) {
      nextFeaturedCities.push(value);
      cityKeys.add(key);
      continue;
    }

    if (hasStrongDestinationShape(value) || appearsInPopularAttractions(value, sourceText)) {
      keptDestinations.push(value);
    }
  }

  return {
    featuredCities: limitList(nextFeaturedCities, MAX_FEATURED_CITIES),
    featuredDestinations: limitList(keptDestinations, MAX_FEATURED_DESTINATIONS),
  };
}

function buildSentenceList(values: string[]) {
  const normalizedValues = uniqueStrings(values).filter(Boolean);

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

function buildPopularAttractionAnchors(featuredCities: string[], featuredDestinations: string[]) {
  const anchors = [
    featuredCities[0],
    featuredCities[1],
    featuredDestinations[0],
    featuredCities[2] ?? featuredDestinations[1],
  ].filter((value): value is string => Boolean(value));

  return uniqueStrings(anchors).slice(0, 4);
}

function isTravelRelevantNote(value: string) {
  return !/\b(?:trillion|billion|million|gdp|export|expenditure|economic|medieval|edo period|1912|1930|2014)\b/i
    .test(value);
}

function buildTravelNotes(
  requestedCountry: string,
  sourceText: string,
  featuredCities: string[],
  featuredDestinations: string[],
  featuredExperiences: string[],
  rawNotes: unknown,
) {
  const notes: string[] = [];
  const attractionAnchors = buildPopularAttractionAnchors(featuredCities, featuredDestinations);

  if (/popular attractions/i.test(sourceText) && attractionAnchors.length >= 4) {
    notes.push(
      `The page explicitly lists ${buildSentenceList(attractionAnchors)} as popular attractions.`,
    );
  }

  const experienceHighlights = featuredExperiences
    .filter((value) => ['shinkansen travel', 'ryokan stays', 'onsen', 'skiing', 'rail travel'].includes(value))
    .slice(0, 3);

  if (experienceHighlights.length >= 2) {
    notes.push(
      `The page highlights ${buildSentenceList(experienceHighlights)} as notable visitor experiences.`,
    );
  }

  const heritageMatch = sourceText.match(/(\d+)\s+World Heritage Sites/i);

  if (heritageMatch) {
    notes.push(`The page says ${requestedCountry} has ${heritageMatch[1]} World Heritage Sites.`);
  }

  if (/\b(?:anime|manga|popular culture)\b/i.test(sourceText)) {
    notes.push('The page says Japanese popular culture, including anime and manga, helps drive tourism.');
  }

  if (/\bski resorts?\b/i.test(sourceText) && featuredExperiences.includes('skiing')) {
    notes.push('The page calls out ski resorts, including Niseko, as notable outdoor draws.');
  }

  const fallbackNotes = sanitizeStringList(rawNotes, MAX_NOTES * 2)
    .filter(isTravelRelevantNote);

  for (const note of fallbackNotes) {
    if (notes.length >= MAX_NOTES) {
      break;
    }

    notes.push(note);
  }

  return limitList(notes, MAX_NOTES);
}

function sanitizeTourismExtraction(
  value: unknown,
  requestedCountry: string,
  wikipediaPageTitle: string,
  sourceText: string,
): TourismExtraction {
  const record = expectObject(value, 'extracted');
  const initialFeaturedCities = sanitizeStringList(record.featuredCities, MAX_FEATURED_CITIES);
  const cityKeys = new Set(initialFeaturedCities.map((item) => item.toLowerCase()));
  let featuredDestinations = sanitizeStringList(record.featuredDestinations, MAX_FEATURED_DESTINATIONS * 2)
    .filter((item) => !cityKeys.has(item.toLowerCase()));
  let featuredExperiences = sanitizeStringList(record.featuredExperiences, MAX_FEATURED_EXPERIENCES * 2);

  const movedToExperiences = featuredDestinations.filter(isExperienceKeyword);
  featuredDestinations = featuredDestinations.filter((item) => !isExperienceKeyword(item));
  featuredExperiences = [...featuredExperiences, ...movedToExperiences];

  const movedToDestinations = featuredExperiences.filter(isClearlyPlace);
  featuredExperiences = featuredExperiences.filter((item) => !isClearlyPlace(item));
  featuredDestinations = [...featuredDestinations, ...movedToDestinations]
    .filter((item) => !cityKeys.has(item.toLowerCase()));

  const tightenedDestinations = tightenFeaturedDestinations(
    featuredDestinations,
    sourceText,
    initialFeaturedCities,
  );
  const normalizedFeaturedExperiences = normalizeFeaturedExperiences(featuredExperiences);

  return {
    country: typeof record.country === 'string' && record.country.trim()
      ? normalizeWhitespace(record.country)
      : requestedCountry,
    sourcePage: typeof record.sourcePage === 'string' && record.sourcePage.trim()
      ? normalizeWhitespace(record.sourcePage)
      : wikipediaPageTitle,
    mostVisitedConfirmed: sanitizeStringList(record.mostVisitedConfirmed, MAX_MOST_VISITED),
    featuredCities: tightenedDestinations.featuredCities,
    featuredDestinations: tightenedDestinations.featuredDestinations,
    featuredExperiences: normalizedFeaturedExperiences,
    tourismSignals: limitList(
      sanitizeStringList(record.tourismSignals, MAX_TOURISM_SIGNALS, { lowercase: true }),
      MAX_TOURISM_SIGNALS,
    ),
    notes: buildTravelNotes(
      requestedCountry,
      sourceText,
      tightenedDestinations.featuredCities,
      tightenedDestinations.featuredDestinations,
      normalizedFeaturedExperiences,
      record.notes,
    ),
    confidence: clampConfidence(record.confidence),
  };
}

async function extractTourismFacts(
  country: string,
  wikipediaPageTitle: string,
  sourceText: string,
): Promise<TourismExtraction> {
  const geminiApiKey = requireEnv('GEMINI_API_KEY');
  const modelInputSourceText = sourceText.slice(0, SOURCE_TEXT_LIMIT_FOR_MODEL);

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': geminiApiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: buildGeminiSystemInstruction(),
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: buildGeminiUserPrompt(country, wikipediaPageTitle, modelInputSourceText),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: TOURISM_RESPONSE_SCHEMA,
        temperature: 0,
        maxOutputTokens: 2200,
      },
    }),
  });

  if (!response.ok) {
    const failureBody = await response.text();
    throw new HttpError(
      502,
      `Gemini request failed with ${response.status}: ${failureBody.slice(0, 500)}`,
    );
  }

  const payload = await response.json() as GeminiGenerateContentResponse;
  const rawText = extractGeminiText(payload);

  try {
    return sanitizeTourismExtraction(
      parseJsonFromModelText(rawText),
      country,
      wikipediaPageTitle,
      sourceText,
    );
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(502, 'Gemini returned invalid JSON.');
  }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, {
      error: 'Method not allowed.',
      allowedMethods: ['OPTIONS', 'POST'],
    });
  }

  try {
    const body = parseRequestBody(await request.text());
    const requestedCountry = normalizeCountry(body.country);
    const { source, attemptedTitles } = await findWikipediaTourismSource(requestedCountry);

    if (!source) {
      return jsonResponse(404, {
        error: `No readable tourism page found for ${requestedCountry}.`,
        requestedCountry,
        attemptedTitles,
      });
    }

    const extracted = await extractTourismFacts(requestedCountry, source.title, source.extract);

    return jsonResponse(200, {
      requestedCountry,
      wikipediaPageTitle: source.title,
      sourcePreview: source.extract.slice(0, SOURCE_PREVIEW_LIMIT),
      sourceLength: source.extract.length,
      extracted,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.status, {
        error: error.message,
      });
    }

    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Unexpected extract-country-tourism error.',
    });
  }
});
