-- SeasonScout admin delete-country RPC fix
-- Assumptions:
-- 1. The admin dashboard calls this RPC with a country ISO code under p_country_code.
-- 2. Delete ordering must respect explicit foreign key relationships from destination-linked tables back to countries.
-- 3. Ingestion run audit rows remain intact; only country- and destination-owned records are removed.

create or replace function public.admin_delete_country(p_country_code text)
returns table(country_code text, deleted_destination_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_code text := upper(trim(p_country_code));
  v_destination_ids uuid[] := '{}'::uuid[];
  v_deleted_destination_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Admin access requires an authenticated user.';
  end if;

  if v_country_code is null or v_country_code = '' then
    raise exception 'Country code is required.';
  end if;

  if not exists (
    select 1
    from public.countries
    where code = v_country_code
  ) then
    raise exception 'Country not found for admin delete: %', v_country_code;
  end if;

  select coalesce(array_agg(destination.id), '{}'::uuid[])
  into v_destination_ids
  from public.destinations as destination
  where destination.country_code = v_country_code;

  v_deleted_destination_count := coalesce(array_length(v_destination_ids, 1), 0);

  if v_deleted_destination_count > 0 then
    delete from public.climate_source_snapshots
    where destination_id = any(v_destination_ids);

    delete from public.monthly_climate
    where destination_id = any(v_destination_ids);

    delete from public.destination_source_snapshots
    where destination_id = any(v_destination_ids);

    delete from public.country_featured_destinations
    where country_code = v_country_code;

    delete from public.favorites
    where destination_id = any(v_destination_ids);

    delete from public.destinations
    where id = any(v_destination_ids);
  else
    delete from public.country_featured_destinations
    where country_code = v_country_code;
  end if;

  delete from public.country_source_snapshots
  where country_code = v_country_code;

  delete from public.countries
  where code = v_country_code;

  return query
  select v_country_code, v_deleted_destination_count;
end;
$$;

comment on function public.admin_delete_country(text)
is 'Authenticated admin mutation that removes one country and all linked destination records in a foreign-key-safe order while leaving ingestion run audit rows intact.';

revoke all on function public.admin_delete_country(text) from public;
grant execute on function public.admin_delete_country(text) to authenticated;
