-- SeasonScout Phase 10.9 hero image attribution support
-- Assumptions:
-- 1. Hero image attribution must be stored on the destination record so the frontend can render a prepared credit line.
-- 2. Existing Unsplash snapshots already contain enough attribution metadata to backfill many current destinations.
-- 3. Attribution metadata should be provider-agnostic enough to support future non-Unsplash image sources.

alter table public.destinations
  add column if not exists hero_image_source_name text,
  add column if not exists hero_image_source_url text,
  add column if not exists hero_image_attribution_name text,
  add column if not exists hero_image_attribution_url text;

comment on column public.destinations.hero_image_source_name
is 'Backend-stored hero image provider label, such as Unsplash, used for public attribution rendering.';

comment on column public.destinations.hero_image_source_url
is 'Backend-stored hero image source page URL used for public attribution rendering.';

comment on column public.destinations.hero_image_attribution_name
is 'Backend-stored photographer or creator name used for public hero image attribution.';

comment on column public.destinations.hero_image_attribution_url
is 'Backend-stored photographer or creator profile URL used for public hero image attribution.';

with latest_unsplash_snapshot as (
  select distinct on (snapshot.destination_id)
    snapshot.destination_id,
    snapshot.payload
  from public.destination_source_snapshots as snapshot
  where snapshot.source_name = 'unsplash_photo'
  order by snapshot.destination_id, snapshot.created_at desc
)
update public.destinations as destination
set
  hero_image_source_name = coalesce(
    destination.hero_image_source_name,
    nullif(latest_unsplash_snapshot.payload #>> '{selected_photo,attribution_source_name}', ''),
    'Unsplash'
  ),
  hero_image_source_url = coalesce(
    destination.hero_image_source_url,
    nullif(latest_unsplash_snapshot.payload #>> '{selected_photo,attribution_source_url}', ''),
    nullif(latest_unsplash_snapshot.payload #>> '{selected_photo,photo_page_url}', '')
  ),
  hero_image_attribution_name = coalesce(
    destination.hero_image_attribution_name,
    nullif(latest_unsplash_snapshot.payload #>> '{selected_photo,photographer_name}', '')
  ),
  hero_image_attribution_url = coalesce(
    destination.hero_image_attribution_url,
    nullif(latest_unsplash_snapshot.payload #>> '{selected_photo,photographer_profile_url}', '')
  )
from latest_unsplash_snapshot
where destination.id = latest_unsplash_snapshot.destination_id
  and (
    destination.hero_image_source_name is null
    or destination.hero_image_source_url is null
    or destination.hero_image_attribution_name is null
    or destination.hero_image_attribution_url is null
  );
