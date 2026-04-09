-- SeasonScout Phase 10.6 curated seed ingestion support
-- Assumptions:
-- 1. Curated destination seed imports should leave frontend routes untouched and run entirely through backend workflows.
-- 2. Future climate imports need an explicit backend-owned destination status so imports can run per destination.
-- 3. Existing destinations with stored monthly climate should be treated as already imported.

alter table public.destinations
  add column if not exists climate_import_status text not null default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'destinations_climate_import_status_valid'
      and conrelid = 'public.destinations'::regclass
  ) then
    alter table public.destinations
      add constraint destinations_climate_import_status_valid
      check (climate_import_status in ('pending', 'imported', 'failed'));
  end if;
end;
$$;

update public.destinations as destination
set climate_import_status = case
  when exists (
    select 1
    from public.monthly_climate as climate
    where climate.destination_id = destination.id
  ) then 'imported'
  else 'pending'
end;

comment on column public.destinations.climate_import_status
is 'Backend-owned monthly climate ingestion status. Curated seed imports start as pending until climate rows are imported server-side.';

create index if not exists destinations_climate_import_status_idx
  on public.destinations (climate_import_status, updated_at desc);
