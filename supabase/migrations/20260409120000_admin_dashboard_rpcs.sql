-- SeasonScout admin dashboard RPCs
-- Assumptions:
-- 1. Any authenticated user can access admin dashboard reads and mutations for now.
-- 2. These functions intentionally bypass public RLS so unpublished catalog records can be reviewed in-app.
-- 3. Audit rows in ingestion_runs should remain after deletes; only country- and destination-linked records are removed.

create or replace function public.admin_get_all_countries()
returns table(
  code text,
  slug text,
  name text,
  continent text,
  summary text,
  hero_image_url text,
  seasonal_overview text,
  is_published boolean,
  enrichment_status text,
  last_enriched_at timestamptz,
  destination_count integer,
  published_destination_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Admin access requires an authenticated user.';
  end if;

  return query
  select
    country.code,
    country.slug,
    country.name,
    country.continent,
    country.summary,
    country.hero_image_url,
    country.seasonal_overview,
    country.is_published,
    country.enrichment_status,
    country.last_enriched_at,
    count(destination.id)::integer as destination_count,
    count(*) filter (where destination.is_published)::integer as published_destination_count,
    country.created_at,
    country.updated_at
  from public.countries as country
  left join public.destinations as destination
    on destination.country_code = country.code
  group by
    country.code,
    country.slug,
    country.name,
    country.continent,
    country.summary,
    country.hero_image_url,
    country.seasonal_overview,
    country.is_published,
    country.enrichment_status,
    country.last_enriched_at,
    country.created_at,
    country.updated_at
  order by country.last_enriched_at desc nulls last, country.name asc;
end;
$$;

comment on function public.admin_get_all_countries()
is 'Authenticated admin read for all countries with destination counts, bypassing public RLS so unpublished catalog records remain visible.';

create or replace function public.admin_get_all_destinations()
returns table(
  id uuid,
  slug text,
  name text,
  country text,
  country_code text,
  hero_image_url text,
  best_months smallint[],
  travel_tags text[],
  enrichment_status text,
  climate_import_status text,
  is_published boolean,
  comfort_score numeric(5, 2),
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Admin access requires an authenticated user.';
  end if;

  return query
  with climate_scores as (
    select
      monthly.destination_id,
      avg(monthly.comfort_score)::numeric(5, 2) as comfort_score
    from public.monthly_climate as monthly
    group by monthly.destination_id
  )
  select
    destination.id,
    destination.slug,
    destination.name,
    destination.country,
    destination.country_code,
    destination.hero_image_url,
    destination.best_months,
    destination.travel_tags,
    destination.enrichment_status,
    destination.climate_import_status,
    destination.is_published,
    climate_scores.comfort_score,
    destination.updated_at
  from public.destinations as destination
  left join climate_scores
    on climate_scores.destination_id = destination.id
  order by destination.country asc, destination.name asc;
end;
$$;

comment on function public.admin_get_all_destinations()
is 'Authenticated admin read for all destinations with enrichment, climate import, and comfort-score coverage, bypassing public RLS.';

create or replace function public.admin_delete_country(p_country_code text)
returns table(country_code text, deleted_destination_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_code text := upper(trim(p_country_code));
  v_destination_ids uuid[];
  v_deleted_destination_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Admin access requires an authenticated user.';
  end if;

  if v_country_code is null or v_country_code = '' then
    raise exception 'Country code is required.';
  end if;

  if not exists (
    select 1
    from public.countries
    where code = v_country_code
  ) then
    raise exception 'Country not found for admin delete: %', v_country_code;
  end if;

  select coalesce(array_agg(destination.id), '{}'::uuid[])
  into v_destination_ids
  from public.destinations as destination
  where destination.country_code = v_country_code;

  v_deleted_destination_count := coalesce(array_length(v_destination_ids, 1), 0);

  if v_deleted_destination_count > 0 then
    delete from public.favorites
    where destination_id = any(v_destination_ids);

    delete from public.monthly_climate
    where destination_id = any(v_destination_ids);

    delete from public.destination_source_snapshots
    where destination_id = any(v_destination_ids);

    delete from public.climate_source_snapshots
    where destination_id = any(v_destination_ids);
  end if;

  delete from public.country_featured_destinations
  where country_code = v_country_code;

  delete from public.destinations
  where country_code = v_country_code;

  delete from public.country_source_snapshots
  where country_code = v_country_code;

  delete from public.countries
  where code = v_country_code;

  return query
  select v_country_code, v_deleted_destination_count;
end;
$$;

comment on function public.admin_delete_country(text)
is 'Authenticated admin mutation that removes one country and all linked destinations, climate rows, favorites, and source snapshots while leaving ingestion run audit rows intact.';

revoke all on function public.admin_get_all_countries() from public;
revoke all on function public.admin_get_all_destinations() from public;
revoke all on function public.admin_delete_country(text) from public;

grant execute on function public.admin_get_all_countries() to authenticated;
grant execute on function public.admin_get_all_destinations() to authenticated;
grant execute on function public.admin_delete_country(text) to authenticated;
