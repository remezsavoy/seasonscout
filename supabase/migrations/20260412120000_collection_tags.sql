-- Add collection_tags column to destinations and countries
-- collection_tags is a text array that categorizes locations into macro-categories like 'tropical-beach', 'city-break', etc.

alter table public.destinations
  add column collection_tags text[] not null default '{}'::text[];

comment on column public.destinations.collection_tags
is 'Macro-category tags for destinations (e.g., tropical-beach, city-break). Used for thematic browsing and collections.';

alter table public.countries
  add column collection_tags text[] not null default '{}'::text[];

comment on column public.countries.collection_tags
is 'Macro-category tags for countries. Used for thematic browsing and collections.';
