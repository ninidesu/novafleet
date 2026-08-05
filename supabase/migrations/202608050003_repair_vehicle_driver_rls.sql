-- Standalone repair for fleet.vehicles and fleet.drivers RLS.
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
grant select, insert, update, delete on fleet.vehicles, fleet.drivers to authenticated;
alter table fleet.vehicles enable row level security;
alter table fleet.drivers enable row level security;

drop policy if exists "Fleet administrators can add vehicles" on fleet.vehicles;
drop policy if exists "Fleet administrators can update vehicles" on fleet.vehicles;
drop policy if exists "Fleet administrators can remove vehicles" on fleet.vehicles;
drop policy if exists "Fleet administrators manage vehicles" on fleet.vehicles;
create policy "Fleet administrators can add vehicles" on fleet.vehicles
  for insert to authenticated with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators manage vehicles" on fleet.vehicles
  for update to authenticated using ((select public.is_novafleet_fleet_admin())) with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can remove vehicles" on fleet.vehicles
  for delete to authenticated using ((select public.is_novafleet_fleet_admin()));

drop policy if exists "Fleet administrators manage drivers" on fleet.drivers;
drop policy if exists "Fleet administrators can add drivers" on fleet.drivers;
drop policy if exists "Fleet administrators can remove drivers" on fleet.drivers;
create policy "Fleet administrators can add drivers" on fleet.drivers
  for insert to authenticated with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators manage drivers" on fleet.drivers
  for update to authenticated using ((select public.is_novafleet_fleet_admin())) with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can remove drivers" on fleet.drivers
  for delete to authenticated using ((select public.is_novafleet_fleet_admin()));

commit;
