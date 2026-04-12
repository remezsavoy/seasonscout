-- SeasonScout admin delete-country RPC disambiguation fix
-- Assumptions:
-- 1. The existing RPC can fail when PL/pgSQL variables collide with column names in DELETE statements.
-- 2. All internal variables should avoid table-column names, and all table references should be explicitly qualified.
-- 3. The RPC should keep the same public signature and behavior while deleting in foreign-key-safe order.

create or replace function public.admin_delete_country(p_country_code text)
returns table(country_code text, deleted_destination_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cc text := upper(trim(p_country_code));
  v_destination_ids uuid[] := '{}'::uuid[];
  v_deleted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Admin access requires an authenticated user.';
  end if;

  if v_cc is null or v_cc = '' then
    raise exception 'Country code is required.';
  end if;

  if not exists (
    select 1
    from public.countries as c
    where c.code = v_cc
  ) then
    raise exception 'Country not found for admin delete: %', v_cc;
  end if;

  select coalesce(array_agg(d.id), '{}'::uuid[])
  into v_destination_ids
  from public.destinations as d
  where d.country_code = v_cc;

  v_deleted_count := coalesce(array_length(v_destination_ids, 1), 0);

  if v_deleted_count > 0 then
    delete from public.climate_source_snapshots as css
    where css.destination_id = any(v_destination_ids);

    delete from public.monthly_climate as mc
    where mc.destination_id = any(v_destination_ids);

    delete from public.destination_source_snapshots as dss
    where dss.destination_id = any(v_destination_ids);

    delete from public.country_featured_destinations as cfd
    where cfd.country_code = v_cc;

    delete from public.favorites as f
    where f.destination_id = any(v_destination_ids);

    delete from public.destinations as d
    where d.id = any(v_destination_ids);
  else
    delete from public.country_featured_destinations as cfd
    where cfd.country_code = v_cc;
  end if;

  delete from public.country_source_snapshots as css
  where css.country_code = v_cc;

  delete from public.countries as c
  where c.code = v_cc;

  return query
  select v_cc, v_deleted_count;
end;
$$;

comment on function public.admin_delete_country(text)
is 'Authenticated admin mutation that removes one country and all linked destination records in a foreign-key-safe order with fully qualified SQL references.';

revoke all on function public.admin_delete_country(text) from public;
grant execute on function public.admin_delete_country(text) to authenticated;
