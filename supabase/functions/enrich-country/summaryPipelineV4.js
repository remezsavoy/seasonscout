import { validateBannedPhrases } from '../_shared/summaryValidators.js';

export const MAX_COUNTRY_SUMMARY_LENGTH = 360;

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

export const COUNTRY_SUMMARY_BANNED_PHRASES = [
  { key: 'offers-something-for-everyone', phrase: 'offers something for everyone' },
  { key: 'mix-of-culture-and-nature', phrase: 'mix of culture and nature' },
  { key: 'rich-history-vibrant-cities', phrase: 'rich history and vibrant cities' },
  { key: 'iconic-landmarks', phrase: 'iconic landmarks' },
  { key: 'season-driven-travel', phrase: 'season-driven travel' },
  { key: 'strong-local-character', phrase: 'strong local character' },
  { key: 'trip-variety', phrase: 'trip variety' },
  { key: 'distinct-regions', phrase: 'distinct regions' },
];

const COUNTRY_SUMMARY_ANCHOR_RULES = [
  {
    key: 'rail-city-hops',
    label: 'rail-linked city hops',
    patterns: [
      /\b(?:rail|railway|train|shinkansen|bullet train)\b.{0,100}\b(?:city|cities|district|urban|capital)\b/i,
      /\b(?:city|cities|district|urban|capital)\b.{0,100}\b(?:rail|railway|train|shinkansen|bullet train)\b/i,
    ],
    requireAllPatterns: false,
    sourceWeights: { wikipedia: 8, wikivoyage: 20, destinations: 14 },
  },
  {
    key: 'temple-districts',
    label: 'temple districts and shrines',
    patterns: [/\b(?:temple|temples|shrine|shrines|pagoda|pagodas|monastery|monasteries)\b/i],
    sourceWeights: { wikipedia: 8, wikivoyage: 20, destinations: 16 },
    destinationLabelBuilder: (destinationName) => `${toPossessive(destinationName)} temple districts`,
  },
  {
    key: 'historic-gardens',
    label: 'historic gardens and quieter districts',
    patterns: [/\b(?:garden|gardens|historic district|old town|heritage|traditional|castle|palace)\b/i],
    sourceWeights: { wikipedia: 10, wikivoyage: 16, destinations: 14 },
    destinationLabelBuilder: (destinationName) => `${toPossessive(destinationName)} gardens`,
  },
  {
    key: 'archaeology-quarters',
    label: 'archaeology sites and old quarters',
    patterns: [/\b(?:ruins|archaeological|archaeology|roman forum|acropolis|classical site|ancient site)\b/i],
    sourceWeights: { wikipedia: 8, wikivoyage: 16, destinations: 14 },
  },
  {
    key: 'food-stops',
    label: 'regional food stops',
    patterns: [/\b(?:cuisine|culinary|food|foods|market|markets|street food|ramen|sushi|wine|seafood)\b/i],
    sourceWeights: { wikipedia: 6, wikivoyage: 18, destinations: 14 },
  },
  {
    key: 'medina-souqs',
    label: 'medinas and souq quarters',
    patterns: [/\b(?:medina|medinas|souq|souqs|riad|riads|kasbah|kasbahs)\b/i],
    sourceWeights: { wikipedia: 8, wikivoyage: 20, destinations: 16 },
  },
  {
    key: 'hot-spring-stays',
    label: 'onsen towns and hot-spring stays',
    patterns: [/\b(?:onsen|hot spring|hot springs|geothermal|thermal)\b/i],
    sourceWeights: { wikipedia: 4, wikivoyage: 20, destinations: 12 },
  },
  {
    key: 'mountain-routes',
    label: 'mountain routes and alpine scenery',
    patterns: [/\b(?:mountain|mountains|alpine|hiking|trail|trails|forest|volcanic|volcano|national park|geothermal|fjord|glacier)\b/i],
    sourceWeights: { wikipedia: 10, wikivoyage: 16, destinations: 12 },
  },
  {
    key: 'coastal-islands',
    label: 'coastal islands and ferry routes',
    patterns: [/\b(?:coast|coastal|beach|beaches|island|islands|archipelago|shore|reef|ferry)\b/i],
    sourceWeights: { wikipedia: 10, wikivoyage: 16, destinations: 12 },
  },
  {
    key: 'desert-routes',
    label: 'desert routes and kasbah stops',
    patterns: [/\b(?:desert|dune|dunes|oasis|oases|sahara)\b/i],
    sourceWeights: { wikipedia: 8, wikivoyage: 18, destinations: 14 },
  },
  {
    key: 'snow-country',
    label: 'snow-country winters and ski terrain',
    patterns: [/\b(?:ski|skiing|snow|snowfall|powder|winter sports)\b/i],
    sourceWeights: { wikipedia: 6, wikivoyage: 18, destinations: 10 },
  },
  {
    key: 'wildlife-days',
    label: 'wildlife viewing and reserve days',
    patterns: [/\b(?:wildlife|safari|penguin|whale|birdwatching|game reserve|reserve)\b/i],
    sourceWeights: { wikipedia: 8, wikivoyage: 16, destinations: 10 },
  },
  {
    key: 'carnival-festivals',
    label: 'carnival streets and festival routes',
    patterns: [/\b(?:carnival|carnaval|mardi gras|parade|parades|samba|festival|festivals|fiesta|fiestas)\b/i],
    sourceWeights: { wikipedia: 10, wikivoyage: 18, destinations: 14 },
  },
  {
    key: 'savanna-safari',
    label: 'savanna drives and safari camps',
    patterns: [/\b(?:savanna|savannah|safari|big five|big 5|game drive|game drives|bush|bushveld|kruger|serengeti|masai mara|okavango)\b/i],
    sourceWeights: { wikipedia: 10, wikivoyage: 20, destinations: 16 },
  },
  {
    key: 'river-cruises',
    label: 'river routes and waterway stops',
    patterns: [/\b(?:river cruise|river cruises|river boat|riverboat|felucca|sampan|junk boat|mekong|nile|danube|amazon|waterway|waterways|canal|canals)\b/i],
    sourceWeights: { wikipedia: 8, wikivoyage: 18, destinations: 14 },
  },
  {
    key: 'vineyard-regions',
    label: 'vineyard regions and wine-country stays',
    patterns: [/\b(?:vineyard|vineyards|winery|wineries|wine region|wine regions|wine country|wine route|wine routes|viticulture|cellar|cellars|wine estate|wine estates)\b/i],
    sourceWeights: { wikipedia: 8, wikivoyage: 18, destinations: 14 },
  },
];

const ANCHOR_THEME_BY_KEY = {
  'rail-city-hops': 'transit',
  'temple-districts': 'culture',
  'historic-gardens': 'culture',
  'archaeology-quarters': 'culture',
  'medina-souqs': 'culture',
  'food-stops': 'food',
  'hot-spring-stays': 'restorative',
  'mountain-routes': 'landscape',
  'coastal-islands': 'coastal',
  'desert-routes': 'landscape',
  'snow-country': 'seasonal',
  'wildlife-days': 'wildlife',
  'carnival-festivals': 'cultural',
  'savanna-safari': 'wildlife',
  'river-cruises': 'waterway',
  'vineyard-regions': 'food',
};

const ANCHOR_SELECTION_BONUS = {
  'hot-spring-stays': 8,
  'medina-souqs': 20,
  'desert-routes': 7,
  'wildlife-days': 7,
  'archaeology-quarters': 6,
  'rail-city-hops': 5,
  'coastal-islands': 5,
  'temple-districts': 5,
  'mountain-routes': 4,
  'snow-country': 4,
  'food-stops': 2,
  'historic-gardens': 1,
  'carnival-festivals': 6,
  'savanna-safari': 10,
  'river-cruises': 5,
  'vineyard-regions': 4,
};

const OPENING_FALLBACK_LABEL_BY_KEY = {
  'rail-city-hops': 'rail-linked city districts',
  'temple-districts': 'temple districts',
  'historic-gardens': 'historic quarters',
  'archaeology-quarters': 'archaeology-heavy quarters',
  'food-stops': 'food neighborhoods',
  'medina-souqs': 'medina lanes',
  'hot-spring-stays': 'hot-spring towns',
  'mountain-routes': 'mountain scenery',
  'coastal-islands': 'sea-facing stops',
  'desert-routes': 'desert routes',
  'snow-country': 'snow-country stops',
  'wildlife-days': 'wildlife detours',
  'carnival-festivals': 'carnival streets',
  'savanna-safari': 'safari drives',
  'river-cruises': 'river routes',
  'vineyard-regions': 'wine-country stays',
};

const OPENING_FALLBACK_PRIORITY_BY_KEY = {
  'hot-spring-stays': 10,
  'coastal-islands': 9,
  'wildlife-days': 8,
  'archaeology-quarters': 7,
  'medina-souqs': 7,
  'food-stops': 6,
  'mountain-routes': 6,
  'temple-districts': 5,
  'historic-gardens': 4,
  'desert-routes': 4,
  'snow-country': 3,
  'rail-city-hops': 2,
  'carnival-festivals': 7,
  'savanna-safari': 10,
  'river-cruises': 6,
  'vineyard-regions': 5,
};

const SOURCE_PLACE_NAME_BLOCKLIST = new Set([
  'africa',
  'asia',
  'australia',
  'autumn',
  'atlantic',
  'arctic',
  'antarctic',
  'bathing',
  'blossom',
  'central america',
  'cherry',
  'cherry blossom season',
  'english',
  'europe',
  'european',
  'east asia',
  'gulf stream',
  'history',
  'its',
  'late autumn',
  'many',
  'middle east',
  'most',
  'north africa',
  'north america',
  'oceania',
  'often',
  'pacific',
  'people',
  'public',
  'rice',
  'seafood',
  'some',
  'south america',
  'southeast asia',
  'spring',
  'summer',
  'soybean',
  'soybeans',
  'train',
  'trains',
  'travel',
  'transport',
  'traveler',
  'travelers',
  'traveller',
  'travellers',
  'tourist',
  'tourists',
  'visitor',
  'visitors',
  'trips',
  'wikivoyage',
  'wikipedia',
  'winter',
  'japanese',
]);

const SOURCE_PLACE_INTERNAL_PLACE_WORD_PATTERN = /\b(?:mount|mt|lake|bay|gulf|island|islands|coast|coastal|beach|beaches|peninsula|valley|prefecture|province|district|ward|city|cities|sea|alps|mountains?|highlands?|river|rivers|port|ports|harbor|harbour|waterfront)\b/i;
const SOURCE_PLACE_CLAUSE_SUFFIX_PATTERN = /^(?:area|region|island|islands|coast|coastline|beach|beaches|peninsula|bay|gulf|mountains?|alps|highlands?|valley|prefecture|province|district|ward|center|core|capital|port|ports|harbor|harbour|waterfront)\b/i;
const SOURCE_PLACE_WEAK_CONTEXT_PATTERN = /\b(?:called|known(?:\s+as)?|nicknamed|dubbed|titled|termed|labeled|labelled|styled)\b/i;
const WEAK_OPENING_FALLBACK_LABEL_PATTERNS = [
  /\bsea-facing\s+(?:stops|stays)\b/i,
  /\bcoastal detours\b/i,
];
const STRONG_SPARSE_COASTAL_SUPPORT_PATTERN = /\b(?:ferry|ferries|beach|beaches|reef|lagoon|seaside|island[-\s]hopping|coastal towns?)\b/i;
const WEAK_SPARSE_COASTAL_SUPPORT_PATTERN = /\b(?:coast|coastline|coastlines|sea|island|islands|archipelago)\b/i;
const WEAK_SPARSE_COASTAL_CONTEXT_PATTERN = /\b(?:not really known for|beyond the main heritage circuit|span multiple regions|multiple regions|long coastlines?)\b/i;
const SOURCE_SPRING_AUTUMN_PATTERN = /\b(?:aim|aiming|plan|planning|travel|visit|go|better off)\b[^.]{0,80}\b(?:spring)\s+(?:or|and)\s+(?:autumn|fall)\b/i;
const SOURCE_SPRING_BEST_PATTERN = /\bspring\b[^.]{0,80}\b(?:best|excellent|ideal|pleasant|comfortable|reliable)\b/i;
const SOURCE_AUTUMN_BEST_PATTERN = /\b(?:autumn|fall)\b[^.]{0,80}\b(?:best|excellent|ideal|pleasant|comfortable|reliable)\b/i;
const SOURCE_SPRING_AUTUMN_WINDOW = [3, 4, 5, 9, 10, 11];
const SOURCE_PLACE_HISTORICAL_CONTEXT_PATTERN = /\b(?:upper paleolithic|paleolithic|shogunate|emperor|daimyo|samurai|occupation|world war|axis power|tokugawa|kamakura|ashikaga|meiji|lost decades)\b/i;

const TRIP_STYLE_PRIORITY_BY_IDENTITY = {
  'rail-linked-culture-route': ['culture-first-itineraries', 'food-led-city-breaks', 'first-multi-stop-routes'],
  'food-and-culture-route': ['food-led-city-breaks', 'culture-first-itineraries', 'first-multi-stop-routes'],
  'drive-first-landscape-route': ['self-drive-routes', 'outdoor-heavy-routes', 'first-multi-stop-routes'],
  'landscape-led-outdoor-route': ['outdoor-heavy-routes', 'self-drive-routes', 'first-multi-stop-routes'],
  'coastal-island-hopping-route': ['outdoor-heavy-routes', 'culture-first-itineraries', 'food-led-city-breaks', 'first-multi-stop-routes'],
  'wildlife-and-landscape-route': ['outdoor-heavy-routes', 'self-drive-routes', 'first-multi-stop-routes'],
  'market-and-old-quarter-route': ['culture-first-itineraries', 'food-led-city-breaks', 'first-multi-stop-routes'],
  'slow-culture-route': ['culture-first-itineraries', 'slower-restorative-stays', 'food-led-city-breaks'],
};

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function normalizeForComparison(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtmlEntities(value) {
  const htmlEntities = {
    amp: '&',
    quot: '"',
    apos: "'",
    lt: '<',
    gt: '>',
    nbsp: ' ',
    '#39': "'",
  };

  return String(value ?? '').replace(/&([a-z0-9#]+);/gi, (match, entity) => htmlEntities[entity] ?? match);
}

function cleanExtractedText(value) {
  return decodeHtmlEntities(
    String(value ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\[[^\]]+\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function stripWikimediaSummaryNoise(value) {
  return String(value ?? '')
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

function trimToSentenceBoundary(value, maxLength) {
  const normalizedValue = String(value ?? '').trim();

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

function humanizeList(values) {
  const normalizedValues = [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];

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

function uniquePhrases(values) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];
}

function monthNumberToName(monthNumber) {
  return MONTH_NAMES[monthNumber - 1] ?? `Month ${monthNumber}`;
}

function normalizeMonthNumbers(values) {
  return [...new Set(
    toArray(values)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 12),
  )].sort((left, right) => left - right);
}

function areConsecutiveMonths(currentMonth, nextMonth) {
  return nextMonth === currentMonth + 1 || (currentMonth === 12 && nextMonth === 1);
}

function orderMonthNumbersForDisplay(values) {
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

function formatMonthRange(monthNumbers) {
  const orderedMonthNumbers = orderMonthNumbersForDisplay(monthNumbers);

  if (orderedMonthNumbers.length === 0) {
    return 'the strongest travel window';
  }

  const ranges = [];
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

function matchesAnyPattern(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

function normalizeIdentityPhrase(value) {
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

function toPossessive(value) {
  return /s$/i.test(value) ? `${value}'` : `${value}'s`;
}

function withDefiniteArticle(value) {
  if (!value) {
    return value;
  }

  return /^the\s+/i.test(value) ? value : `the ${value}`;
}

function withIndefiniteArticle(value) {
  if (!value) {
    return value;
  }

  return /^[aeiou]/i.test(value) ? `an ${value}` : `a ${value}`;
}

function capitalizeFirstLetter(value) {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function findFirstMatchingFragment(fragments, patterns) {
  for (const fragment of fragments) {
    if (matchesAnyPattern(fragment, patterns)) {
      return trimToSentenceBoundary(fragment, 140);
    }
  }

  return trimToSentenceBoundary(fragments[0] ?? '', 140);
}

function includesAnyNormalizedFragment(values, fragments) {
  return values.some((value) => fragments.some((fragment) => value.includes(fragment)));
}

function deriveCountryContextSignals(destinations) {
  const normalizedTags = uniquePhrases(
    destinations.flatMap((destination) =>
      toArray(destination.travel_tags)
        .map((tag) => normalizeForComparison(tag))
        .filter(Boolean)
    ),
  );
  const contextCorpus = normalizeForComparison(
    destinations
      .map((destination) =>
        [destination.name, destination.summary, ...toArray(destination.travel_tags)]
          .filter(Boolean)
          .join(' ')
      )
      .join(' '),
  );
  const hasTagCue = (fragments) => includesAnyNormalizedFragment(normalizedTags, fragments);
  const hasCorpusCue = (pattern) => pattern.test(contextCorpus);

  const hasCityCue = hasTagCue(['city break', 'walkable']) || hasCorpusCue(/\bcity|urban|capital|neighborhood|street\b/);
  const hasTempleCue = hasTagCue(['temple']) || hasCorpusCue(/\btemple|shrines?|pagoda|monastery\b/);
  const hasCultureCue =
    hasTempleCue
    || hasTagCue(['history', 'historic', 'garden', 'museum', 'design'])
    || hasCorpusCue(/\bhistoric|heritage|palace|castle|garden|museum|traditional|cultural|old town|ruins\b/);
  const hasMountainCue =
    hasTagCue(['mountain', 'hiking', 'nature', 'outdoor day'])
    || hasCorpusCue(/\bmountain|alpine|volcanic|forest|national park|fjord|glacier|landscape|desert\b/);
  const hasCoastCue = hasTagCue(['coast', 'beach']) || hasCorpusCue(/\bcoast|coastal|beach|island|archipelago|shore|bay|reef|ferry\b/);
  const hasFoodCue = hasTagCue(['food', 'wine']) || hasCorpusCue(/\bfood|cuisine|culinary|market|wine|street food|seafood\b/);
  const hasRoadCue =
    hasTagCue(['road trip', 'scenic drive'])
    || hasCorpusCue(/\broad trip|road trips|scenic drive|scenic drives|self drive|self-drive|ring road\b/);
  const hasRailCue = hasTagCue(['rail']) || hasCorpusCue(/\brail|railway|train|trains|shinkansen|bullet train\b/);
  const hasSeasonCue =
    hasTagCue(['long daylight', 'northern lights'])
    || hasCorpusCue(/\bseasonal|spring blossom|cherry blossom|blossom|autumn leaves|fall foliage|foliage|snow|northern lights|midnight sun|monsoon|dry season|wet season\b/);

  const isArchipelago = hasTagCue(['island hopping']) || hasCorpusCue(/\b(?:island country|archipelago|island nation|island-hopping)\b/i);

  const highlights = uniquePhrases([
    hasCityCue ? 'major cities' : null,
    hasTempleCue ? 'historic temples' : null,
    !hasTempleCue && hasCultureCue ? 'cultural landmarks' : null,
    hasMountainCue ? 'mountain landscapes' : null,
    !hasMountainCue && hasRoadCue ? 'scenic landscapes' : null,
    hasCoastCue ? 'coastal scenery' : null,
    hasFoodCue ? 'regional food culture' : null,
    hasRailCue ? 'rail travel' : null,
    hasSeasonCue ? 'strong seasonal contrasts' : null,
  ]).slice(0, 5);

  const tripStyles = uniquePhrases([
    hasCultureCue ? 'culture-led trips' : null,
    hasFoodCue ? 'food-focused travel' : null,
    hasRailCue ? 'rail travel' : null,
    hasCityCue ? 'city breaks' : null,
    hasMountainCue ? 'scenic outdoor routes' : null,
    hasCoastCue ? 'coastal trips' : null,
    hasRoadCue ? 'scenic road trips' : null,
    hasTagCue(['hot spring']) ? 'slower restorative stays' : null,
    hasSeasonCue ? 'timing-sensitive itineraries' : null,
  ]).slice(0, 5);

  let planningFocus = null;

  if (hasCultureCue && hasFoodCue) {
    planningFocus = 'culture-heavy and food-focused itineraries';
  } else if (hasMountainCue && hasCoastCue) {
    planningFocus = 'scenic and outdoor-heavy routes';
  } else if (hasCityCue || hasCultureCue) {
    planningFocus = 'sightseeing-led itineraries';
  } else if (hasRoadCue) {
    planningFocus = 'scenic road trips';
  } else if (hasMountainCue) {
    planningFocus = 'outdoor-led routes';
  } else if (hasFoodCue) {
    planningFocus = 'food-led itineraries';
  }

  return {
    highlights,
    tripStyles,
    planningFocus,
  };
}

function extractCountryBaseIdentity(country, wikipediaContext) {
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

function buildCountrySourceSignalContexts(wikipediaContext, wikivoyageContext, contextDestinations) {
  const destinationFragments = contextDestinations.flatMap((destination) =>
    [destination.name, destination.summary, ...toArray(destination.travel_tags)].filter(Boolean)
  );
  const climateFragments = contextDestinations
    .map((destination) => {
      const bestWindowLabel = formatMonthRange(destination.best_months);

      if (bestWindowLabel === 'the strongest travel window') {
        return null;
      }

      return `${destination.name} best months ${bestWindowLabel}`;
    })
    .filter(Boolean);

  return [
    {
      source: 'wikipedia',
      text: wikipediaContext.cleanedText,
      fragments: uniquePhrases(
        [wikipediaContext.description, wikipediaContext.leadParagraph, ...toArray(wikipediaContext.supportingParagraphs)]
          .filter(Boolean),
      ),
    },
    {
      source: 'wikivoyage',
      text: wikivoyageContext.cleanedText,
      fragments: uniquePhrases(
        [wikivoyageContext.description, wikivoyageContext.leadParagraph, ...toArray(wikivoyageContext.supportingParagraphs)]
          .filter(Boolean),
      ),
    },
    {
      source: 'destinations',
      text: normalizeForComparison(destinationFragments.join(' ')),
      fragments: uniquePhrases(destinationFragments),
    },
    {
      source: 'climate',
      text: normalizeForComparison(climateFragments.join(' ')),
      fragments: climateFragments,
    },
  ];
}

function shouldUseDestinationSpecificAnchorLabel(ruleKey) {
  return !['temple-districts', 'historic-gardens'].includes(ruleKey);
}

function buildCountryAnchorSignal(rule, sourceContexts, destinations) {
  let weight = 0;
  let primarySource = 'wikipedia';
  let primarySourceWeight = 0;
  const evidenceFragments = [];
  let label = rule.label;

  for (const sourceContext of sourceContexts) {
    const sourceWeight = rule.sourceWeights[sourceContext.source] ?? 0;

    if (sourceWeight <= 0 || !sourceContext.text) {
      continue;
    }

    const matched = rule.requireAllPatterns
      ? rule.patterns.every((pattern) => pattern.test(sourceContext.text))
      : matchesAnyPattern(sourceContext.text, rule.patterns);

    if (!matched) {
      continue;
    }

    weight += sourceWeight;

    if (sourceWeight > primarySourceWeight) {
      primarySource = sourceContext.source;
      primarySourceWeight = sourceWeight;
    }

    const evidence = findFirstMatchingFragment(sourceContext.fragments, rule.patterns);

    if (evidence) {
      evidenceFragments.push(evidence);
    }
  }

  const matchingDestination = destinations.find((destination) => {
    const destinationText = [destination.name, destination.summary, ...toArray(destination.travel_tags)]
      .filter(Boolean)
      .join(' ');

    return rule.requireAllPatterns
      ? rule.patterns.every((pattern) => pattern.test(destinationText))
      : matchesAnyPattern(destinationText, rule.patterns);
  });

  if (matchingDestination) {
    evidenceFragments.unshift(matchingDestination.name);

    if (rule.destinationLabelBuilder && shouldUseDestinationSpecificAnchorLabel(rule.key)) {
      label = rule.destinationLabelBuilder(matchingDestination.name);
      weight += 6;
    }
  }

  if (weight <= 0) {
    return null;
  }

  return {
    key: rule.key,
    label,
    category: 'anchor',
    source: primarySource,
    evidence: humanizeList(uniquePhrases(evidenceFragments).slice(0, 2)),
    weight,
  };
}

function buildCountryAnchorSignals(sourceContexts, contextDestinations, contextSignals) {
  const anchorSignals = COUNTRY_SUMMARY_ANCHOR_RULES
    .map((rule) => buildCountryAnchorSignal(rule, sourceContexts, contextDestinations))
    .filter(Boolean);
  const filteredAnchorSignals = filterWeakSparseAnchorSignals(anchorSignals, sourceContexts, contextDestinations);

  const fallbackAnchorLabels = {
    'major cities': 'big-city districts',
    'historic temples': 'temple districts',
    'cultural landmarks': 'historic quarters',
    'mountain landscapes': 'mountain routes',
    'scenic landscapes': 'scenic landscape drives',
    'coastal scenery': 'coastal stretches',
    'regional food culture': 'regional food stops',
    'rail travel': 'rail-linked city hops',
    'strong seasonal contrasts': 'timing-sensitive routes',
  };

  for (const highlight of contextSignals.highlights) {
    if (filteredAnchorSignals.length >= 4) {
      break;
    }

    const label = fallbackAnchorLabels[highlight];

    if (!label || filteredAnchorSignals.some((signal) => signal.label === label)) {
      continue;
    }

    filteredAnchorSignals.push({
      key: normalizeForComparison(label).replace(/\s+/g, '-'),
      label,
      category: 'anchor',
      source: 'destinations',
      evidence: highlight,
      weight: 8,
    });
  }

  return filteredAnchorSignals
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 6);
}

function buildCountryTripStyleSignals(anchors, contextSignals, publishedDestinationCount) {
  const anchorKeySet = new Set(anchors.map((anchor) => anchor.key));
  const tripStyleSignals = [];

  const addTripStyleSignal = (key, label, condition, source, evidence, weight) => {
    if (!condition || tripStyleSignals.some((signal) => signal.key === key)) {
      return;
    }

    tripStyleSignals.push({
      key,
      label,
      category: 'trip_style',
      source,
      evidence,
      weight,
    });
  };

  addTripStyleSignal(
    'culture-first-itineraries',
    'culture-first itineraries',
    anchorKeySet.has('temple-districts') || anchorKeySet.has('historic-gardens') || anchorKeySet.has('archaeology-quarters') || anchorKeySet.has('medina-souqs'),
    anchors.find((anchor) => ['temple-districts', 'historic-gardens', 'archaeology-quarters', 'medina-souqs'].includes(anchor.key))?.source ?? 'destinations',
    humanizeList(anchors.filter((anchor) => ['temple-districts', 'historic-gardens', 'archaeology-quarters', 'medina-souqs'].includes(anchor.key)).map((anchor) => anchor.label)),
    22,
  );
  addTripStyleSignal(
    'food-led-city-breaks',
    'food-led city breaks',
    anchorKeySet.has('food-stops') && (anchorKeySet.has('rail-city-hops') || contextSignals.highlights.includes('major cities')),
    anchors.find((anchor) => anchor.key === 'food-stops')?.source ?? 'destinations',
    anchors.find((anchor) => anchor.key === 'food-stops')?.label ?? 'food cues',
    18,
  );
  addTripStyleSignal(
    'first-multi-stop-routes',
    'first multi-stop routes',
    anchorKeySet.has('rail-city-hops') || publishedDestinationCount >= 2,
    anchors.find((anchor) => anchor.key === 'rail-city-hops')?.source ?? 'destinations',
    anchorKeySet.has('rail-city-hops') ? 'rail-linked city hops' : `${publishedDestinationCount} published destinations`,
    18,
  );
  addTripStyleSignal(
    'outdoor-heavy-routes',
    'outdoor-heavy routes',
    anchorKeySet.has('mountain-routes') || anchorKeySet.has('coastal-islands') || anchorKeySet.has('wildlife-days') || anchorKeySet.has('desert-routes') || anchorKeySet.has('savanna-safari'),
    anchors.find((anchor) =>
      ['mountain-routes', 'coastal-islands', 'wildlife-days', 'desert-routes', 'savanna-safari'].includes(anchor.key)
    )?.source ?? 'destinations',
    humanizeList(
      anchors
        .filter((anchor) => ['mountain-routes', 'coastal-islands', 'wildlife-days', 'desert-routes', 'savanna-safari'].includes(anchor.key))
        .map((anchor) => anchor.label),
    ),
    18,
  );
  addTripStyleSignal(
    'self-drive-routes',
    'self-drive routes',
    contextSignals.tripStyles.includes('scenic road trips'),
    'destinations',
    'road-trip cues from destination context',
    14,
  );
  addTripStyleSignal(
    'slower-restorative-stays',
    'slower restorative stays',
    anchorKeySet.has('hot-spring-stays'),
    anchors.find((anchor) => anchor.key === 'hot-spring-stays')?.source ?? 'destinations',
    anchors.find((anchor) => anchor.key === 'hot-spring-stays')?.label ?? 'restorative stays',
    14,
  );

  const fallbackTripStyleLabels = {
    'culture-led trips': 'culture-first itineraries',
    'food-focused travel': 'food-led city breaks',
    'rail travel': 'first multi-stop routes',
    'city breaks': 'city-led breaks',
    'scenic outdoor routes': 'outdoor-heavy routes',
    'coastal trips': 'sea-led itineraries',
    'scenic road trips': 'self-drive routes',
    'slower restorative stays': 'slower restorative stays',
    'timing-sensitive itineraries': 'timing-sensitive itineraries',
  };

  for (const tripStyle of contextSignals.tripStyles) {
    if (tripStyleSignals.length >= 3) {
      break;
    }

    const mappedLabel = fallbackTripStyleLabels[tripStyle];

    if (!mappedLabel || tripStyleSignals.some((signal) => signal.label === mappedLabel)) {
      continue;
    }

    tripStyleSignals.push({
      key: normalizeForComparison(mappedLabel).replace(/\s+/g, '-'),
      label: mappedLabel,
      category: 'trip_style',
      source: 'destinations',
      evidence: tripStyle,
      weight: 10,
    });
  }

  return tripStyleSignals
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 3);
}

function scoreAnchorForSelection(anchor) {
  return anchor.weight + (ANCHOR_SELECTION_BONUS[anchor.key] ?? 0);
}

function selectAnchorsForSummary(anchors, count) {
  const sortedAnchors = [...anchors].sort((left, right) =>
    scoreAnchorForSelection(right) - scoreAnchorForSelection(left) || right.weight - left.weight
  );
  const selected = [];
  const selectedThemes = new Set();

  for (const anchor of sortedAnchors) {
    const theme = ANCHOR_THEME_BY_KEY[anchor.key] ?? anchor.key;

    if (selectedThemes.has(theme)) {
      continue;
    }

    selected.push(anchor);
    selectedThemes.add(theme);

    if (selected.length >= count) {
      return selected;
    }
  }

  for (const anchor of sortedAnchors) {
    if (selected.some((selectedAnchor) => selectedAnchor.key === anchor.key)) {
      continue;
    }

    selected.push(anchor);

    if (selected.length >= count) {
      break;
    }
  }

  return selected;
}

function selectTripStylesForSummary(tripStyles, travelIdentityKey, count) {
  const preferredOrder = TRIP_STYLE_PRIORITY_BY_IDENTITY[travelIdentityKey] ?? [];
  const priorityByKey = new Map(preferredOrder.map((key, index) => [key, index]));

  return [...tripStyles]
    .sort((left, right) => {
      const leftPriority = priorityByKey.get(left.key) ?? Number.MAX_SAFE_INTEGER;
      const rightPriority = priorityByKey.get(right.key) ?? Number.MAX_SAFE_INTEGER;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return right.weight - left.weight;
    })
    .slice(0, count);
}

function buildCountryTravelIdentitySignal(anchors, contextSignals) {
  const anchorKeySet = new Set(anchors.map((anchor) => anchor.key));
  const evidence = humanizeList(anchors.slice(0, 2).map((anchor) => anchor.label));

  if (anchorKeySet.has('rail-city-hops') && (anchorKeySet.has('temple-districts') || anchorKeySet.has('historic-gardens') || anchorKeySet.has('archaeology-quarters'))) {
    return {
      key: 'rail-linked-culture-route',
      label: 'rail-linked culture route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'rail-city-hops')?.source ?? 'destinations',
      evidence,
      weight: 28,
    };
  }

  if (anchorKeySet.has('food-stops') && (anchorKeySet.has('rail-city-hops') || anchorKeySet.has('historic-gardens') || anchorKeySet.has('medina-souqs'))) {
    return {
      key: 'food-and-culture-route',
      label: 'city-to-city food and culture route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'food-stops')?.source ?? 'destinations',
      evidence,
      weight: 24,
    };
  }

  if (anchorKeySet.has('medina-souqs')) {
    return {
      key: 'market-and-old-quarter-route',
      label: 'market-and-old-quarter route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'medina-souqs')?.source ?? 'destinations',
      evidence,
      weight: 18,
    };
  }

  if (
    (anchorKeySet.has('mountain-routes') || anchorKeySet.has('desert-routes'))
    && (
      contextSignals.tripStyles.includes('scenic road trips')
      || anchorKeySet.has('wildlife-days')
      || anchorKeySet.has('desert-routes')
    )
  ) {
    return {
      key: 'drive-first-landscape-route',
      label: 'drive-first landscape route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'mountain-routes' || anchor.key === 'desert-routes')?.source ?? 'destinations',
      evidence,
      weight: 24,
    };
  }

  if (anchorKeySet.has('coastal-islands')) {
    return {
      key: 'coastal-island-hopping-route',
      label: 'coastal island-hopping route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'coastal-islands')?.source ?? 'destinations',
      evidence,
      weight: 22,
    };
  }

  if (anchorKeySet.has('savanna-safari')) {
    return {
      key: 'safari-and-landscape-route',
      label: 'safari-and-landscape route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'savanna-safari')?.source ?? 'destinations',
      evidence,
      weight: 24,
    };
  }

  if (anchorKeySet.has('wildlife-days')) {
    return {
      key: 'wildlife-and-landscape-route',
      label: 'wildlife-and-landscape route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'wildlife-days')?.source ?? 'destinations',
      evidence,
      weight: 20,
    };
  }

  if (anchorKeySet.has('hot-spring-stays') && (anchorKeySet.has('temple-districts') || anchorKeySet.has('historic-gardens'))) {
    return {
      key: 'slow-culture-route',
      label: 'slow culture route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'hot-spring-stays')?.source ?? 'destinations',
      evidence,
      weight: 20,
    };
  }

  if (anchorKeySet.has('carnival-festivals')) {
    return {
      key: 'festival-and-street-culture-route',
      label: 'festival-and-street-culture route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'carnival-festivals')?.source ?? 'destinations',
      evidence,
      weight: 18,
    };
  }

  if (anchorKeySet.has('river-cruises')) {
    return {
      key: 'river-and-waterway-route',
      label: 'river-and-waterway route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'river-cruises')?.source ?? 'destinations',
      evidence,
      weight: 18,
    };
  }

  if (anchorKeySet.has('vineyard-regions') && (anchorKeySet.has('food-stops') || anchorKeySet.has('historic-gardens'))) {
    return {
      key: 'wine-and-food-route',
      label: 'wine-and-food route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'vineyard-regions')?.source ?? 'destinations',
      evidence,
      weight: 20,
    };
  }

  if (anchorKeySet.has('mountain-routes') || anchorKeySet.has('desert-routes')) {
    return {
      key: 'landscape-led-outdoor-route',
      label: 'landscape-led outdoor route',
      category: 'identity',
      source: anchors.find((anchor) => anchor.key === 'mountain-routes' || anchor.key === 'desert-routes')?.source ?? 'destinations',
      evidence,
      weight: 18,
    };
  }

  return {
    key: 'country-scale-multi-stop-route',
    label: 'country-scale multi-stop route',
    category: 'identity',
    source: anchors[0]?.source ?? 'destinations',
    evidence: evidence || humanizeList(contextSignals.highlights.slice(0, 2)),
    weight: 14,
  };
}

function selectPlanningMonthsForSummary(destinations) {
  const destinationsWithWindows = destinations
    .map((destination) => ({
      monthNumbers: normalizeMonthNumbers(destination.best_months),
    }))
    .filter((destination) => destination.monthNumbers.length > 0);
  const monthCounts = new Map();

  for (const destination of destinationsWithWindows) {
    for (const monthNumber of destination.monthNumbers) {
      monthCounts.set(monthNumber, (monthCounts.get(monthNumber) ?? 0) + 1);
    }
  }

  if (monthCounts.size === 0) {
    return [];
  }

  const allMonths = [...monthCounts.keys()].sort((left, right) => left - right);

  if (destinationsWithWindows.length === 1) {
    return allMonths;
  }

  const majorityThreshold = Math.max(2, Math.ceil(destinationsWithWindows.length / 2));
  const majorityMonths = allMonths.filter((monthNumber) => (monthCounts.get(monthNumber) ?? 0) >= majorityThreshold);

  if (majorityMonths.length > 0) {
    return majorityMonths;
  }

  const maxCount = Math.max(...monthCounts.values());
  const topMonths = allMonths.filter((monthNumber) => (monthCounts.get(monthNumber) ?? 0) === maxCount);

  return topMonths.length <= 4 ? topMonths : [];
}

function describePlanningMonthsForSummary(monthNumbers) {
  const normalizedMonths = normalizeMonthNumbers(monthNumbers);

  if (normalizedMonths.length === 0) {
    return null;
  }

  const seasonLabels = uniquePhrases([
    normalizedMonths.some((monthNumber) => [3, 4, 5].includes(monthNumber)) ? 'spring' : null,
    normalizedMonths.some((monthNumber) => [6, 7, 8].includes(monthNumber)) ? 'summer' : null,
    normalizedMonths.some((monthNumber) => [9, 10, 11].includes(monthNumber))
      ? normalizedMonths.every((monthNumber) => [10, 11].includes(monthNumber)) ? 'late autumn' : 'autumn'
      : null,
    normalizedMonths.some((monthNumber) => [12, 1, 2].includes(monthNumber)) ? 'winter' : null,
  ]);

  if (normalizedMonths.length >= 2 && seasonLabels.length >= 1 && seasonLabels.length <= 2) {
    return humanizeList(seasonLabels);
  }

  return formatMonthRange(normalizedMonths);
}

function extractSourcePlanningGuidance(sourceContexts) {
  const sourceFragments = sourceContexts
    .filter((context) => context.source === 'wikipedia' || context.source === 'wikivoyage')
    .flatMap((context) =>
      toArray(context.fragments)
        .filter(Boolean)
        .map((fragment) => ({
          source: context.source,
          text: fragment,
        }))
    );
  const directSpringAutumnFragment = sourceFragments.find((fragment) => SOURCE_SPRING_AUTUMN_PATTERN.test(fragment.text));

  if (directSpringAutumnFragment) {
    const evidence = trimToSentenceBoundary(directSpringAutumnFragment.text, 140);

    return {
      monthNumbers: SOURCE_SPRING_AUTUMN_WINDOW,
      planningLabel: 'spring and autumn',
      reason: evidence,
      source: directSpringAutumnFragment.source,
      evidence,
    };
  }

  const springBestFragment = sourceFragments.find((fragment) => SOURCE_SPRING_BEST_PATTERN.test(fragment.text));
  const autumnBestFragment = sourceFragments.find((fragment) => SOURCE_AUTUMN_BEST_PATTERN.test(fragment.text));

  if (springBestFragment && autumnBestFragment) {
    const evidence = humanizeList([
      trimToSentenceBoundary(springBestFragment.text, 120),
      trimToSentenceBoundary(autumnBestFragment.text, 120),
    ]);

    return {
      monthNumbers: SOURCE_SPRING_AUTUMN_WINDOW,
      planningLabel: 'spring and autumn',
      reason: evidence,
      source: springBestFragment.source === 'wikivoyage' || autumnBestFragment.source === 'wikivoyage'
        ? 'wikivoyage'
        : springBestFragment.source,
      evidence,
    };
  }

  return null;
}

function buildCountrySeasonality(contextDestinations, sourceContexts) {
  const destinationsWithWindows = contextDestinations
    .map((destination) => ({
      name: destination.name,
      monthNumbers: normalizeMonthNumbers(destination.best_months),
      windowLabel: formatMonthRange(destination.best_months),
    }))
    .filter((destination) => destination.monthNumbers.length > 0);
  const climatePlanningMonths = selectPlanningMonthsForSummary(contextDestinations);
  const climatePlanningLabel = describePlanningMonthsForSummary(climatePlanningMonths);
  const sourceGuidance = extractSourcePlanningGuidance(sourceContexts);
  const shouldPreferSourceGuidance = Boolean(
    sourceGuidance
      && (
        destinationsWithWindows.length <= 1
        || climatePlanningMonths.length <= 2
        || (climatePlanningLabel && climatePlanningLabel !== sourceGuidance.planningLabel)
      )
  );
  const planningMonths = shouldPreferSourceGuidance ? sourceGuidance.monthNumbers : climatePlanningMonths;
  const planningLabel = shouldPreferSourceGuidance
    ? sourceGuidance.planningLabel
    : climatePlanningLabel;
  const sourceCorpus = sourceContexts
    .filter((context) => context.source === 'wikipedia' || context.source === 'wikivoyage')
    .map((context) => context.text)
    .join(' ');
  const hasSeasonCue = /\b(?:blossom|cherry blossom|foliage|autumn leaves|snow|snowfall|ski|northern lights|midnight sun|monsoon|dry season|wet season)\b/i
    .test(sourceCorpus);

  if (!planningLabel) {
    return {
      include: false,
      summaryText: null,
      planningLabel: null,
      reason: null,
      signals: [],
    };
  }

  const include = shouldPreferSourceGuidance || hasSeasonCue || destinationsWithWindows.length === 1 || planningMonths.length <= 4;

  if (!include) {
    return {
      include: false,
      summaryText: null,
      planningLabel,
      reason: null,
      signals: [],
    };
  }

  const primaryDestination = shouldPreferSourceGuidance
    ? null
    : destinationsWithWindows.length === 1
    ? destinationsWithWindows[0]
    : destinationsWithWindows.find((destination) =>
      destination.monthNumbers.some((monthNumber) => planningMonths.includes(monthNumber))
    ) ?? null;
  const isPluralPlanningLabel = /,| and /.test(planningLabel);
  const summaryText = primaryDestination
    ? `${capitalizeFirstLetter(planningLabel)} ${isPluralPlanningLabel ? 'matter' : 'matters'} most if ${primaryDestination.name} is part of the plan.`
    : `${capitalizeFirstLetter(planningLabel)} ${isPluralPlanningLabel ? 'are' : 'is'} the cleanest planning window across the current curated route set.`;

  return {
    include: true,
    summaryText,
    planningLabel,
    primaryDestinationName: primaryDestination?.name ?? null,
    reason: shouldPreferSourceGuidance
      ? sourceGuidance.reason
      : primaryDestination
        ? `${primaryDestination.name}: ${primaryDestination.windowLabel}`
        : `majority window: ${formatMonthRange(planningMonths)}`,
    reasonSource: shouldPreferSourceGuidance ? sourceGuidance.source : 'climate',
    signals: [
      {
        key: 'country-planning-window',
        label: planningLabel,
        category: 'seasonality',
        source: shouldPreferSourceGuidance ? sourceGuidance.source : 'climate',
        evidence: shouldPreferSourceGuidance
          ? sourceGuidance.evidence
          : primaryDestination
            ? `${primaryDestination.name}: ${primaryDestination.windowLabel}`
            : formatMonthRange(planningMonths),
        weight: shouldPreferSourceGuidance || hasSeasonCue ? 18 : 12,
      },
    ],
  };
}

function stableHash(value) {
  let hash = 0;

  for (const character of String(value ?? '')) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }

  return Math.abs(hash);
}

function chooseDeterministicOption(options, seed) {
  if (!options.length) {
    return null;
  }

  return options[stableHash(seed) % options.length];
}

function inferSourcePlaceTheme(text) {
  const normalizedText = normalizeForComparison(text);

  if (/\b(?:onsen|hot spring|hot springs|thermal|ryokan|geothermal)\b/.test(normalizedText)) {
    return 'restorative';
  }

  if (/\b(?:food|foods|market|markets|street food|culinary|nightlife|meal|meals)\b/.test(normalizedText)) {
    return 'food';
  }

  if (/\b(?:coast|coastal|beach|beaches|ferry|ferries|island|islands|archipelago|reef|lagoon|sea)\b/.test(normalizedText)) {
    return 'coastal';
  }

  if (/\b(?:mountain|mountains|alpine|volcanic|volcano|glacier|hiking|trail|wildlife|safari|park)\b/.test(normalizedText)) {
    return /\b(?:wildlife|safari)\b/.test(normalizedText) ? 'wildlife' : 'landscape';
  }

  if (/\b(?:temple|temples|shrine|shrines|historic|heritage|old quarter|old town|archaeology|ancient|medina|souq)\b/.test(normalizedText)) {
    return 'culture';
  }

  if (/\b(?:rail|train|station|district|districts|city|cities|urban|neighborhood|neighborhoods|capital|metropolis|downtown)\b/.test(normalizedText)) {
    return 'transit';
  }

  return 'general';
}

function hasStrongSourcePlaceContext(name, clause, matchIndex) {
  const normalizedName = normalizeOptionalText(name);

  if (!normalizedName) {
    return false;
  }

  if (SOURCE_PLACE_INTERNAL_PLACE_WORD_PATTERN.test(normalizedName)) {
    return true;
  }

  const escapedName = escapeRegex(normalizedName);

  if (new RegExp(`\\b(?:in|to|from|around|near|outside|across|between|along|off|toward|towards|via|through|into|within)\\s+${escapedName}\\b`, 'i').test(clause)) {
    return true;
  }

  const afterText = clause.slice(matchIndex + normalizedName.length).trimStart();

  if (
    /^is\b/i.test(afterText)
    && /\b(?:capital|city|cities|district|districts|main|financial center|modern|densely populated|big city|big-city|historic|temple|onsen|hot spring|hot-spring|mountain|island|harbor|harbour)\b/i.test(afterText)
  ) {
    return true;
  }

  if (
    /^[—-]\s*(?:the\s+)?(?:capital|city|cities|district|districts|main|financial center|modern|densely populated|historic|temple|onsen|hot spring|hot-spring|mountain|island|harbor|harbour)\b/i.test(afterText)
  ) {
    return true;
  }

  return SOURCE_PLACE_CLAUSE_SUFFIX_PATTERN.test(afterText);
}

function hasWeakSourcePlaceContext(name, clause, matchIndex) {
  const normalizedName = normalizeOptionalText(name);

  if (!normalizedName) {
    return true;
  }

  const beforeWindow = clause.slice(Math.max(0, matchIndex - 48), matchIndex);
  const afterText = clause.slice(matchIndex + normalizedName.length).trimStart();
  const normalizedCandidate = normalizeForComparison(normalizedName);

  if (SOURCE_PLACE_NAME_BLOCKLIST.has(normalizedCandidate)) {
    return true;
  }

  if (SOURCE_PLACE_WEAK_CONTEXT_PATTERN.test(beforeWindow)) {
    return true;
  }

  if (SOURCE_PLACE_HISTORICAL_CONTEXT_PATTERN.test(clause)) {
    return true;
  }

  if (matchIndex === 0 && normalizedCandidate.split(' ').length === 1) {
    if (/^[,;:]/.test(afterText)) {
      return true;
    }

    if (/^(?:called|known|nicknamed|dubbed|titled|termed|labeled|labelled|styled|used|considered|thought|regarded|meant)\b/i.test(afterText)) {
      return true;
    }
  }

  return !hasStrongSourcePlaceContext(normalizedName, clause, matchIndex);
}

function isUsableSourcePlaceName(name, clause, matchIndex, countryName, existingDestinationNames) {
  const normalizedName = normalizeForComparison(name);

  if (!normalizedName || normalizedName.length < 3) {
    return false;
  }

  if (normalizedName === normalizeForComparison(countryName)) {
    return false;
  }

  if (SOURCE_PLACE_NAME_BLOCKLIST.has(normalizedName)) {
    return false;
  }

  // Reject single-word labels unless they look like a proper-noun place
  if (normalizedName.split(' ').length === 1 && !name.includes("'s")) {
    // Basic heuristic: must be at least 4 chars and not look like a common word
    if (name.length < 4 || /^[a-z]+$/.test(name)) {
      return false;
    }
  }

  if (existingDestinationNames.has(normalizedName) || hasWeakSourcePlaceContext(name, clause, matchIndex)) {
    return false;
  }

  if (/\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(normalizedName)) {
    return false;
  }

  if (/\b(?:north|south|east|west|central)\b/.test(normalizedName) && /\b(?:america|asia|africa|europe)\b/.test(normalizedName)) {
    return false;
  }

  if (/^(?:its|the|this|that|these|those|country|cities)\b/i.test(name)) {
    return false;
  }

  return true;
}

function isUsableOpeningFallbackLabel(label) {
  return !WEAK_OPENING_FALLBACK_LABEL_PATTERNS.some((pattern) => pattern.test(label));
}

function hasStrongSparseCoastalSupport(sourceContexts, contextDestinations) {
  const destinationCorpus = normalizeForComparison(
    contextDestinations
      .flatMap((destination) => [destination.name, destination.summary, ...toArray(destination.travel_tags)])
      .filter(Boolean)
      .join(' '),
  );

  if (STRONG_SPARSE_COASTAL_SUPPORT_PATTERN.test(destinationCorpus)) {
    return true;
  }

  const sourceFragments = sourceContexts
    .filter((context) => context.source === 'wikipedia' || context.source === 'wikivoyage')
    .flatMap((context) => toArray(context.fragments));

  return sourceFragments.some((fragment) =>
    STRONG_SPARSE_COASTAL_SUPPORT_PATTERN.test(fragment)
      && !WEAK_SPARSE_COASTAL_CONTEXT_PATTERN.test(fragment)
  );
}

function filterWeakSparseAnchorSignals(anchorSignals, sourceContexts, contextDestinations) {
  if (contextDestinations.length > 1) {
    return anchorSignals;
  }

  return anchorSignals.filter((anchor) => {
    if (anchor.key !== 'coastal-islands') {
      return true;
    }

    const evidence = normalizeForComparison(anchor.evidence ?? '');
    const isWeakCoastalEvidence = WEAK_SPARSE_COASTAL_SUPPORT_PATTERN.test(evidence)
      && !STRONG_SPARSE_COASTAL_SUPPORT_PATTERN.test(evidence);

    if (!isWeakCoastalEvidence) {
      return true;
    }

    return hasStrongSparseCoastalSupport(sourceContexts, contextDestinations);
  });
}

function buildSourceProperNounAnchors(country, wikipediaContext, wikivoyageContext, contextDestinations) {
  const existingDestinationNames = new Set(
    contextDestinations
      .map((destination) => normalizeForComparison(destination.name))
      .filter(Boolean),
  );
  const sourceParagraphs = [
    {
      source: 'wikivoyage',
      paragraphs: [wikivoyageContext?.leadParagraph, ...toArray(wikivoyageContext?.supportingParagraphs)],
      sourceWeight: 16,
    },
    {
      source: 'wikipedia',
      paragraphs: [wikipediaContext?.leadParagraph, ...toArray(wikipediaContext?.supportingParagraphs)],
      sourceWeight: 10,
    },
  ];
  const candidateByName = new Map();

  for (const sourceGroup of sourceParagraphs) {
    sourceGroup.paragraphs
      .filter(Boolean)
      .forEach((paragraph, paragraphIndex) => {
        const clauses = String(paragraph)
          .split(/[.!?;:]+/)
          .map((entry) => entry.trim())
          .filter(Boolean);

        clauses.forEach((clause, clauseIndex) => {
          const matches = [...clause.matchAll(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g)];

          matches.forEach((match, matchIndex) => {
            const name = normalizeOptionalText(match[0]);
            const matchOffset = match.index ?? clause.indexOf(match[0]);

            if (!name || !isUsableSourcePlaceName(name, clause, matchOffset, country.name, existingDestinationNames)) {
              return;
            }

            const normalizedName = normalizeForComparison(name);
            const cueTheme = inferSourcePlaceTheme(clause);

            if (cueTheme === 'coastal') {
              return;
            }

            const weight = sourceGroup.sourceWeight
              + Math.max(0, 4 - paragraphIndex)
              + Math.max(0, 2 - clauseIndex)
              - matchIndex;
            const existing = candidateByName.get(normalizedName);
            const nextCandidate = {
              key: 'source-place',
              theme: cueTheme,
              weight,
              label: name,
              destinationName: name,
              cueType: `source-${sourceGroup.source}`,
              source: sourceGroup.source,
            };

            if (!existing || existing.weight < nextCandidate.weight) {
              candidateByName.set(normalizedName, nextCandidate);
            }
          });
        });
      });
  }

  return [...candidateByName.values()]
    .sort((left, right) => right.weight - left.weight || left.destinationName.localeCompare(right.destinationName))
    .slice(0, 3);
}

function getDestinationCueText(destination) {
  return normalizeForComparison(
    [destination.name, destination.summary, ...toArray(destination.travel_tags)]
      .filter(Boolean)
      .join(' '),
  );
}

function hasDestinationCue(destination, pattern) {
  return pattern.test(getDestinationCueText(destination));
}

function hasDestinationTagCue(destination, fragments) {
  const normalizedTags = uniquePhrases(
    toArray(destination.travel_tags)
      .map((tag) => normalizeForComparison(tag))
      .filter(Boolean),
  );

  return includesAnyNormalizedFragment(
    normalizedTags,
    fragments.map((fragment) => normalizeForComparison(fragment)),
  );
}

function destinationNameMatches(destination, pattern) {
  return pattern.test(normalizeForComparison(destination.name));
}

function buildDestinationNamedAnchorCandidates(destination) {
  const candidates = [];
  const addCandidate = (key, theme, weight, labels, metadata = {}) => {
    const labelBuilder = chooseDeterministicOption(labels, `${destination.slug}:${key}`);

    if (!labelBuilder) {
      return;
    }

    candidates.push({
      key,
      theme,
      weight,
      label: labelBuilder(destination.name),
      destinationName: destination.name,
      ...metadata,
    });
  };
  const hasWhaleCue = hasDestinationCue(destination, /\b(?:whale|whales|whale watching)\b/);
  const hasWildlifeCue = hasWhaleCue
    || hasDestinationCue(destination, /\b(?:wildlife|penguin|penguins|birdwatching|reserve|game reserve|safari)\b/);
  const hasGeyserCue = hasDestinationCue(destination, /\b(?:geyser|geysers)\b/);
  const hasParkLoopCue = hasDestinationCue(destination, /\b(?:national park|park loops?|park roads?)\b/);
  const hasFerryCue = hasDestinationCue(destination, /\b(?:ferry|ferries|port|ports)\b/);
  const hasCoastalCue = hasDestinationCue(destination, /\b(?:coast|coastal|beach|beaches|shore|reef|lagoon|seaside|bay|bays|ocean|waterfront)\b/);
  const hasIslandTagCue = hasDestinationTagCue(destination, ['coast', 'beach', 'island', 'ferry']);
  const destinationNameLooksCoastal = destinationNameMatches(destination, /\b(?:coast|coastal|shore|beach)\b/);

  if (hasDestinationCue(destination, /\b(?:lagoon)\b/)) {
    addCandidate('coastal-islands', 'coastal', 26, [
      (name) => `${toPossessive(name)} lagoon detours`,
      (name) => `${toPossessive(name)} lagoon-side wanderings`,
    ], { cueType: 'lagoon' });
  }

  if (hasDestinationCue(destination, /\b(?:glacier|glaciers|waterfall|waterfalls)\b/)) {
    addCandidate('mountain-routes', 'landscape', 26, [
      (name) => `${toPossessive(name)} glacier-and-waterfall drives`,
      (name) => `${toPossessive(name)} waterfall and glacier loop`,
    ], { cueType: 'glacier-waterfall' });
  }

  if (hasWhaleCue) {
    addCandidate('wildlife-days', 'wildlife', 30, [
      (name) => `whale-watching off ${name}`,
      (name) => `${toPossessive(name)} whale-watching waters`,
    ], { cueType: 'whale' });
  } else if (hasWildlifeCue) {
    addCandidate('wildlife-days', 'wildlife', 28, hasGeyserCue
      ? [
        (name) => `${toPossessive(name)} wildlife-and-geyser loops`,
        (name) => `${toPossessive(name)} park-and-wildlife loops`,
      ]
      : hasParkLoopCue
        ? [
          (name) => `${toPossessive(name)} park-and-wildlife loops`,
          (name) => `${toPossessive(name)} wildlife loops`,
        ]
      : [
        (name) => `${toPossessive(name)} wildlife loops`,
        (name) => `wildlife days around ${name}`,
      ], { cueType: hasGeyserCue ? 'wildlife-geyser' : hasParkLoopCue ? 'wildlife-park' : 'wildlife' });
  }

  if (hasDestinationCue(destination, /\b(?:geothermal)\b/)) {
    addCandidate('hot-spring-stays', 'restorative', 24, [
      (name) => `${name} as a geothermal base`,
      (name) => `geothermal stops around ${name}`,
    ], { cueType: 'geothermal' });
  }

  if (hasDestinationCue(destination, /\b(?:temple|shrines?|pagoda|monastery)\b/)) {
    addCandidate('temple-districts', 'culture', 24, [
      (name) => `${toPossessive(name)} temple districts`,
      (name) => `${toPossessive(name)} shrine-and-temple quarters`,
    ], { cueType: 'temples' });
  }

  if (hasDestinationCue(destination, /\b(?:medina|souq|souqs|riad|kasbah)\b/)) {
    addCandidate('medina-souqs', 'culture', 24, [
      (name) => `${toPossessive(name)} medina lanes`,
      (name) => `${toPossessive(name)} souq quarters`,
    ], { cueType: 'medina-souq' });
  }

  if (hasDestinationCue(destination, /\b(?:archaeology|archaeological|acropolis|ruins|ancient)\b/)) {
    addCandidate('archaeology-quarters', 'culture', 28, [
      (name) => `${toPossessive(name)} archaeological core`,
      (name) => `${toPossessive(name)} archaeology-heavy center`,
    ], { cueType: 'archaeology' });
  }

  if (hasDestinationCue(destination, /\b(?:food|market|markets|culinary|wine|seafood|street food)\b/)) {
    addCandidate('food-stops', 'food', hasDestinationCue(destination, /\b(?:market|markets|street food)\b/) ? 22 : 18, [
      (name) => `${toPossessive(name)} food markets`,
      (name) => `${toPossessive(name)} neighborhood food stops`,
    ], { cueType: 'food' });
  }

  if (hasDestinationCue(destination, /\b(?:onsen|hot spring|hot springs|thermal)\b/)) {
    addCandidate('hot-spring-stays', 'restorative', 28, [
      (name) => `${toPossessive(name)} hot-spring inns`,
      (name) => `hot-spring stays in ${name}`,
    ], { cueType: 'hot-springs' });
  }

  if (hasCoastalCue || hasFerryCue || hasIslandTagCue) {
    addCandidate(
      'coastal-islands',
      'coastal',
      20,
      destinationNameLooksCoastal
        ? [
          (name) => `coastal towns along ${withDefiniteArticle(name)}`,
          (name) => `road-trip stops along ${withDefiniteArticle(name)}`,
        ]
        : hasFerryCue || hasDestinationTagCue(destination, ['ferry', 'island'])
          ? [
            (name) => `${toPossessive(name)} island-and-ferry stops`,
            (name) => `${toPossessive(name)} sea-facing stops`,
            (name) => `${toPossessive(name)} harbor neighborhoods`,
          ]
          : [
            (name) => `${toPossessive(name)} coastal detours`,
            (name) => `${toPossessive(name)} beach districts`,
            (name) => `${toPossessive(name)} waterfront quarters`,
            (name) => `${toPossessive(name)} sea-facing stays`,
          ],
      {
        cueType: destinationNameLooksCoastal
          ? 'coastal-region'
          : hasFerryCue || hasDestinationTagCue(destination, ['ferry', 'island'])
            ? 'island-ferry'
            : 'coastal',
      },
    );
  }

  if (hasDestinationCue(destination, /\b(?:mountain|alpine|hiking|volcanic|forest|national park)\b/)) {
    addCandidate('mountain-routes', 'landscape', 20, [
      (name) => `${toPossessive(name)} mountain scenery`,
      (name) => `${toPossessive(name)} alpine base`,
    ], { cueType: 'mountain' });
  }

  if (hasDestinationCue(destination, /\b(?:rail|train|station)\b/)) {
    addCandidate('rail-city-hops', 'transit', 22, [
      (name) => `${toPossessive(name)} rail-linked districts`,
      (name) => `${toPossessive(name)} city districts`,
    ], { cueType: 'rail' });
  }

  if (hasDestinationCue(destination, /\b(?:historic|old town|palace|castle|gallery|museum|heritage|traditional)\b/)) {
    addCandidate('historic-gardens', 'culture', 18, [
      (name) => `${toPossessive(name)} historic core`,
      (name) => `${toPossessive(name)} older quarters`,
    ], { cueType: 'historic' });
  }

  if (hasDestinationCue(destination, /\b(?:carnival|carnaval|samba|parade|fiesta)\b/)) {
    addCandidate('carnival-festivals', 'cultural', 24, [
      (name) => `${toPossessive(name)} carnival streets`,
      (name) => `${toPossessive(name)} festival routes`,
    ], { cueType: 'carnival' });
  }

  if (hasDestinationCue(destination, /\b(?:safari|savanna|savannah|game drive|big five|bushveld|game reserve)\b/)) {
    addCandidate('savanna-safari', 'wildlife', 28, [
      (name) => `${toPossessive(name)} safari camps`,
      (name) => `safari drives around ${name}`,
    ], { cueType: 'safari' });
  }

  if (hasDestinationCue(destination, /\b(?:river cruise|riverboat|felucca|sampan|junk boat|waterway)\b/)) {
    addCandidate('river-cruises', 'waterway', 22, [
      (name) => `${toPossessive(name)} river routes`,
      (name) => `waterway stops around ${name}`,
    ], { cueType: 'river-cruise' });
  }

  if (hasDestinationCue(destination, /\b(?:vineyard|vineyards|winery|wineries|wine region|wine route|viticulture|wine estate)\b/)) {
    addCandidate('vineyard-regions', 'food', 22, [
      (name) => `${toPossessive(name)} vineyard stays`,
      (name) => `wine-country stops around ${name}`,
    ], { cueType: 'vineyard' });
  }

  if (candidates.length === 0) {
    candidates.push({
      key: 'destination-stop',
      theme: 'general',
      weight: 10,
      label: destination.name,
      destinationName: destination.name,
      cueType: 'fallback',
    });
  }

  return candidates;
}

function buildProperNounAnchors(country, wikipediaContext, wikivoyageContext, contextDestinations, anchors) {
  const preferredThemes = new Set(
    anchors
      .map((anchor) => ANCHOR_THEME_BY_KEY[anchor.key] ?? anchor.key)
      .filter(Boolean),
  );

  const anchorOptions = contextDestinations.flatMap((destination, index) => {
    const destinationCandidates = buildDestinationNamedAnchorCandidates(destination);
    const sortedCandidates = [...destinationCandidates].sort((left, right) => {
      const leftScore = left.weight + (preferredThemes.has(left.theme) ? 8 : 0);
      const rightScore = right.weight + (preferredThemes.has(right.theme) ? 8 : 0);
      return rightScore - leftScore;
    });

    return sortedCandidates
      .slice(0, 3)
      .map((candidate, candidateIndex) => ({
        ...candidate,
        weight: candidate.weight + Math.max(0, 8 - index * 2) - candidateIndex * 3,
        featuredRank: destination.featured_rank ?? index + 1,
      }));
  });

  const sourceAnchors = buildSourceProperNounAnchors(
    country,
    wikipediaContext,
    wikivoyageContext,
    contextDestinations,
  );

  return [...anchorOptions, ...sourceAnchors].sort((left, right) => right.weight - left.weight);
}

function selectProperNounAnchorsForSummary(namedAnchors, count) {
  const selected = [];
  const selectedThemes = new Set();
  const selectedDestinations = new Set();
  const usedSuffixes = new Set();

  const extractSuffix = (text) => {
    const parts = text.split("'s ");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : null;
  };

  // 1. Try to pick unique destinations with unique themes AND unique suffixes
  for (const anchor of namedAnchors) {
    if (selected.length >= count) {
      break;
    }

    const suffix = extractSuffix(anchor.label);
    if (
      selectedThemes.has(anchor.theme)
      || selectedDestinations.has(anchor.destinationName)
      || (suffix && usedSuffixes.has(suffix))
    ) {
      continue;
    }

    selected.push(anchor);
    selectedThemes.add(anchor.theme);
    selectedDestinations.add(anchor.destinationName);
    if (suffix) {
      usedSuffixes.add(suffix);
    }
  }

  // 2. Fall back to unique destinations with unique suffixes (ignoring theme)
  for (const anchor of namedAnchors) {
    if (selected.length >= count) {
      break;
    }

    const suffix = extractSuffix(anchor.label);
    if (
      selectedDestinations.has(anchor.destinationName)
      || (suffix && usedSuffixes.has(suffix))
    ) {
      continue;
    }

    selected.push(anchor);
    selectedDestinations.add(anchor.destinationName);
    if (suffix) {
      usedSuffixes.add(suffix);
    }
  }

  // 3. Last resort: unique destinations (even if suffix duplicates)
  for (const anchor of namedAnchors) {
    if (selected.length >= count) {
      break;
    }

    if (selectedDestinations.has(anchor.destinationName)) {
      continue;
    }

    selected.push(anchor);
    selectedDestinations.add(anchor.destinationName);
  }

  return selected;
}

function isGeographyLedOpening(summary, countryName) {
  return new RegExp(
    `^${escapeRegex(countryName)}\\s+(?:is|sits|lies)\\s+(?:an?\\s+)?(?:country|island country|nation|state|republic|kingdom|archipelago|peninsula)\\b`,
    'i',
  ).test(summary);
}

function getProperNounAnchorWarnings(properNounAnchors) {
  const warnings = [];

  for (const anchor of properNounAnchors) {
    const label = normalizeOptionalText(anchor?.label);
    const destinationName = normalizeOptionalText(anchor?.destinationName);

    if (!label) {
      continue;
    }

    const normalizedLabel = normalizeForComparison(label);
    const normalizedDestinationName = normalizeForComparison(destinationName ?? '');

    if (anchor?.key === 'wildlife-days' && anchor?.cueType !== 'whale' && /\bwhale watching\b/.test(normalizedLabel)) {
      warnings.push(`Proper-noun anchor "${label}" mismatches the underlying wildlife cue.`);
    }

    if (/\bferry linked coast\b/.test(normalizedLabel)) {
      warnings.push(`Proper-noun anchor "${label}" still uses rigid ferry-linked coast phrasing.`);
    }

    if (/\bfor\b/.test(normalizedLabel) && /\bdetours\b/.test(normalizedLabel)) {
      warnings.push(`Proper-noun anchor "${label}" reads like generated detour shorthand.`);
    }

    if (/\bfor big landscape days\b/.test(normalizedLabel)) {
      warnings.push(`Proper-noun anchor "${label}" does not read naturally as a travel anchor.`);
    }

    if (normalizedDestinationName.includes('coast') && normalizedLabel.includes('coast') && /'s\s/i.test(label)) {
      warnings.push(`Proper-noun anchor "${label}" repeats coastal wording awkwardly.`);
    }
  }

  return uniquePhrases(warnings);
}

function isBetterSummaryCandidate(candidate, currentBestCandidate) {
  if (!currentBestCandidate) {
    return true;
  }

  const buildPenalty = (entry) => (
    entry.validation.errors.length * 20
    + entry.validation.warnings.length * 4
  );
  const candidatePenalty = buildPenalty(candidate);
  const currentPenalty = buildPenalty(currentBestCandidate);

  if (candidatePenalty !== currentPenalty) {
    return candidatePenalty < currentPenalty;
  }

  if (candidate.validation.score.overall !== currentBestCandidate.validation.score.overall) {
    return candidate.validation.score.overall > currentBestCandidate.validation.score.overall;
  }

  if (candidate.validation.score.specificity !== currentBestCandidate.validation.score.specificity) {
    return candidate.validation.score.specificity > currentBestCandidate.validation.score.specificity;
  }

  const variantPriority = { full: 3, tight: 2, compact: 1 };
  const candidatePriority = variantPriority[candidate.selectedVariant] ?? 0;
  const currentPriority = variantPriority[currentBestCandidate.selectedVariant] ?? 0;

  return candidatePriority > currentPriority;
}

function selectEditorialPatternFamily(signals, selectedAnchors, selectedTripStyles, selectedNamedAnchors) {
  const anchorThemes = new Set(selectedAnchors.map((anchor) => ANCHOR_THEME_BY_KEY[anchor.key] ?? anchor.key));
  const tripStyleKeySet = new Set(selectedTripStyles.map((tripStyle) => tripStyle.key));
  const namedAnchorThemes = new Set(selectedNamedAnchors.map((anchor) => anchor.theme));

  if (
    signals.context.publishedDestinationCount >= 4
    && (namedAnchorThemes.size >= 3 || (namedAnchorThemes.size >= 2 && signals.isArchipelago))
    && signals.travelIdentity.key !== 'rail-linked-culture-route'
  ) {
    return 'multi-region-repeat-trip-country';
  }

  if (
    !signals.isArchipelago
    && (['drive-first-landscape-route', 'landscape-led-outdoor-route', 'wildlife-and-landscape-route'].includes(signals.travelIdentity.key)
    || tripStyleKeySet.has('self-drive-routes'))
  ) {
    return 'drive-first-scenery-country';
  }

  if (
    (signals.travelIdentity.key === 'coastal-island-hopping-route' || signals.isArchipelago)
    && !tripStyleKeySet.has('self-drive-routes')
  ) {
    return 'island-beach-country';
  }

  if (signals.travelIdentity.key === 'food-and-culture-route') {
    return 'food-and-city-country';
  }

  if (
    signals.travelIdentity.key === 'rail-linked-culture-route'
    && (anchorThemes.has('restorative') || namedAnchorThemes.has('restorative'))
  ) {
    return 'first-time-highlights-country';
  }

  if (['rail-linked-culture-route', 'slow-culture-route', 'market-and-old-quarter-route'].includes(signals.travelIdentity.key)) {
    return 'compact-culture-country';
  }

  return 'first-time-highlights-country';
}

function buildTripFitSentence(tripStyles, familyKey, seed) {
  const fallbackPhrases = {
    'culture-first-itineraries': 'culture-heavy itineraries',
    'food-led-city-breaks': 'food-first city breaks',
    'first-multi-stop-routes': 'first-time multi-stop trips',
    'outdoor-heavy-routes': 'outdoor-heavy routes',
    'self-drive-routes': 'self-drive itineraries',
    'slower-restorative-stays': 'slower restorative stays',
    'city-led-breaks': 'short city breaks',
    'sea-led-itineraries': 'coast-first trips',
    'timing-sensitive-itineraries': 'timing-sensitive itineraries',
  };
  const phrases = tripStyles
    .map((tripStyle) => fallbackPhrases[tripStyle.key] || tripStyle.label)
    .filter(Boolean);

  if (phrases.length === 0) {
    return '';
  }

  const humanizedStyles = humanizeList(phrases);

  if (familyKey === 'multi-region-repeat-trip-country') {
    return chooseDeterministicOption([
      'This trip favors longer itineraries, with enough time to settle into each distinct region.',
      'It rewards repeat visits, focusing on discovery in one slice of the country at a time.',
      'The journey is designed for depth, favoring a regional focus over a rushed sweep.',
    ], `${seed}:tripfit:repeat`);
  }

  return chooseDeterministicOption([
    `This journey favors ${humanizedStyles}, with enough time to settle into each distinct region.`,
    `It rewards ${humanizedStyles}, balancing major landmarks with quieter, local corners.`,
    `The tempo works well for ${humanizedStyles}, making for a journey that feels unhurried.`,
    `The itinerary suits ${humanizedStyles}, where the travel between stops is part of the experience.`,
    `This trip is designed for ${humanizedStyles}, focusing on discovery at your own pace.`,
    `It’s the kind of route where ${humanizedStyles} take center stage across the trip.`,
  ], `${seed}:tripfit:fallback`);
}

function buildStructuralNoteSentence(familyKey, seed) {
  if (familyKey === 'multi-region-repeat-trip-country') {
    return 'The trip is at its strongest when handled as a series of regional loops rather than a single sweep.';
  }
  if (familyKey === 'drive-first-scenery-country') {
    return chooseDeterministicOption([
      'The route opens up more fully with your own transport to reach the landscapes between the main hubs.',
      'Many of the best scenic stretches are easier to reach with a car once you move beyond the cities.',
      'A car helps once the trip moves into the quieter landscapes and stops between the major hubs.',
    ], `${seed}:structural:drive`);
  }
  if (familyKey === 'compact-culture-country') {
    return 'The short distances between stops allow for a dense itinerary without a rushed pace.';
  }
  return '';
}

function buildOpeningAnchorList(properNounAnchors, selectedAnchors) {
  const labels = [];
  const normalizedLabels = new Set();
  const usedAnchorKeys = new Set(properNounAnchors.map((anchor) => anchor.key));
  const targetLabelCount = properNounAnchors.length >= 3
    ? 3
    : properNounAnchors.length >= 1
      ? 3
      : 2;
  const maxProperNounLabelCount = properNounAnchors.some((anchor) => anchor.key === 'source-place')
    ? Math.min(2, properNounAnchors.length)
    : targetLabelCount;

  for (const anchor of properNounAnchors) {
    if (labels.length >= maxProperNounLabelCount) {
      break;
    }

    const label = normalizeOptionalText(anchor?.label);
    const normalizedLabel = normalizeForComparison(label ?? '');

    if (!label || normalizedLabels.has(normalizedLabel)) {
      continue;
    }

    labels.push(label);
    normalizedLabels.add(normalizedLabel);
  }

  const sortedFallbackAnchors = [...selectedAnchors].sort((left, right) =>
    (OPENING_FALLBACK_PRIORITY_BY_KEY[right.key] ?? 0) - (OPENING_FALLBACK_PRIORITY_BY_KEY[left.key] ?? 0)
  );

  for (const anchor of sortedFallbackAnchors) {
    if (labels.length >= targetLabelCount) {
      break;
    }

    if (usedAnchorKeys.has(anchor.key)) {
      continue;
    }

    const label = OPENING_FALLBACK_LABEL_BY_KEY[anchor.key] ?? anchor.label;
    const normalizedLabel = normalizeForComparison(label ?? '');

    if (
      !label
      || !isUsableOpeningFallbackLabel(label)
      || normalizedLabels.has(normalizedLabel)
      || [...normalizedLabels].some((entry) => normalizedLabel.includes(entry) || entry.includes(normalizedLabel))
    ) {
      continue;
    }

    labels.push(label);
    normalizedLabels.add(normalizedLabel);
  }

  return labels.length > 0 ? humanizeList(labels) : 'the current curated route set';
}

function buildOpeningSentence(country, familyKey, properNounAnchors, selectedAnchors, seed) {
  const namedAnchorList = buildOpeningAnchorList(properNounAnchors, selectedAnchors);

  switch (familyKey) {
    case 'first-time-highlights-country':
    case 'island-beach-country':
      return chooseDeterministicOption([
        `A trip through ${country.name} threads together ${namedAnchorList} into a single, varied route.`,
        `To see ${country.name} at its most distinct, follow a path that connects ${namedAnchorList}.`,
        `Itineraries through ${country.name} typically connect ${namedAnchorList} into one journey.`,
      ], `${seed}:opening:first-time`);
    case 'compact-culture-country':
    case 'food-and-city-country':
      return chooseDeterministicOption([
        `Traveling through ${country.name} works best as a journey that links ${namedAnchorList}.`,
        `A route that links ${namedAnchorList} captures the broader regional character of ${country.name}.`,
        `The classic route through ${country.name} moves between ${namedAnchorList}.`,
      ], `${seed}:opening:compact-culture`);
    case 'multi-region-repeat-trip-country':
      return chooseDeterministicOption([
        `The landscape of ${country.name} reveals its variety as you travel between ${namedAnchorList}.`,
        `A journey through ${country.name} is best split into regional loops like ${namedAnchorList}.`,
        `A trip to ${country.name} is often built around the distinct regions of ${namedAnchorList}.`,
      ], `${seed}:opening:multi-region`);
    case 'drive-first-scenery-country':
      return chooseDeterministicOption([
        `The most distinct side of ${country.name} is found by moving between ${namedAnchorList}.`,
        `To see ${country.name} at its most distinct, follow a path that connects ${namedAnchorList}.`,
        `The best version of ${country.name} is found by threading a route through ${namedAnchorList}.`,
      ], `${seed}:opening:drive-first`);
    default:
      return `To see ${country.name} at its most distinct, follow a path that connects ${namedAnchorList}.`;
  }
}

function detectOpeningFamily(summary, countryName) {
  if (new RegExp(`^A trip through ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'trip-through';
  }

  if (new RegExp(`^To see ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'see-at-most-distinct';
  }

  if (new RegExp(`^Itineraries through ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'itineraries-through';
  }

  if (new RegExp(`^Traveling through ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'traveling-through';
  }

  if (new RegExp(`^A route that links ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'route-links';
  }

  if (new RegExp(`^The classic route through ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'classic-route';
  }

  if (new RegExp(`^The landscape of ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'landscape-reveals';
  }

  if (new RegExp(`^A journey through ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'journey-split';
  }

  if (new RegExp(`^A trip to ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'trip-built-around';
  }

  if (new RegExp(`^The most distinct side of ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'distinct-side';
  }

  if (new RegExp(`^The best version of ${escapeRegex(countryName)}\\b`, 'i').test(summary)) {
    return 'best-version';
  }

  return 'other';
}

function detectCadenceSignature(summary) {
  const sentences = String(summary ?? '')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences
    .map((sentence) => {
      if (/^(This journey|It rewards|The tempo|The itinerary|This trip)\b/i.test(sentence)) {
        return 'trip-fit';
      }

      if (/^(The trip|A car|The route|Many of the best|The short distances)\b/i.test(sentence)) {
        return 'structural-note';
      }

      return 'lead';
    })
    .join('|');
}

function findEditorialPhraseFamilies(summary) {
  const phraseFamilies = [
    { key: 'works-best', pattern: /\bworks best\b/i },
    { key: 'built-around', pattern: /\bbuilt around\b/i },
    { key: 'it-suits', pattern: /\bIt suits\b/i },
    { key: 'it-fits', pattern: /\bIt fits\b/i },
    { key: 'comes-into-focus', pattern: /\bcomes into focus\b/i },
    { key: 'road-trip', pattern: /\broad trip\b/i },
    { key: 'first-trip', pattern: /\bfirst trip\b/i },
    { key: 'plan-for', pattern: /\bplan for\b/i },
  ];

  return phraseFamilies
    .filter((family) => family.pattern.test(summary))
    .map((family) => family.key);
}

export function buildCountrySummarySignals(country, wikipediaContext, wikivoyageContext, contextDestinations, publishedDestinationCount) {
  const contextSignals = deriveCountryContextSignals(contextDestinations);
  const sourceContexts = buildCountrySourceSignalContexts(wikipediaContext, wikivoyageContext, contextDestinations);
  const anchors = buildCountryAnchorSignals(sourceContexts, contextDestinations, contextSignals);
  const tripStyles = buildCountryTripStyleSignals(anchors, contextSignals, publishedDestinationCount);
  const namedAnchors = buildProperNounAnchors(
    country,
    wikipediaContext,
    wikivoyageContext,
    contextDestinations,
    anchors,
  );
  const usedSources = uniquePhrases([
    wikipediaContext.success ? 'wikipedia' : null,
    wikivoyageContext.success ? 'wikivoyage' : null,
    contextDestinations.length > 0 ? 'destinations' : null,
    contextDestinations.some((destination) => normalizeMonthNumbers(destination.best_months).length > 0) ? 'climate' : null,
  ]);

  const sourceCorpus = sourceContexts
    .filter((context) => context.source === 'wikipedia' || context.source === 'wikivoyage')
    .map((context) => context.text)
    .join(' ');
  const isArchipelago = contextSignals.isArchipelago || /\b(?:island country|archipelago|island nation|island-hopping)\b/i.test(sourceCorpus);

  return {
    baseIdentity: extractCountryBaseIdentity(country, wikipediaContext),
    travelIdentity: buildCountryTravelIdentitySignal(anchors, contextSignals),
    anchors,
    namedAnchors,
    tripStyles,
    isArchipelago,
    seasonality: buildCountrySeasonality(contextDestinations, sourceContexts),
    context: {
      publishedDestinationCount,
      featuredDestinationCount: contextDestinations.length,
      featuredDestinationNames: contextDestinations.map((destination) => destination.name),
      usedSources,
    },
  };
}

function clampSummaryScore(value) {
  return Math.max(0, Math.min(10, Math.round(value)));
}

function buildCountrySummaryScore(summary, signals, validationErrorCount, matchedBannedPhraseCount) {
  const usesDestinationName = signals.context.featuredDestinationNames.some((name) => summary.includes(name));
  const properNounAnchorCount = signals.editorial?.properNounAnchors?.length ?? 0;
  const specificity = clampSummaryScore(
    3
      + Math.min(3, signals.anchors.length)
      + (usesDestinationName ? 1 : 0)
      + Math.min(2, properNounAnchorCount)
      + (signals.context.usedSources.includes('wikivoyage') ? 2 : 0)
      + (signals.context.usedSources.includes('climate') && signals.seasonality.include ? 1 : 0)
      + (signals.travelIdentity.label !== 'country-scale multi-stop route' ? 1 : 0)
      - validationErrorCount * 2
      - matchedBannedPhraseCount * 2,
  );
  const differentiation = clampSummaryScore(
    3
      + Math.min(3, new Set(signals.anchors.map((anchor) => anchor.key)).size)
      + Math.min(2, properNounAnchorCount)
      + (signals.context.usedSources.includes('wikivoyage') ? 2 : 0)
      + (signals.travelIdentity.label !== 'country-scale multi-stop route' ? 1 : 0)
      - validationErrorCount * 2
      - matchedBannedPhraseCount * 2,
  );
  const travelerUsefulness = clampSummaryScore(
    3
      + Math.min(2, signals.tripStyles.length)
      + (signals.seasonality.include ? 2 : 0)
      + (signals.context.featuredDestinationCount > 0 ? 1 : 0)
      + (signals.context.usedSources.includes('climate') ? 1 : 0)
      - validationErrorCount * 2,
  );

  return {
    specificity,
    differentiation,
    traveler_usefulness: travelerUsefulness,
    overall: clampSummaryScore((specificity + differentiation + travelerUsefulness) / 3),
  };
}

export function validateCountrySummary(country, summary, signals) {
  const errors = [];
  const warnings = [];
  const bannedPhraseValidation = validateBannedPhrases(summary, COUNTRY_SUMMARY_BANNED_PHRASES);
  const properNounAnchorCount = signals.editorial?.properNounAnchors?.length ?? 0;
  const availableProperNounAnchorCount = signals.namedAnchors?.length ?? 0;
  const properNounAnchorWarnings = getProperNounAnchorWarnings(signals.editorial?.properNounAnchors ?? []);

  if (!summary.trim()) {
    errors.push('Summary text is empty.');
  }

  if (summary.length > MAX_COUNTRY_SUMMARY_LENGTH) {
    errors.push(`Summary exceeds ${MAX_COUNTRY_SUMMARY_LENGTH} characters.`);
  }

  if (summary.length < 150) {
    warnings.push('Summary is shorter than the preferred editorial range.');
  }

  const openingSentence = summary.split(/[.!?]/, 1)[0] ?? summary;

  if (!new RegExp(`\\b${escapeRegex(country.name)}\\b`, 'i').test(openingSentence)) {
    warnings.push('Summary should mention the country in the opening sentence.');
  }

  if (isGeographyLedOpening(summary, country.name)) {
    warnings.push('Summary opens too encyclopedically.');
  }

  if (!signals.travelIdentity.label) {
    errors.push('Summary is missing a clear travel identity.');
  }

  if (signals.anchors.length < 2) {
    errors.push('Summary requires at least two specific anchors.');
  }

  if (signals.tripStyles.length === 0) {
    errors.push('Summary requires at least one trip-style fit.');
  }

  if (availableProperNounAnchorCount > 0 && properNounAnchorCount === 0) {
    warnings.push('Summary does not use any proper-noun anchors.');
  }

  if (availableProperNounAnchorCount >= 2 && properNounAnchorCount < 2) {
    warnings.push('Summary leaves available proper-noun anchors on the table.');
  }

  const phraseFamilies = signals.editorial?.phraseFamilies ?? [];
  const usesLegacySkeleton = (signals.editorial?.openingFamily ?? '') === 'works-best-as'
    || (phraseFamilies.includes('works-best') && phraseFamilies.includes('built-around'));

  if (usesLegacySkeleton) {
    warnings.push('Summary still uses the legacy works-best/built-around skeleton.');
  }

  warnings.push(...properNounAnchorWarnings);

  if (bannedPhraseValidation.matchedPhrases.length > 0) {
    errors.push(`Summary includes banned phrases: ${bannedPhraseValidation.matchedPhrases.join(', ')}.`);
  }

  if (/\w+'s\s+\w+'s\b/.test(summary)) {
    warnings.push('Summary contains possessive stacking (e.g. "Kyoto\'s Tokyo\'s").');
  }

  const sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= 2) {
    const openingWords = sentences.map((s) => (s.match(/^\s*(\w+)/) ?? [])[1]?.toLowerCase()).filter(Boolean);
    const seen = new Map();
    for (const word of openingWords) {
      seen.set(word, (seen.get(word) ?? 0) + 1);
    }
    for (const [word, count] of seen) {
      if (count >= 2) {
        warnings.push(`Multiple sentences start with "${word}" — risks repetitive cadence.`);
        break;
      }
    }
  }

  const trimmed = summary.trim();
  if (trimmed.length > 0 && !/[.!?]$/.test(trimmed)) {
    warnings.push('Summary appears to end mid-phrase — likely trimmed at a non-sentence boundary.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    matchedBannedPhrases: bannedPhraseValidation.matchedPhrases,
    score: buildCountrySummaryScore(summary, signals, errors.length, bannedPhraseValidation.matchedPhrases.length),
  };
}

export function generateCountrySummaryFromSignals(country, signals) {
  const variants = [
    { key: 'full', anchorCount: 3, tripStyleCount: 2, properNounAnchorCount: 3, includeSeasonality: signals.seasonality.include },
    { key: 'tight', anchorCount: 2, tripStyleCount: 2, properNounAnchorCount: 2, includeSeasonality: signals.seasonality.include },
    { key: 'compact', anchorCount: 2, tripStyleCount: 1, properNounAnchorCount: 2, includeSeasonality: false },
  ];
  let bestCandidate = null;

  for (const variant of variants) {
    const selectedAnchors = selectAnchorsForSummary(signals.anchors, variant.anchorCount);
    const selectedTripStyles = selectTripStylesForSummary(
      signals.tripStyles,
      signals.travelIdentity.key,
      variant.tripStyleCount,
    );
    const selectedProperNounAnchors = selectProperNounAnchorsForSummary(
      signals.namedAnchors ?? [],
      variant.properNounAnchorCount,
    );
    const patternFamily = selectEditorialPatternFamily(
      signals,
      selectedAnchors,
      selectedTripStyles,
      selectedProperNounAnchors,
    );
    const summarySeed = `${country.slug}:${variant.key}:${patternFamily}`;
    const leadSentence = buildOpeningSentence(
      country,
      patternFamily,
      selectedProperNounAnchors,
      selectedAnchors,
      summarySeed,
    );
    const tripFitSentence = buildTripFitSentence(selectedTripStyles, patternFamily, summarySeed);
    const structuralNote = buildStructuralNoteSentence(patternFamily, summarySeed);
    const candidateSignals = {
      ...signals,
      anchors: selectedAnchors,
      tripStyles: selectedTripStyles,
      editorial: {
        patternFamily,
        properNounAnchors: selectedProperNounAnchors,
        openingFamily: detectOpeningFamily(leadSentence, country.name),
        cadenceSignature: detectCadenceSignature(
          [leadSentence, tripFitSentence, structuralNote].filter(Boolean).join(' '),
        ),
        phraseFamilies: findEditorialPhraseFamilies(
          [leadSentence, tripFitSentence, structuralNote].filter(Boolean).join(' '),
        ),
      },
      seasonality: {
        ...signals.seasonality,
        include: false,
        summaryText: null,
        signals: [],
      },
    };
    const summary = trimToSentenceBoundary(
      [leadSentence, tripFitSentence, structuralNote]
        .filter(Boolean)
        .join(' '),
      MAX_COUNTRY_SUMMARY_LENGTH,
    );
    const validation = validateCountrySummary(country, summary, candidateSignals);
    const candidate = {
      selectedVariant: variant.key,
      summary,
      signals: candidateSignals,
      validation,
    };

    if (isBetterSummaryCandidate(candidate, bestCandidate)) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function countDestinationMentions(summary, featuredDestinationNames) {
  return featuredDestinationNames
    .map((name) => ({
      name,
      count: (summary.match(new RegExp(`\\b${escapeRegex(name)}\\b`, 'g')) ?? []).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

export function reviewCountrySummaryCandidate(country, candidate) {
  if (!candidate) {
    return {
      classification: 'fail',
      issues: [
        {
          key: 'missing-candidate',
          severity: 'fail',
          message: `No summary candidate could be produced for ${country.slug}.`,
        },
      ],
      metrics: {
        anchor_count: 0,
        trip_style_count: 0,
        source_counts: {},
        destination_mentions: [],
      },
    };
  }

  const { summary, signals, validation } = candidate;
  const issues = [];
  const destinationMentions = countDestinationMentions(summary, signals.context.featuredDestinationNames);
  const topDestinationMention = destinationMentions[0] ?? null;
  const editorialPattern = signals.editorial?.patternFamily ?? 'unknown';
  const properNounAnchors = signals.editorial?.properNounAnchors ?? [];
  const geographyLedOpening = isGeographyLedOpening(summary, country.name);
  const geographyFactHeavy = /\b(?:located in|in east asia|in southeast asia|in north america|in europe|in north africa|bordered by|archipelago|peninsula)\b/i.test(summary);
  const lowSpecificity = validation.score.specificity <= 5;
  const weakDifferentiation = validation.score.differentiation <= 5;
  const repeatedOpeningStructure = ['works-best-as'].includes(signals.editorial?.openingFamily ?? '');
  const singleDestinationHeavy = Boolean(
    topDestinationMention
      && signals.context.featuredDestinationCount >= 3
      && topDestinationMention.count >= 3,
  );

  if (!validation.isValid) {
    issues.push({
      key: 'validation-failed',
      severity: 'fail',
      message: validation.errors.join(' '),
    });
  }

  if (validation.matchedBannedPhrases.length > 0) {
    issues.push({
      key: 'banned-phrases',
      severity: 'fail',
      message: `Matched banned phrases: ${validation.matchedBannedPhrases.join(', ')}.`,
    });
  }

  for (const warning of validation.warnings) {
    issues.push({
      key: `validation-${normalizeForComparison(warning).replace(/\s+/g, '-')}`,
      severity: 'warn',
      message: warning,
    });
  }

  if (signals.anchors.length < 2) {
    issues.push({
      key: 'missing-anchors',
      severity: 'fail',
      message: 'Summary selected fewer than two anchors.',
    });
  }

  if (signals.tripStyles.length === 0) {
    issues.push({
      key: 'missing-trip-style',
      severity: 'fail',
      message: 'Summary is missing trip-style fit.',
    });
  }

  if (lowSpecificity) {
    issues.push({
      key: 'low-specificity',
      severity: validation.score.specificity <= 3 ? 'fail' : 'warn',
      message: `Specificity score is ${validation.score.specificity}/10.`,
    });
  }

  if (weakDifferentiation) {
    issues.push({
      key: 'weak-differentiation',
      severity: 'warn',
      message: `Differentiation score is ${validation.score.differentiation}/10.`,
    });
  }

  if (geographyLedOpening) {
    issues.push({
      key: 'geography-led-opening',
      severity: 'warn',
      message: 'Opening still reads like geography-first encyclopedia copy.',
    });
  }

  if (geographyFactHeavy) {
    issues.push({
      key: 'geography-fact-heavy',
      severity: 'warn',
      message: 'Summary leans on geography framing more than traveler framing.',
    });
  }

  if (singleDestinationHeavy) {
    issues.push({
      key: 'single-destination-heavy',
      severity: 'warn',
      message: `${topDestinationMention.name} appears ${topDestinationMention.count} times in the summary.`,
    });
  }

  if (signals.travelIdentity.label === 'country-scale multi-stop route') {
    issues.push({
      key: 'generic-travel-identity',
      severity: 'warn',
      message: 'Travel identity fell back to the generic multi-stop label.',
    });
  }

  if (properNounAnchors.length === 0 && (signals.namedAnchors?.length ?? 0) > 0) {
    issues.push({
      key: 'lack-of-proper-noun-anchors',
      severity: 'warn',
      message: 'Summary does not surface any proper-noun anchors.',
    });
  }

  if (repeatedOpeningStructure) {
    issues.push({
      key: 'repeated-opening-structure',
      severity: 'warn',
      message: 'Summary still opens with the legacy repeated structure.',
    });
  }

  const hasWikivoyage = signals.context.usedSources.includes('wikivoyage');
  const hasPublishedDestinations = signals.context.publishedDestinationCount > 0;

  if (!hasWikivoyage && !hasPublishedDestinations) {
    issues.push({
      key: 'source-poor',
      severity: 'warn',
      message: 'No Wikivoyage context and no published destinations — summary is built from thin source material.',
    });
  }

  const dedupedIssues = issues.filter((issue, index) =>
    issues.findIndex((entry) => entry.key === issue.key && entry.message === issue.message) === index
  );
  const classification = dedupedIssues.some((issue) => issue.severity === 'fail')
    ? 'fail'
    : dedupedIssues.some((issue) => issue.severity === 'warn')
      ? 'warn'
      : 'pass';

  return {
    classification,
    issues: dedupedIssues,
    metrics: {
      anchor_count: signals.anchors.length,
      trip_style_count: signals.tripStyles.length,
      source_counts: {
        wikipedia: signals.anchors.filter((anchor) => anchor.source === 'wikipedia').length,
        wikivoyage: signals.anchors.filter((anchor) => anchor.source === 'wikivoyage').length,
        destinations: signals.anchors.filter((anchor) => anchor.source === 'destinations').length,
        climate: signals.seasonality.signals.length,
      },
      proper_noun_anchor_count: properNounAnchors.length,
      available_proper_noun_anchor_count: signals.namedAnchors?.length ?? 0,
      editorial_pattern: editorialPattern,
      opening_family: signals.editorial?.openingFamily ?? 'other',
      cadence_signature: signals.editorial?.cadenceSignature ?? '',
      phrase_families: signals.editorial?.phraseFamilies ?? [],
      destination_mentions: destinationMentions,
    },
  };
}

export function buildCountrySummaryCandidate({
  country,
  wikipediaContext,
  wikivoyageContext,
  contextDestinations,
  publishedDestinationCount,
}) {
  const signals = buildCountrySummarySignals(
    country,
    wikipediaContext,
    wikivoyageContext,
    contextDestinations,
    publishedDestinationCount,
  );
  const generatedSummary = generateCountrySummaryFromSignals(country, signals);

  if (!generatedSummary) {
    return null;
  }

  return {
    ...generatedSummary,
    review: reviewCountrySummaryCandidate(country, generatedSummary),
  };
}
