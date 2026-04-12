create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_name text not null,
  rating smallint not null,
  content text not null,
  visit_month smallint,
  status text not null default 'pending',
  country_id text references public.countries(code) on update cascade on delete cascade,
  destination_id uuid references public.destinations(id) on update cascade on delete cascade,
  constraint reviews_user_name_not_blank
    check (char_length(btrim(user_name)) between 2 and 80),
  constraint reviews_rating_range
    check (rating between 1 and 5),
  constraint reviews_content_not_blank
    check (char_length(btrim(content)) between 20 and 2000),
  constraint reviews_visit_month_valid
    check (visit_month is null or visit_month between 1 and 12),
  constraint reviews_status_valid
    check (status in ('pending', 'approved', 'rejected')),
  constraint reviews_single_target
    check (
      (country_id is not null and destination_id is null)
      or (country_id is null and destination_id is not null)
    )
);

comment on table public.reviews
is 'Traveler-submitted country and destination reviews that are moderated before public display.';

create index if not exists reviews_status_created_at_idx
  on public.reviews (status, created_at desc);

create index if not exists reviews_country_id_created_at_idx
  on public.reviews (country_id, created_at desc)
  where country_id is not null;

create index if not exists reviews_destination_id_created_at_idx
  on public.reviews (destination_id, created_at desc)
  where destination_id is not null;

alter table public.reviews enable row level security;
alter table public.reviews force row level security;

drop policy if exists "Approved reviews are readable" on public.reviews;
create policy "Approved reviews are readable"
on public.reviews
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Public can submit reviews" on public.reviews;
create policy "Public can submit reviews"
on public.reviews
for insert
to anon, authenticated
with check (
  status = 'pending'
  and (
    (country_id is not null and destination_id is null)
    or (country_id is null and destination_id is not null)
  )
);

drop policy if exists "Authenticated admin can fully manage reviews" on public.reviews;
create policy "Authenticated admin can fully manage reviews"
on public.reviews
for all
to authenticated
using (true)
with check (true);
