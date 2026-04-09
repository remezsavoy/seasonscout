-- SeasonScout Phase 10.5 schema expansion
-- Assumptions:
-- 1. Countries become first-class records for future country pages and curated destination grouping.
-- 2. Ingestion metadata remains backend-only and must stay inaccessible to browser clients.
-- 3. Existing destinations may predate countries, so country rows are backfilled before foreign-key enforcement.

create table if not exists public.countries (
  code text primary key,
  slug text not null unique,
  name text not null,
  continent text,
  summary text,
  hero_image_url text,
  seasonal_overview text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint countries_code_format
    check (code ~ '^[A-Z]{2}$'),
  constraint countries_slug_format
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint countries_name_not_blank
    check (char_length(btrim(name)) > 0)
);

comment on table public.countries
is 'Country-level editorial metadata used by future country pages and curated country browsing flows.';

comment on column public.countries.code
is 'Canonical ISO 3166-1 alpha-2 identifier used to link destinations to country pages.';

comment on column public.countries.is_published
is 'Controls public visibility for future country routes. Keep false until editorial content is ready.';

create index if not exists countries_public_name_search_idx
  on public.countries using gin (lower(name) gin_trgm_ops)
  where is_published;

drop trigger if exists set_countries_updated_at on public.countries;

create trigger set_countries_updated_at
before update on public.countries
for each row
execute function public.set_updated_at();

with normalized_countries as (
  select distinct on (destination.country_code)
    destination.country_code as code,
    coalesce(
      nullif(
        lower(
          regexp_replace(
            regexp_replace(btrim(destination.country), '[^a-zA-Z0-9]+', '-', 'g'),
            '(^-+|-+$)',
            '',
            'g'
          )
        ),
        ''
      ),
      lower(destination.country_code)
    ) as base_slug,
    destination.country as name,
    destination.continent
  from public.destinations as destination
  order by destination.country_code, destination.is_published desc, destination.updated_at desc, destination.created_at desc
),
resolved_countries as (
  select
    code,
    case
      when count(*) over (partition by base_slug) = 1 then base_slug
      else base_slug || '-' || lower(code)
    end as slug,
    name,
    continent
  from normalized_countries
)
insert into public.countries (code, slug, name, continent, is_published)
select code, slug, name, continent, false
from resolved_countries
on conflict (code) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'destinations_country_code_fkey'
      and conrelid = 'public.destinations'::regclass
  ) then
    alter table public.destinations
      add constraint destinations_country_code_fkey
      foreign key (country_code)
      references public.countries(code)
      on update cascade
      on delete restrict;
  end if;
end;
$$;

create unique index if not exists destinations_country_code_id_key
  on public.destinations (country_code, id);

create index if not exists destinations_public_country_name_idx
  on public.destinations (country_code, name)
  where is_published;

create table if not exists public.country_featured_destinations (
  country_code text not null,
  destination_id uuid not null,
  rank smallint not null,
  created_at timestamptz not null default now(),
  constraint country_featured_destinations_pkey
    primary key (country_code, destination_id),
  constraint country_featured_destinations_country_code_fkey
    foreign key (country_code)
    references public.countries(code)
    on update cascade
    on delete cascade,
  constraint country_featured_destinations_destination_country_fkey
    foreign key (country_code, destination_id)
    references public.destinations(country_code, id)
    on update cascade
    on delete cascade,
  constraint country_featured_destinations_rank_positive
    check (rank > 0)
);

comment on table public.country_featured_destinations
is 'Curated destination ordering for country pages. The composite foreign key guarantees the destination belongs to the same country.';

create unique index if not exists country_featured_destinations_country_rank_key
  on public.country_featured_destinations (country_code, rank);

create index if not exists country_featured_destinations_destination_id_idx
  on public.country_featured_destinations (destination_id);

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  pipeline_name text not null,
  source_name text not null,
  source_version text,
  status text not null default 'pending',
  records_seen integer not null default 0,
  records_written integer not null default 0,
  records_failed integer not null default 0,
  error_summary text,
  metadata jsonb not null default '{}'::jsonb,
  triggered_by uuid references auth.users(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  constraint ingestion_runs_pipeline_name_not_blank
    check (char_length(btrim(pipeline_name)) > 0),
  constraint ingestion_runs_source_name_not_blank
    check (char_length(btrim(source_name)) > 0),
  constraint ingestion_runs_status_valid
    check (status in ('pending', 'running', 'succeeded', 'failed', 'partial')),
  constraint ingestion_runs_counts_non_negative
    check (records_seen >= 0 and records_written >= 0 and records_failed >= 0),
  constraint ingestion_runs_metadata_is_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint ingestion_runs_finished_after_started
    check (finished_at is null or (started_at is not null and finished_at >= started_at))
);

comment on table public.ingestion_runs
is 'Backend-only audit log for destination, climate, and enrichment ingestion workflows.';

comment on column public.ingestion_runs.metadata
is 'Pipeline-specific structured metadata such as batch identifiers, file names, or dry-run flags.';

create index if not exists ingestion_runs_pipeline_created_at_idx
  on public.ingestion_runs (pipeline_name, created_at desc);

create index if not exists ingestion_runs_status_created_at_idx
  on public.ingestion_runs (status, created_at desc);

drop trigger if exists set_ingestion_runs_updated_at on public.ingestion_runs;

create trigger set_ingestion_runs_updated_at
before update on public.ingestion_runs
for each row
execute function public.set_updated_at();

create table if not exists public.destination_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on update cascade on delete cascade,
  ingestion_run_id uuid not null references public.ingestion_runs(id) on update cascade on delete cascade,
  source_name text not null,
  external_id text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint destination_source_snapshots_source_name_not_blank
    check (char_length(btrim(source_name)) > 0),
  constraint destination_source_snapshots_external_id_not_blank
    check (external_id is null or char_length(btrim(external_id)) > 0)
);

comment on table public.destination_source_snapshots
is 'Trace table for normalized destination source payloads captured during backend ingestion or enrichment runs.';

create index if not exists destination_source_snapshots_destination_created_at_idx
  on public.destination_source_snapshots (destination_id, created_at desc);

create index if not exists destination_source_snapshots_ingestion_run_id_idx
  on public.destination_source_snapshots (ingestion_run_id);

create table if not exists public.climate_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on update cascade on delete cascade,
  ingestion_run_id uuid not null references public.ingestion_runs(id) on update cascade on delete cascade,
  source_name text not null,
  source_period text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint climate_source_snapshots_source_name_not_blank
    check (char_length(btrim(source_name)) > 0),
  constraint climate_source_snapshots_source_period_not_blank
    check (source_period is null or char_length(btrim(source_period)) > 0)
);

comment on table public.climate_source_snapshots
is 'Trace table for normalized monthly climate payloads captured during backend climate imports.';

create index if not exists climate_source_snapshots_destination_created_at_idx
  on public.climate_source_snapshots (destination_id, created_at desc);

create index if not exists climate_source_snapshots_ingestion_run_id_idx
  on public.climate_source_snapshots (ingestion_run_id);

alter table public.countries enable row level security;
alter table public.countries force row level security;

alter table public.country_featured_destinations enable row level security;
alter table public.country_featured_destinations force row level security;

alter table public.ingestion_runs enable row level security;
alter table public.ingestion_runs force row level security;

alter table public.destination_source_snapshots enable row level security;
alter table public.destination_source_snapshots force row level security;

alter table public.climate_source_snapshots enable row level security;
alter table public.climate_source_snapshots force row level security;

drop policy if exists "Public countries are readable" on public.countries;
create policy "Public countries are readable"
on public.countries
for select
to anon, authenticated
using (is_published);

drop policy if exists "Public country featured destinations are readable" on public.country_featured_destinations;
create policy "Public country featured destinations are readable"
on public.country_featured_destinations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.countries
    where countries.code = country_featured_destinations.country_code
      and countries.is_published
  )
  and exists (
    select 1
    from public.destinations
    where destinations.id = country_featured_destinations.destination_id
      and destinations.country_code = country_featured_destinations.country_code
      and destinations.is_published
  )
);
