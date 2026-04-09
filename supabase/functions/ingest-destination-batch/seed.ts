export type CuratedDestinationSeedRow = {
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

export const CURATED_SEED_SOURCE_NAME = 'curated_destination_seed';
export const CURATED_SEED_SOURCE_VERSION = '2026-03-16-add-israel';
export const MAX_CURATED_DESTINATION_BATCH = 12;

// Keep this list intentionally small and reviewed by hand. This is the only input
// that the first ingestion pipeline accepts.
export const CURATED_DESTINATION_SEED: CuratedDestinationSeedRow[] = [
  {
    slug: 'kyoto',
    name: 'Kyoto',
    country_code: 'JP',
    country: 'Japan',
    continent: 'Asia',
    latitude: 35.0116,
    longitude: 135.7681,
    timezone: 'Asia/Tokyo',
  },
  {
    slug: 'cape-town',
    name: 'Cape Town',
    country_code: 'ZA',
    country: 'South Africa',
    continent: 'Africa',
    latitude: -33.9249,
    longitude: 18.4241,
    timezone: 'Africa/Johannesburg',
  },
  {
    slug: 'reykjavik',
    name: 'Reykjavik',
    country_code: 'IS',
    country: 'Iceland',
    continent: 'Europe',
    latitude: 64.1466,
    longitude: -21.9426,
    timezone: 'Atlantic/Reykjavik',
  },
  {
    slug: 'bali',
    name: 'Bali',
    country_code: 'ID',
    country: 'Indonesia',
    continent: 'Asia',
    latitude: -8.3405,
    longitude: 115.092,
    timezone: 'Asia/Makassar',
  },
  {
    slug: 'rome',
    name: 'Rome',
    country_code: 'IT',
    country: 'Italy',
    continent: 'Europe',
    latitude: 41.9028,
    longitude: 12.4964,
    timezone: 'Europe/Rome',
  },
  {
    slug: 'athens',
    name: 'Athens',
    country_code: 'GR',
    country: 'Greece',
    continent: 'Europe',
    latitude: 37.9838,
    longitude: 23.7275,
    timezone: 'Europe/Athens',
  },
  {
    slug: 'barcelona',
    name: 'Barcelona',
    country_code: 'ES',
    country: 'Spain',
    continent: 'Europe',
    latitude: 41.3851,
    longitude: 2.1734,
    timezone: 'Europe/Madrid',
  },
  {
    slug: 'mexico-city',
    name: 'Mexico City',
    country_code: 'MX',
    country: 'Mexico',
    continent: 'North America',
    latitude: 19.4326,
    longitude: -99.1332,
    timezone: 'America/Mexico_City',
  },
  {
    slug: 'oslo',
    name: 'Oslo',
    country_code: 'NO',
    country: 'Norway',
    continent: 'Europe',
    latitude: 59.9139,
    longitude: 10.7522,
    timezone: 'Europe/Oslo',
  },
  {
    slug: 'jerusalem',
    name: 'Jerusalem',
    country_code: 'IL',
    country: 'Israel',
    continent: 'Asia',
    latitude: 31.7683,
    longitude: 35.2137,
    timezone: 'Asia/Jerusalem',
  },
];
