export function buildHeroImageAttribution(record) {
  const photographerName =
    typeof record?.hero_image_attribution_name === 'string'
      ? record.hero_image_attribution_name.trim()
      : '';
  const photographerUrl =
    typeof record?.hero_image_attribution_url === 'string'
      ? record.hero_image_attribution_url.trim()
      : '';
  const sourceName =
    typeof record?.hero_image_source_name === 'string'
      ? record.hero_image_source_name.trim()
      : '';
  const sourceUrl =
    typeof record?.hero_image_source_url === 'string'
      ? record.hero_image_source_url.trim()
      : '';

  if (!photographerName || !photographerUrl || !sourceName || !sourceUrl) {
    return null;
  }

  return {
    photographerName,
    photographerUrl,
    sourceName,
    sourceUrl,
  };
}
