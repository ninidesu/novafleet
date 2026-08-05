-- Standalone repair for fleet.iot_devices RLS.
-- Use this when the broader access migration could not run because an optional table is absent.
begin;

create or replace function public.is_novafleet_fleet_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and module = 'fleet'
      and lower(role) in ('admin', 'administrator')
  );
$$;
revoke all on function public.is_novafleet_fleet_admin() from public;
grant execute on function public.is_novafleet_fleet_admin() to authenticated;
grant usage on schema fleet to authenticated;
grant select, insert, update, delete on fleet.iot_devices to authenticated;
alter table fleet.iot_devices enable row level security;

drop policy if exists "Fleet administrators can view IoT devices" on fleet.iot_devices;
drop policy if exists "Fleet administrators can add IoT devices" on fleet.iot_devices;
drop policy if exists "Fleet administrators can update IoT devices" on fleet.iot_devices;
drop policy if exists "Fleet administrators can remove IoT devices" on fleet.iot_devices;
create policy "Fleet administrators can view IoT devices" on fleet.iot_devices
  for select to authenticated using ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can add IoT devices" on fleet.iot_devices
  for insert to authenticated with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can update IoT devices" on fleet.iot_devices
  for update to authenticated using ((select public.is_novafleet_fleet_admin())) with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can remove IoT devices" on fleet.iot_devices
  for delete to authenticated using ((select public.is_novafleet_fleet_admin()));

commit;
