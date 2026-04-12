const UNSPLASH_SEARCH_API_URL = 'https://api.unsplash.com/search/photos';

type UnsplashSearchResponse = {
  results?: UnsplashPhoto[];
  total?: number;
  total_pages?: number;
};

export type UnsplashPhoto = {
  id: string;
  alt_description?: string | null;
  description?: string | null;
  urls?: {
    raw?: string;
    small?: string;
    thumb?: string;
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
  };
};

export type UnsplashHeroResult = {
  photoId: string;
  heroImageUrl: string;
  sourceName: string;
  sourceUrl: string | null;
  photographerName: string | null;
  photographerUrl: string | null;
  payload: Record<string, unknown>;
};

export type UnsplashSearchResult = {
  id: string;
  alt: string | null;
  description: string | null;
  previewUrl: string;
  heroImageUrl: string;
  photoPageUrl: string | null;
  photographerName: string | null;
  photographerUrl: string | null;
  sourceName: string;
  sourceUrl: string | null;
};

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function buildUnsplashHeroUrl(photo: UnsplashPhoto) {
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

export function buildUnsplashReferralUrl(value: string | null | undefined) {
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

function buildUnsplashPreviewUrl(photo: UnsplashPhoto) {
  return photo.urls?.small ?? photo.urls?.thumb ?? photo.urls?.regular ?? buildUnsplashHeroUrl(photo);
}

function mapUnsplashSearchResult(photo: UnsplashPhoto): UnsplashSearchResult {
  return {
    id: photo.id,
    alt: normalizeOptionalText(photo.alt_description),
    description: normalizeOptionalText(photo.description),
    previewUrl: buildUnsplashPreviewUrl(photo),
    heroImageUrl: buildUnsplashHeroUrl(photo),
    photoPageUrl: buildUnsplashReferralUrl(photo.links?.html ?? 'https://unsplash.com'),
    photographerName: normalizeOptionalText(photo.user?.name),
    photographerUrl: buildUnsplashReferralUrl(photo.user?.links?.html ?? null),
    sourceName: 'Unsplash',
    sourceUrl: buildUnsplashReferralUrl(photo.links?.html ?? 'https://unsplash.com'),
  };
}

export async function searchUnsplashPhotos(options: {
  query: string;
  unsplashAccessKey: string;
  perPage?: number;
}): Promise<UnsplashSearchResult[]> {
  const searchUrl = new URL(UNSPLASH_SEARCH_API_URL);
  searchUrl.searchParams.set('query', options.query);
  searchUrl.searchParams.set('orientation', 'landscape');
  searchUrl.searchParams.set('per_page', String(options.perPage ?? 9));
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
  return (payload.results ?? []).map(mapUnsplashSearchResult).filter((photo) => Boolean(photo.heroImageUrl));
}

export async function fetchUnsplashHero(options: {
  query: string;
  unsplashAccessKey: string;
  subjectLabel: string;
}): Promise<UnsplashHeroResult> {
  const searchResults = await searchUnsplashPhotos({
    query: options.query,
    unsplashAccessKey: options.unsplashAccessKey,
    perPage: 5,
  });
  const photo = searchResults[0];

  if (!photo) {
    throw new Error(`Unsplash returned no photos for ${options.subjectLabel} using query "${options.query}".`);
  }

  return {
    photoId: photo.id,
    heroImageUrl: photo.heroImageUrl,
    sourceName: photo.sourceName,
    sourceUrl: photo.sourceUrl,
    photographerName: photo.photographerName,
    photographerUrl: photo.photographerUrl,
    payload: {
      endpoint: UNSPLASH_SEARCH_API_URL,
      query: options.query,
      total: searchResults.length,
      total_pages: null,
      selected_photo: {
        id: photo.id,
        alt_description: photo.alt,
        description: photo.description,
        photo_page_url: photo.photoPageUrl,
        attribution_source_name: photo.sourceName,
        attribution_source_url: photo.sourceUrl,
        photographer_name: photo.photographerName,
        photographer_profile_url: photo.photographerUrl,
      },
    },
  };
}
