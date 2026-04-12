import homeHeroFallbackAssetUrl from '../assets/home-hero-fallback.svg';

export const featuredDestinations = [
  {
    slug: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    region: 'Spring classic',
    summary: 'Historic districts, gardens, and shoulder-season weather windows that reward slower travel.',
    bestWindow: 'April to May',
    climateCue: 'Mild days, lighter rain',
    tags: ['Temples', 'Culture', 'Walkable'],
    collection_tags: ['city-break', 'culture-history', 'food-capital'],
    hero_image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80',
    hero_image_source_url: 'https://unsplash.com/photos/brown-temple-surrounded-by-trees-during-daytime-h0u3F5f4pAs',
  },
  {
    slug: 'cape-town',
    name: 'Cape Town',
    country: 'South Africa',
    region: 'Sun-chasing',
    summary: 'Beach afternoons, mountain views, and a long summer stretch that suits outdoor itineraries.',
    bestWindow: 'November to March',
    climateCue: 'Dry, breezy warmth',
    tags: ['Coast', 'Hiking', 'Food'],
    collection_tags: ['city-break', 'adventure-active', 'food-capital', 'nature-wildlife'],
    hero_image_url: 'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=1600&q=80',
    hero_image_source_url: 'https://unsplash.com/photos/table-mountain-south-africa-W9p9t6vX-G8',
  },
  {
    slug: 'reykjavik',
    name: 'Reykjavik',
    country: 'Iceland',
    region: 'Cool escapes',
    summary: 'A strong base for northern landscapes, midnight sun trips, and shoulder-season city breaks.',
    bestWindow: 'June to August',
    climateCue: 'Long daylight, cool air',
    tags: ['Nature', 'Design', 'Road trips'],
    collection_tags: ['city-break', 'nature-wildlife', 'adventure-active', 'mild-summer'],
    hero_image_url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=80',
    hero_image_source_url: 'https://unsplash.com/photos/mountain-near-body-of-water-under-blue-sky-during-daytime-7M9S-X-Y-uM',
  },
];

export const seasonalCollections = [
  {
    title: 'Low-rainfall city breaks',
    collection: 'city-break',
    description: 'Discover vibrant cities with dry, comfortable conditions perfect for endless walking and exploration.',
  },
  {
    title: 'Warm winter sun',
    collection: 'winter-sun',
    description: 'Escape the cold with destinations offering perfect beach weather and mild temperatures during the winter months.',
  },
  {
    title: 'Mild summer escapes',
    collection: 'mild-summer',
    description: 'Beat the extreme heat in locations that offer refreshing breezes and comfortable outdoor adventures.',
  },
];

export const destinationShells = {
  kyoto: {
    id: 'mock-kyoto',
    slug: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    country_code: 'JP',
    continent: 'Asia',
    latitude: 35.0116,
    longitude: 135.7681,
    timezone: 'Asia/Tokyo',
    summary:
      'Kyoto balances temple districts, garden walks, and neighborhood cafes with a climate profile that rewards shoulder-season travel over the humid summer peak.',
    hero_image_url:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80',
    hero_image_source_url:
      'https://unsplash.com/photos/brown-temple-surrounded-by-trees-during-daytime-h0u3F5f4pAs',
    best_months: [4, 5, 10, 11],
    travel_tags: ['Historic', 'Walkable', 'Food', 'Gardens'],
    collection_tags: ['city-break', 'culture-history', 'food-capital'],
    seasonal_insight:
      'Spring and autumn create Kyoto\'s strongest balance of comfortable temperatures, lower humidity, and easier all-day walking through temple districts and gardens.',
  },
  'cape-town': {
    id: 'mock-cape-town',
    slug: 'cape-town',
    name: 'Cape Town',
    country: 'South Africa',
    country_code: 'ZA',
    continent: 'Africa',
    latitude: -33.9249,
    longitude: 18.4241,
    timezone: 'Africa/Johannesburg',
    summary:
      'Cape Town combines mountain scenery, urban dining, and Atlantic beaches. It performs best when the dry season supports hikes, scenic drives, and long sunset-heavy afternoons.',
    hero_image_url:
      'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=1600&q=80',
    hero_image_source_url:
      'https://unsplash.com/photos/table-mountain-south-africa-W9p9t6vX-G8',
    best_months: [11, 12, 1, 2, 3],
    travel_tags: ['Coast', 'Hiking', 'Wine', 'Scenic drives'],
    collection_tags: ['city-break', 'adventure-active', 'food-capital', 'nature-wildlife'],
    seasonal_insight:
      'Cape Town\'s warm-season window works best for travelers who want beach time, outdoor dining, and reliable hiking conditions without winter rainfall interrupting plans.',
  },
  reykjavik: {
    id: 'mock-reykjavik',
    slug: 'reykjavik',
    name: 'Reykjavik',
    country: 'Iceland',
    country_code: 'IS',
    continent: 'Europe',
    latitude: 64.1466,
    longitude: -21.9426,
    timezone: 'Atlantic/Reykjavik',
    summary:
      'Reykjavik works as a launch point for road trips, geothermal stops, and design-forward city breaks. The best travel window depends on daylight length, wind tolerance, and access to surrounding landscapes.',
    hero_image_url:
      'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=80',
    hero_image_source_url:
      'https://unsplash.com/photos/mountain-near-body-of-water-under-blue-sky-during-daytime-7M9S-X-Y-uM',
    best_months: [6, 7, 8, 9],
    travel_tags: ['Nature', 'Road trips', 'Northern lights', 'Hot springs'],
    collection_tags: ['city-break', 'nature-wildlife', 'adventure-active', 'mild-summer'],
    seasonal_insight:
      'Reykjavik performs best when long daylight stretches make road-trip days easier and milder temperatures reduce the friction of exposed, wind-heavy sightseeing.',
  },
};

export const countryShells = {
  japan: {
    code: 'JP',
    slug: 'japan',
    name: 'Japan',
    continent: 'Asia',
    summary:
      'A first trip to Japan makes the most sense when it threads through Kyoto\'s shrine-and-temple quarters, Hakone\'s hot-spring inns, and Tokyo\'s city neighborhoods. It suits travelers who care about old quarters and headline sights, but still want the food and street life to matter. With Kyoto high on the list, planning for spring and autumn is the safer bet.',
    collection_tags: ['city-break', 'culture-history', 'food-capital', 'year-round'],
    hero_image_url: null,
    seasonal_overview:
      'Use destination-level profiles across Japan rather than one national climate label. Kyoto, Tokyo, and northern or coastal regions can feel very different across the same month.',
    is_published: true,
  },
  'south-africa': {
    code: 'ZA',
    slug: 'south-africa',
    name: 'South Africa',
    continent: 'Africa',
    summary:
      'South Africa mixes coastal cities, wine regions, and inland landscapes, so the strongest travel window changes by region and trip style.',
    collection_tags: ['city-break', 'adventure-active', 'food-capital', 'nature-wildlife', 'winter-sun'],
    hero_image_url: null,
    seasonal_overview:
      'Plan South Africa destination by destination. Cape Town, the Garden Route, and inland safari regions do not share one simple climate pattern.',
    is_published: true,
  },
  iceland: {
    code: 'IS',
    slug: 'iceland',
    name: 'Iceland',
    continent: 'Europe',
    summary:
      'Iceland works best as a destination-led country guide, with daylight length, road conditions, and exposed weather shaping trip quality more than a single temperature average.',
    collection_tags: ['nature-wildlife', 'adventure-active', 'mild-summer', 'backpacking-budget'],
    hero_image_url: null,
    seasonal_overview:
      'Use featured destinations and route plans to compare Iceland travel timing. Daylight, wind, and access conditions matter as much as average temperatures.',
    is_published: true,
  },
};

export const countryFeaturedDestinationSlugs = {
  japan: ['kyoto'],
  'south-africa': ['cape-town'],
  iceland: ['reykjavik'],
};

function createMonthlyClimateRows(destinationId, rows) {
  return rows.map((row) => ({
    id: `${destinationId}-${row.month}`,
    destination_id: destinationId,
    month: row.month,
    avg_high_c: row.high,
    avg_low_c: row.low,
    avg_precip_mm: row.precip,
    avg_humidity: row.humidity,
    sunshine_hours: row.sunshine,
    comfort_score: row.score,
    recommendation_label: row.recommendation,
    source: 'SeasonScout curated baseline',
    last_updated: '2026-03-01',
  }));
}

export const monthlyClimateBySlug = {
  kyoto: createMonthlyClimateRows('mock-kyoto', [
    { month: 1, high: 8, low: 1, precip: 50, humidity: 66, sunshine: 4.5, score: 54, recommendation: 'Okay' },
    { month: 2, high: 10, low: 2, precip: 68, humidity: 64, sunshine: 4.9, score: 58, recommendation: 'Okay' },
    { month: 3, high: 14, low: 5, precip: 112, humidity: 63, sunshine: 5.3, score: 71, recommendation: 'Good' },
    { month: 4, high: 20, low: 10, precip: 115, humidity: 60, sunshine: 5.8, score: 86, recommendation: 'Ideal' },
    { month: 5, high: 24, low: 15, precip: 145, humidity: 64, sunshine: 6.1, score: 83, recommendation: 'Ideal' },
    { month: 6, high: 28, low: 20, precip: 214, humidity: 72, sunshine: 5.2, score: 55, recommendation: 'Okay' },
    { month: 7, high: 32, low: 24, precip: 220, humidity: 76, sunshine: 6.3, score: 40, recommendation: 'Avoid' },
    { month: 8, high: 34, low: 25, precip: 160, humidity: 71, sunshine: 7.1, score: 45, recommendation: 'Avoid' },
    { month: 9, high: 29, low: 21, precip: 176, humidity: 74, sunshine: 5.6, score: 57, recommendation: 'Okay' },
    { month: 10, high: 23, low: 14, precip: 121, humidity: 67, sunshine: 5.0, score: 82, recommendation: 'Ideal' },
    { month: 11, high: 17, low: 8, precip: 71, humidity: 65, sunshine: 4.6, score: 79, recommendation: 'Good' },
    { month: 12, high: 11, low: 3, precip: 48, humidity: 66, sunshine: 4.2, score: 60, recommendation: 'Good' },
  ]),
  'cape-town': createMonthlyClimateRows('mock-cape-town', [
    { month: 1, high: 27, low: 17, precip: 15, humidity: 63, sunshine: 11.0, score: 88, recommendation: 'Ideal' },
    { month: 2, high: 27, low: 17, precip: 18, humidity: 64, sunshine: 10.0, score: 88, recommendation: 'Ideal' },
    { month: 3, high: 25, low: 16, precip: 20, humidity: 66, sunshine: 8.6, score: 84, recommendation: 'Ideal' },
    { month: 4, high: 23, low: 13, precip: 41, humidity: 68, sunshine: 7.4, score: 76, recommendation: 'Good' },
    { month: 5, high: 20, low: 11, precip: 69, humidity: 71, sunshine: 6.2, score: 64, recommendation: 'Good' },
    { month: 6, high: 18, low: 9, precip: 93, humidity: 75, sunshine: 5.4, score: 54, recommendation: 'Okay' },
    { month: 7, high: 17, low: 8, precip: 82, humidity: 74, sunshine: 6.0, score: 55, recommendation: 'Okay' },
    { month: 8, high: 18, low: 9, precip: 77, humidity: 72, sunshine: 6.5, score: 57, recommendation: 'Okay' },
    { month: 9, high: 19, low: 10, precip: 40, humidity: 69, sunshine: 7.4, score: 71, recommendation: 'Good' },
    { month: 10, high: 22, low: 12, precip: 30, humidity: 67, sunshine: 8.8, score: 81, recommendation: 'Good' },
    { month: 11, high: 24, low: 14, precip: 17, humidity: 65, sunshine: 9.8, score: 86, recommendation: 'Ideal' },
    { month: 12, high: 26, low: 16, precip: 14, humidity: 63, sunshine: 10.6, score: 88, recommendation: 'Ideal' },
  ]),
  reykjavik: createMonthlyClimateRows('mock-reykjavik', [
    { month: 1, high: 3, low: -2, precip: 83, humidity: 79, sunshine: 1.0, score: 31, recommendation: 'Avoid' },
    { month: 2, high: 3, low: -2, precip: 81, humidity: 78, sunshine: 2.5, score: 34, recommendation: 'Avoid' },
    { month: 3, high: 4, low: -1, precip: 82, humidity: 76, sunshine: 4.1, score: 39, recommendation: 'Okay' },
    { month: 4, high: 7, low: 1, precip: 58, humidity: 74, sunshine: 5.8, score: 53, recommendation: 'Okay' },
    { month: 5, high: 10, low: 4, precip: 44, humidity: 72, sunshine: 7.5, score: 67, recommendation: 'Good' },
    { month: 6, high: 12, low: 7, precip: 50, humidity: 74, sunshine: 8.2, score: 79, recommendation: 'Ideal' },
    { month: 7, high: 14, low: 9, precip: 51, humidity: 76, sunshine: 8.1, score: 82, recommendation: 'Ideal' },
    { month: 8, high: 13, low: 8, precip: 61, humidity: 78, sunshine: 6.6, score: 78, recommendation: 'Ideal' },
    { month: 9, high: 10, low: 6, precip: 67, humidity: 79, sunshine: 4.8, score: 69, recommendation: 'Good' },
    { month: 10, high: 7, low: 3, precip: 86, humidity: 80, sunshine: 3.1, score: 48, recommendation: 'Okay' },
    { month: 11, high: 4, low: 0, precip: 79, humidity: 80, sunshine: 1.7, score: 35, recommendation: 'Avoid' },
    { month: 12, high: 3, low: -1, precip: 84, humidity: 80, sunshine: 0.8, score: 30, recommendation: 'Avoid' },
  ]),
};

export const weatherSnapshots = {
  kyoto: {
    current: {
      condition: 'Partly cloudy',
      temperature_c: 21,
      feels_like_c: 22,
      humidity_percent: 57,
      wind_kph: 10,
      updated_label: 'Prepared fallback weather snapshot',
      summary: 'Comfortable spring-style conditions for temple walks and city wandering.',
    },
    forecast: [
      { day_label: 'Today', condition: 'Partly cloudy', high_c: 22, low_c: 13, precipitation_chance: 15 },
      { day_label: 'Tomorrow', condition: 'Sunny intervals', high_c: 24, low_c: 14, precipitation_chance: 10 },
      { day_label: 'Sat', condition: 'Light rain', high_c: 19, low_c: 12, precipitation_chance: 55 },
      { day_label: 'Sun', condition: 'Cloudy', high_c: 20, low_c: 12, precipitation_chance: 25 },
    ],
    note: 'Live weather is temporarily unavailable, so SeasonScout is showing a prepared Kyoto fallback snapshot.',
  },
  'cape-town': {
    current: {
      condition: 'Sunny',
      temperature_c: 26,
      feels_like_c: 27,
      humidity_percent: 61,
      wind_kph: 18,
      updated_label: 'Prepared fallback weather snapshot',
      summary: 'Dry, bright conditions that suit beaches, scenic drives, and late outdoor meals.',
    },
    forecast: [
      { day_label: 'Today', condition: 'Sunny', high_c: 27, low_c: 17, precipitation_chance: 5 },
      { day_label: 'Tomorrow', condition: 'Sunny', high_c: 28, low_c: 17, precipitation_chance: 5 },
      { day_label: 'Sat', condition: 'Windy', high_c: 25, low_c: 16, precipitation_chance: 10 },
      { day_label: 'Sun', condition: 'Mostly sunny', high_c: 24, low_c: 15, precipitation_chance: 8 },
    ],
    note: 'Live weather is temporarily unavailable, so SeasonScout is showing a prepared Cape Town fallback snapshot.',
  },
  reykjavik: {
    current: {
      condition: 'Breezy showers',
      temperature_c: 8,
      feels_like_c: 5,
      humidity_percent: 74,
      wind_kph: 24,
      updated_label: 'Prepared fallback weather snapshot',
      summary: 'Cool air and gustier conditions make layers and weatherproof planning important.',
    },
    forecast: [
      { day_label: 'Today', condition: 'Showers', high_c: 9, low_c: 4, precipitation_chance: 45 },
      { day_label: 'Tomorrow', condition: 'Cloudy', high_c: 8, low_c: 3, precipitation_chance: 25 },
      { day_label: 'Sat', condition: 'Sunny spells', high_c: 10, low_c: 4, precipitation_chance: 15 },
      { day_label: 'Sun', condition: 'Rain', high_c: 7, low_c: 2, precipitation_chance: 60 },
    ],
    note: 'Live weather is temporarily unavailable, so SeasonScout is showing a prepared Reykjavik fallback snapshot.',
  },
};

export const favoritePreview = [
  {
    slug: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
  },
  {
    slug: 'reykjavik',
    name: 'Reykjavik',
    country: 'Iceland',
  },
];

export const homeHeroContentFallback = {
  heroImageUrl: homeHeroFallbackAssetUrl,
  heroImageSourceName: 'SeasonScout',
  heroImageSourceUrl: null,
  heroImageAttributionName: 'SeasonScout',
  heroImageAttributionUrl: null,
  heroImageLocationLabel: null,
};
