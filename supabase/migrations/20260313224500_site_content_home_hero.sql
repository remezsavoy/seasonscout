-- SeasonScout Phase 11.1 site content foundation for the Home hero
-- Assumptions:
-- 1. Home page hero media should be managed from the backend without coupling future content slots to code-only values.
-- 2. A flexible JSON content payload keeps the model small while allowing new Home hero fields later without another schema change.
-- 3. Public clients should only read published content slots.

create table if not exists public.site_content (
  key text primary key,
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_content_key_format
    check (key = lower(key) and key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint site_content_payload_is_object
    check (jsonb_typeof(content) = 'object')
);

comment on table public.site_content
is 'Backend-managed flexible content slots for app surfaces such as the Home hero.';

comment on column public.site_content.content
is 'Structured content payload for the slot. The Home hero currently reads image url and attribution fields from this object.';

drop trigger if exists set_site_content_updated_at on public.site_content;

create trigger set_site_content_updated_at
before update on public.site_content
for each row
execute function public.set_updated_at();

insert into public.site_content (key, content, is_published)
values (
  'home-hero',
  jsonb_build_object(
    'hero_image_url', null,
    'hero_image_source_name', null,
    'hero_image_source_url', null,
    'hero_image_attribution_name', null,
    'hero_image_attribution_url', null
  ),
  true
)
on conflict (key) do nothing;

alter table public.site_content enable row level security;
alter table public.site_content force row level security;

drop policy if exists "Published site content is readable" on public.site_content;
create policy "Published site content is readable"
on public.site_content
for select
to anon, authenticated
using (is_published);
