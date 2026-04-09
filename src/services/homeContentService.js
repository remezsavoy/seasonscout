import { hasSupabaseClient } from '../lib/supabaseClient';
import { fetchSiteContentRowByKey } from './homeContentDataSource';
import { homeHeroContentFallback } from './mockData';

const HOME_HERO_CONTENT_KEY = 'home-hero';

function normalizeOptionalText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function mapHomeHeroContentRow(row) {
  const content = row?.content && typeof row.content === 'object' && !Array.isArray(row.content)
    ? row.content
    : {};

  const heroImageUrl = normalizeOptionalText(content.hero_image_url);

  if (!heroImageUrl) {
    return homeHeroContentFallback;
  }

  return {
    heroImageUrl,
    heroImageSourceName: normalizeOptionalText(content.hero_image_source_name),
    heroImageSourceUrl: normalizeOptionalText(content.hero_image_source_url),
    heroImageAttributionName: normalizeOptionalText(content.hero_image_attribution_name),
    heroImageAttributionUrl: normalizeOptionalText(content.hero_image_attribution_url),
    heroImageLocationLabel: normalizeOptionalText(content.hero_image_location_label),
  };
}

export const homeContentService = {
  async getHomeHeroContent() {
    if (!hasSupabaseClient()) {
      return homeHeroContentFallback;
    }

    try {
      const row = await fetchSiteContentRowByKey(HOME_HERO_CONTENT_KEY);

      if (!row) {
        return homeHeroContentFallback;
      }

      return mapHomeHeroContentRow(row);
    } catch {
      return homeHeroContentFallback;
    }
  },
};
