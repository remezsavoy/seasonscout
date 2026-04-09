-- SeasonScout Phase 10.8 country editorial enrichment metadata support
-- Adds backend-owned metadata and timestamp storage for the new prompt-driven country editorial pipeline.

alter table public.countries
  add column if not exists enrichment_metadata jsonb not null default '{}'::jsonb,
  add column if not exists last_enriched_at timestamptz;

comment on column public.countries.enrichment_metadata
is 'Structured backend metadata for country enrichment runs, including prompt asset hashes, model details, image strategy, selected hero-image query, failure diagnostics, and other audit-friendly debug data.';

comment on column public.countries.last_enriched_at
is 'Timestamp of the most recent successful country editorial content refresh.';

create index if not exists countries_last_enriched_at_idx
  on public.countries (last_enriched_at desc nulls last);
