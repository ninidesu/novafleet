-- Align NovaFleet management access with the authenticated client roles.
-- Apply after the existing Phase 2 and Phase 3 migrations.
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
grant select, insert, update, delete on fleet.drivers, fleet.vehicles, fleet.iot_devices, fleet.maintenance_records to authenticated;

alter table fleet.drivers enable row level security;
alter table fleet.vehicles enable row level security;
alter table fleet.iot_devices enable row level security;
alter table fleet.maintenance_records enable row level security;

drop policy if exists "Fleet administrators manage drivers" on fleet.drivers;
drop policy if exists "Fleet administrators can add drivers" on fleet.drivers;
drop policy if exists "Fleet administrators can remove drivers" on fleet.drivers;
create policy "Fleet administrators can add drivers" on fleet.drivers for insert to authenticated with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators manage drivers" on fleet.drivers for update to authenticated using ((select public.is_novafleet_fleet_admin())) with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can remove drivers" on fleet.drivers for delete to authenticated using ((select public.is_novafleet_fleet_admin()));

drop policy if exists "Fleet administrators can add vehicles" on fleet.vehicles;
drop policy if exists "Fleet administrators can update vehicles" on fleet.vehicles;
drop policy if exists "Fleet administrators can remove vehicles" on fleet.vehicles;
drop policy if exists "Fleet administrators manage vehicles" on fleet.vehicles;
create policy "Fleet administrators can add vehicles" on fleet.vehicles for insert to authenticated with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators manage vehicles" on fleet.vehicles for update to authenticated using ((select public.is_novafleet_fleet_admin())) with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can remove vehicles" on fleet.vehicles for delete to authenticated using ((select public.is_novafleet_fleet_admin()));

drop policy if exists "Fleet administrators can view IoT devices" on fleet.iot_devices;
drop policy if exists "Fleet administrators can add IoT devices" on fleet.iot_devices;
drop policy if exists "Fleet administrators can update IoT devices" on fleet.iot_devices;
drop policy if exists "Fleet administrators can remove IoT devices" on fleet.iot_devices;
create policy "Fleet administrators can view IoT devices" on fleet.iot_devices for select to authenticated using ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can add IoT devices" on fleet.iot_devices for insert to authenticated with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can update IoT devices" on fleet.iot_devices for update to authenticated using ((select public.is_novafleet_fleet_admin())) with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can remove IoT devices" on fleet.iot_devices for delete to authenticated using ((select public.is_novafleet_fleet_admin()));

drop policy if exists "Fleet administrators can view maintenance records" on fleet.maintenance_records;
drop policy if exists "Fleet administrators can add maintenance records" on fleet.maintenance_records;
drop policy if exists "Fleet administrators can update maintenance records" on fleet.maintenance_records;
drop policy if exists "Fleet administrators can remove maintenance records" on fleet.maintenance_records;
create policy "Fleet administrators can view maintenance records" on fleet.maintenance_records for select to authenticated using ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can add maintenance records" on fleet.maintenance_records for insert to authenticated with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can update maintenance records" on fleet.maintenance_records for update to authenticated using ((select public.is_novafleet_fleet_admin())) with check ((select public.is_novafleet_fleet_admin()));
create policy "Fleet administrators can remove maintenance records" on fleet.maintenance_records for delete to authenticated using ((select public.is_novafleet_fleet_admin()));

commit;
