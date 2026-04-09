-- SeasonScout Phase 10.7 country summary metadata support
-- Adds structured metadata tracking for generated country summaries to support versioning, review status, and rollbacks.

alter table public.countries
  add column if not exists summary_metadata jsonb not null default '{}'::jsonb;

comment on column public.countries.summary_metadata
is 'Structured audit metadata for the country summary, including source version, review classification, and specific validation issues.';

create index if not exists countries_summary_metadata_source_version_idx
  on public.countries ((summary_metadata->>'source_version'));
