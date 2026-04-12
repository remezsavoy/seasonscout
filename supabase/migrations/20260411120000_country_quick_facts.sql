alter table public.countries
  add column if not exists quick_facts jsonb not null default '{}'::jsonb;

comment on column public.countries.quick_facts
is 'Backend-owned quick facts sourced from REST Countries for lightweight country metadata display.';
