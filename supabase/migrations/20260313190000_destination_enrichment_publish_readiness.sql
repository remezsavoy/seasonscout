-- SeasonScout Phase 10.8 destination enrichment and publish-readiness support
-- Assumptions:
-- 1. Imported destinations stay unpublished until backend enrichment fills the minimum destination experience fields.
-- 2. Enrichment runs may be pending, in-flight, completed, or failed independently of climate imports.
-- 3. Publication rules should be enforced in Postgres so Edge Functions update one helper instead of duplicating checks.

alter table public.destinations
  add column if not exists enrichment_status text not null default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'destinations_enrichment_status_valid'
      and conrelid = 'public.destinations'::regclass
  ) then
    alter table public.destinations
      add constraint destinations_enrichment_status_valid
      check (enrichment_status in ('pending', 'enriching', 'enriched', 'failed'));
  end if;
end;
$$;

update public.destinations
set enrichment_status = case
  when coalesce(nullif(btrim(summary), ''), null) is not null
    and coalesce(nullif(btrim(hero_image_url), ''), null) is not null
    and coalesce(array_length(travel_tags, 1), 0) > 0
    and coalesce(nullif(btrim(seasonal_insight), ''), null) is not null
  then 'enriched'
  else 'pending'
end;

comment on column public.destinations.enrichment_status
is 'Backend-owned destination enrichment workflow status. Pending destinations are eligible for backend summary/image enrichment, enriching destinations are in-flight, enriched destinations have the minimum presentation fields stored, and failed destinations need backend retry or review.';

create index if not exists destinations_enrichment_status_idx
  on public.destinations (enrichment_status, updated_at desc);

create or replace function public.refresh_destination_publish_readiness(p_destination_id uuid)
returns table(is_published boolean, missing_requirements text[], climate_row_count integer)
language plpgsql
as $$
declare
  v_destination public.destinations%rowtype;
  v_missing_requirements text[] := '{}'::text[];
  v_climate_row_count integer := 0;
  v_is_published boolean := false;
begin
  select *
  into v_destination
  from public.destinations
  where id = p_destination_id;

  if not found then
    raise exception 'Destination not found for publish readiness refresh: %', p_destination_id;
  end if;

  select count(*)
  into v_climate_row_count
  from public.monthly_climate
  where destination_id = p_destination_id;

  if v_destination.climate_import_status <> 'imported' then
    v_missing_requirements := array_append(v_missing_requirements, 'climate_imported');
  end if;

  if v_climate_row_count <> 12 then
    v_missing_requirements := array_append(v_missing_requirements, 'monthly_climate_12_rows');
  end if;

  if coalesce(array_length(v_destination.best_months, 1), 0) = 0 then
    v_missing_requirements := array_append(v_missing_requirements, 'best_months');
  end if;

  if coalesce(nullif(btrim(v_destination.summary), ''), null) is null then
    v_missing_requirements := array_append(v_missing_requirements, 'summary');
  end if;

  if coalesce(nullif(btrim(v_destination.hero_image_url), ''), null) is null then
    v_missing_requirements := array_append(v_missing_requirements, 'hero_image_url');
  end if;

  if coalesce(array_length(v_destination.travel_tags, 1), 0) = 0 then
    v_missing_requirements := array_append(v_missing_requirements, 'travel_tags');
  end if;

  if coalesce(nullif(btrim(v_destination.seasonal_insight), ''), null) is null then
    v_missing_requirements := array_append(v_missing_requirements, 'seasonal_insight');
  end if;

  if v_destination.enrichment_status <> 'enriched' then
    v_missing_requirements := array_append(v_missing_requirements, 'enrichment_complete');
  end if;

  v_is_published := coalesce(array_length(v_missing_requirements, 1), 0) = 0;

  update public.destinations
  set is_published = v_is_published
  where id = p_destination_id;

  return query
  select v_is_published, coalesce(v_missing_requirements, '{}'::text[]), v_climate_row_count;
end;
$$;

comment on function public.refresh_destination_publish_readiness(uuid)
is 'Recomputes whether a destination is public-ready from backend-owned climate completeness, cached best months, and enrichment fields. Destinations remain unpublished until the minimum experience fields are stored.';

do $$
declare
  v_destination record;
begin
  for v_destination in
    select id
    from public.destinations
  loop
    perform public.refresh_destination_publish_readiness(v_destination.id);
  end loop;
end;
$$;
