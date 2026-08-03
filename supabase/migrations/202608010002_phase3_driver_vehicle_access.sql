-- Phase 3: least-privilege Driver and Vehicle access. Apply after Phase 2.
begin;
grant usage on schema fleet to authenticated;
grant select, insert, update on fleet.drivers, fleet.vehicles to authenticated;
alter table fleet.drivers enable row level security;
alter table fleet.vehicles enable row level security;
create or replace function public.is_novafleet_fleet_admin()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.profiles where id=(select auth.uid()) and module='fleet' and lower(role) in ('admin','administrator'));
$$;
revoke all on function public.is_novafleet_fleet_admin() from public;
grant execute on function public.is_novafleet_fleet_admin() to authenticated;
drop policy if exists "Fleet members can read drivers" on fleet.drivers;
create policy "Fleet members can read drivers" on fleet.drivers for select to authenticated using (exists(select 1 from public.profiles where id=(select auth.uid()) and module='fleet' and lower(role) in ('admin','administrator','dispatcher')));
drop policy if exists "Fleet administrators manage drivers" on fleet.drivers;
create policy "Fleet administrators manage drivers" on fleet.drivers for update to authenticated using ((select public.is_novafleet_fleet_admin())) with check ((select public.is_novafleet_fleet_admin()));
drop policy if exists "Fleet members can read vehicles" on fleet.vehicles;
create policy "Fleet members can read vehicles" on fleet.vehicles for select to authenticated using (exists(select 1 from public.profiles where id=(select auth.uid()) and module='fleet' and lower(role) in ('admin','administrator','dispatcher')));
drop policy if exists "Fleet administrators manage vehicles" on fleet.vehicles;
create policy "Fleet administrators manage vehicles" on fleet.vehicles for update to authenticated using ((select public.is_novafleet_fleet_admin())) with check ((select public.is_novafleet_fleet_admin()));
commit;