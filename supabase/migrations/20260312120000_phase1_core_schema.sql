-- SeasonScout Phase 1 core schema
-- Assumptions:
-- 1. Destination and climate rows are curated by trusted backend processes or admins, not by browser clients.
-- 2. Public app clients may read destination and climate data, but user-owned data stays behind RLS.
-- 3. Recommended months are stored as a cacheable backend-owned field and should not be recomputed in React.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at()
is 'Generic trigger helper for tables that maintain an updated_at column.';

create or replace function public.set_last_updated()
returns trigger
language plpgsql
as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

comment on function public.set_last_updated()
is 'Trigger helper for climate rows that track source refresh time in last_updated.';

create or replace function public.is_valid_month_list(months smallint[])
returns boolean
language sql
immutable
as $$
  select
    months is not null
    and coalesce(array_length(months, 1), 0) <= 12
    and months = coalesce(
      (
        select array_agg(month_value order by month_value)
        from (
          select distinct month_value
          from unnest(months) as month_value
          where month_value between 1 and 12
        ) valid_months
      ),
      '{}'::smallint[]
    );
$$;

comment on function public.is_valid_month_list(smallint[])
is 'Validates that month arrays are unique, sorted ascending, and restricted to values 1 through 12.';

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null,
  country_code text not null,
  continent text,
  latitude numeric(8, 5) not null,
  longitude numeric(8, 5) not null,
  timezone text not null,
  summary text,
  hero_image_url text,
  is_published boolean not null default false,
  featured_rank smallint,
  best_months smallint[] not null default '{}'::smallint[],
  travel_tags text[] not null default '{}'::text[],
  seasonal_insight text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint destinations_slug_format
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint destinations_country_code_format
    check (country_code ~ '^[A-Z]{2}$'),
  constraint destinations_name_not_blank
    check (char_length(btrim(name)) > 0),
  constraint destinations_country_not_blank
    check (char_length(btrim(country)) > 0),
  constraint destinations_timezone_not_blank
    check (char_length(btrim(timezone)) > 0),
  constraint destinations_latitude_range
    check (latitude between -90 and 90),
  constraint destinations_longitude_range
    check (longitude between -180 and 180),
  constraint destinations_featured_rank_positive
    check (featured_rank is null or featured_rank > 0),
  constraint destinations_best_months_valid
    check (public.is_valid_month_list(best_months))
);

comment on table public.destinations
is 'Stable destination metadata used by search and destination detail pages.';

comment on column public.destinations.slug
is 'Public route identifier. Stored lowercase to keep URL generation and lookup deterministic.';

comment on column public.destinations.best_months
is 'Backend-owned cache of recommended visit months. Populate directly or derive from monthly_climate via RPC.';

comment on column public.destinations.is_published
is 'Controls public visibility. Unpublished destinations remain hidden from anon/authenticated clients under RLS.';

comment on column public.destinations.featured_rank
is 'Optional Phase 1 home-page ordering. Null means the destination is not part of the featured set.';

comment on column public.destinations.travel_tags
is 'Lightweight discovery tags. Keep the set curated server-side to avoid noisy client-authored metadata.';

create index if not exists destinations_public_name_search_idx
  on public.destinations using gin (lower(name) gin_trgm_ops)
  where is_published;

create index if not exists destinations_public_featured_rank_idx
  on public.destinations (featured_rank)
  where is_published and featured_rank is not null;

drop trigger if exists set_destinations_updated_at on public.destinations;

create trigger set_destinations_updated_at
before update on public.destinations
for each row
execute function public.set_updated_at();

create table if not exists public.monthly_climate (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on update cascade on delete cascade,
  month smallint not null,
  avg_high_c numeric(5, 2) not null,
  avg_low_c numeric(5, 2) not null,
  avg_precip_mm numeric(7, 2),
  avg_humidity numeric(5, 2),
  sunshine_hours numeric(5, 2),
  comfort_score numeric(5, 2),
  recommendation_label text,
  source text not null default 'manual_seed',
  last_updated timestamptz not null default now(),
  constraint monthly_climate_destination_month_key
    unique (destination_id, month),
  constraint monthly_climate_month_valid
    check (month between 1 and 12),
  constraint monthly_climate_temperature_order
    check (avg_high_c >= avg_low_c),
  constraint monthly_climate_precip_non_negative
    check (avg_precip_mm is null or avg_precip_mm >= 0),
  constraint monthly_climate_humidity_range
    check (avg_humidity is null or avg_humidity between 0 and 100),
  constraint monthly_climate_sunshine_non_negative
    check (sunshine_hours is null or sunshine_hours >= 0),
  constraint monthly_climate_comfort_score_range
    check (comfort_score is null or comfort_score between 0 and 100),
  constraint monthly_climate_source_not_blank
    check (char_length(btrim(source)) > 0),
  constraint monthly_climate_recommendation_label_valid
    check (
      recommendation_label is null
      or recommendation_label in ('Ideal', 'Good', 'Okay', 'Avoid')
    )
);

comment on table public.monthly_climate
is 'One curated climate row per destination and month. This table is the source of truth for future scoring and best-month RPCs.';

comment on column public.monthly_climate.source
is 'Origin of the climate row, such as manual_seed, import job, or external normalization pipeline.';

comment on column public.monthly_climate.comfort_score
is 'Optional backend-computed score reserved for SQL logic. Do not derive or persist this in frontend code.';

drop trigger if exists set_monthly_climate_last_updated on public.monthly_climate;

create trigger set_monthly_climate_last_updated
before update on public.monthly_climate
for each row
execute function public.set_last_updated();

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on update cascade on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (
      display_name is null
      or char_length(btrim(display_name)) between 2 and 80
    )
);

comment on table public.profiles
is 'App profile metadata that mirrors Supabase Auth users and is initially owner-readable only.';

comment on column public.profiles.id
is 'Matches auth.users.id exactly so ownership and joins stay backend-enforced.';

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user()
is 'Creates a matching profile row when a Supabase Auth user is created.';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on update cascade on delete cascade,
  destination_id uuid not null references public.destinations(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_destination_key
    unique (user_id, destination_id)
);

comment on table public.favorites
is 'User-owned saved destinations. Duplicate prevention is enforced by a unique constraint rather than frontend checks.';

create index if not exists favorites_destination_id_idx
  on public.favorites (destination_id);

alter table public.destinations enable row level security;
alter table public.destinations force row level security;

alter table public.monthly_climate enable row level security;
alter table public.monthly_climate force row level security;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

alter table public.favorites enable row level security;
alter table public.favorites force row level security;

drop policy if exists "Public destinations are readable" on public.destinations;
create policy "Public destinations are readable"
on public.destinations
for select
to anon, authenticated
using (is_published);

drop policy if exists "Public monthly climate is readable" on public.monthly_climate;
create policy "Public monthly climate is readable"
on public.monthly_climate
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.destinations
    where destinations.id = monthly_climate.destination_id
      and destinations.is_published
  )
);

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can view own favorites" on public.favorites;
create policy "Users can view own favorites"
on public.favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can add own favorites" on public.favorites;
create policy "Users can add own favorites"
on public.favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can remove own favorites" on public.favorites;
create policy "Users can remove own favorites"
on public.favorites
for delete
to authenticated
using (auth.uid() = user_id);

-- Candidate RPC endpoints for the next database migration:
--
-- 1. public.get_destination_full(p_slug text)
--    Suggested return: jsonb
--    Purpose: one backend-shaped payload containing destination metadata, ordered monthly_climate rows,
--    cached best_months, and auth-aware favorite state so the frontend does not orchestrate multiple joins.
--
-- 2. public.toggle_favorite(p_destination_id uuid)
--    Suggested return: table (destination_id uuid, is_favorited boolean)
--    Purpose: server-side insert/delete toggle that relies on auth.uid() and favorites_user_destination_key
--    to guarantee idempotent writes even if the UI retries.
--
-- 3. public.compute_best_months(p_destination_id uuid)
--    Suggested return: table (month smallint, comfort_score numeric, recommendation_label text)
--    Alternative return: smallint[]
--    Purpose: centralize future score thresholds, tie-breaking, and seasonal heuristics so month-ranking
--    behavior stays consistent across destination pages, search ranking, and recommendations.
