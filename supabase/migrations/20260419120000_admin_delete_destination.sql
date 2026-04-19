create or replace function public.admin_delete_destination(p_destination_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.destinations where id = p_destination_id;
end;
$$;

revoke all on function public.admin_delete_destination(uuid) from public;
grant execute on function public.admin_delete_destination(uuid) to authenticated;
