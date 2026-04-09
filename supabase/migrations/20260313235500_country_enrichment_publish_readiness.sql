-- SeasonScout Phase 10.6 country enrichment and publish-readiness support
-- Assumptions:
-- 1. Countries are enriched on the backend, one country or a very small curated batch at a time.
-- 2. Country hero imagery should retain source metadata in the database for future attribution support.
-- 3. Country pages stay unpublished until required stored enrichment fields are present.

alter table public.countries
  add column if not exists hero_image_source_name text,
  add column if not exists hero_image_source_url text,
  add column if not exists hero_image_attribution_name text,
  add column if not exists hero_image_attribution_url text,
  add column if not exists enrichment_status text not null default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'countries_enrichment_status_valid'
      and conrelid = 'public.countries'::regclass
  ) then
    alter table public.countries
      add constraint countries_enrichment_status_valid
      check (enrichment_status in ('pending', 'enriching', 'enriched', 'failed'));
  end if;
end;
$$;

update public.countries
set enrichment_status = case
  when coalesce(nullif(btrim(summary), ''), null) is not null
    and coalesce(nullif(btrim(hero_image_url), ''), null) is not null
    and coalesce(nullif(btrim(seasonal_overview), ''), null) is not null
  then 'enriched'
  else 'pending'
end;

comment on column public.countries.enrichment_status
is 'Backend-owned country enrichment workflow status. Pending countries are eligible for backend summary/image/overview enrichment, enriching countries are in-flight, enriched countries have the minimum stored presentation fields, and failed countries need backend retry or review.';

create index if not exists countries_enrichment_status_idx
  on public.countries (enrichment_status, updated_at desc);

create table if not exists public.country_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code) on update cascade on delete cascade,
  ingestion_run_id uuid not null references public.ingestion_runs(id) on update cascade on delete cascade,
  source_name text not null,
  external_id text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint country_source_snapshots_source_name_not_blank
    check (char_length(btrim(source_name)) > 0),
  constraint country_source_snapshots_external_id_not_blank
    check (external_id is null or char_length(btrim(external_id)) > 0)
);

comment on table public.country_source_snapshots
is 'Trace table for normalized country source payloads captured during backend country enrichment runs.';

create index if not exists country_source_snapshots_country_created_at_idx
  on public.country_source_snapshots (country_code, created_at desc);

create index if not exists country_source_snapshots_ingestion_run_id_idx
  on public.country_source_snapshots (ingestion_run_id);

alter table public.country_source_snapshots enable row level security;
alter table public.country_source_snapshots force row level security;

create or replace function public.refresh_country_publish_readiness(p_country_code text)
returns table(is_published boolean, missing_requirements text[])
language plpgsql
as $$
declare
  v_country public.countries%rowtype;
  v_missing_requirements text[] := '{}'::text[];
  v_is_published boolean := false;
begin
  select *
  into v_country
  from public.countries
  where code = p_country_code;

  if not found then
    raise exception 'Country not found for publish readiness refresh: %', p_country_code;
  end if;

  if coalesce(nullif(btrim(v_country.summary), ''), null) is null then
    v_missing_requirements := array_append(v_missing_requirements, 'summary');
  end if;

  if coalesce(nullif(btrim(v_country.hero_image_url), ''), null) is null then
    v_missing_requirements := array_append(v_missing_requirements, 'hero_image_url');
  end if;

  if coalesce(nullif(btrim(v_country.seasonal_overview), ''), null) is null then
    v_missing_requirements := array_append(v_missing_requirements, 'seasonal_overview');
  end if;

  if v_country.enrichment_status <> 'enriched' then
    v_missing_requirements := array_append(v_missing_requirements, 'enrichment_complete');
  end if;

  v_is_published := coalesce(array_length(v_missing_requirements, 1), 0) = 0;

  update public.countries
  set is_published = v_is_published
  where code = p_country_code;

  return query
  select v_is_published, coalesce(v_missing_requirements, '{}'::text[]);
end;
$$;

comment on function public.refresh_country_publish_readiness(text)
is 'Recomputes whether a country is public-ready from backend-owned summary, hero image, and qualitative seasonal overview fields. Countries remain unpublished until the minimum stored country experience is complete.';

do $$
declare
  v_country record;
begin
  for v_country in
    select code
    from public.countries
  loop
    perform public.refresh_country_publish_readiness(v_country.code);
  end loop;
end;
$$;
