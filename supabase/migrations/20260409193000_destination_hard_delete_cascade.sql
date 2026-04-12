alter table public.monthly_climate
  drop constraint if exists monthly_climate_destination_id_fkey;

alter table public.monthly_climate
  add constraint monthly_climate_destination_id_fkey
  foreign key (destination_id)
  references public.destinations(id)
  on update cascade
  on delete cascade;

alter table public.favorites
  drop constraint if exists favorites_destination_id_fkey;

alter table public.favorites
  add constraint favorites_destination_id_fkey
  foreign key (destination_id)
  references public.destinations(id)
  on update cascade
  on delete cascade;

alter table public.destination_source_snapshots
  drop constraint if exists destination_source_snapshots_destination_id_fkey;

alter table public.destination_source_snapshots
  add constraint destination_source_snapshots_destination_id_fkey
  foreign key (destination_id)
  references public.destinations(id)
  on update cascade
  on delete cascade;

alter table public.country_featured_destinations
  drop constraint if exists country_featured_destinations_destination_country_fkey;

alter table public.country_featured_destinations
  add constraint country_featured_destinations_destination_country_fkey
  foreign key (country_code, destination_id)
  references public.destinations(country_code, id)
  on update cascade
  on delete cascade;

alter table public.climate_source_snapshots
  drop constraint if exists climate_source_snapshots_destination_id_fkey;

alter table public.climate_source_snapshots
  add constraint climate_source_snapshots_destination_id_fkey
  foreign key (destination_id)
  references public.destinations(id)
  on update cascade
  on delete cascade;

drop policy if exists "Authenticated admin tooling can delete destinations" on public.destinations;
create policy "Authenticated admin tooling can delete destinations"
on public.destinations
for delete
to authenticated
using (auth.uid() is not null);
