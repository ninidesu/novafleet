create table if not exists fleet.iot_devices (
 id uuid primary key default gen_random_uuid(), device_uid text not null unique, device_name text not null,
 device_type text not null default 'GPS Tracker', serial_number text unique, firmware_version text,
 connection_status text not null default 'Offline' check (connection_status in ('Online','Offline','Maintenance')),
 gps_status text not null default 'No GPS' check (gps_status in ('Active','No GPS','Disabled')),
 vehicle_id uuid references fleet.vehicles(id) on delete set null, last_seen_at timestamptz, installed_at date, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists iot_devices_vehicle_id_idx on fleet.iot_devices(vehicle_id);
alter table fleet.iot_devices enable row level security;
grant select,insert,update,delete on fleet.iot_devices to authenticated;
drop policy if exists "Fleet administrators can view IoT devices" on fleet.iot_devices;
create policy "Fleet administrators can view IoT devices" on fleet.iot_devices for select to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'));
drop policy if exists "Fleet administrators can add IoT devices" on fleet.iot_devices;
create policy "Fleet administrators can add IoT devices" on fleet.iot_devices for insert to authenticated with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'));
drop policy if exists "Fleet administrators can update IoT devices" on fleet.iot_devices;
create policy "Fleet administrators can update IoT devices" on fleet.iot_devices for update to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet')) with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'));
drop policy if exists "Fleet administrators can remove IoT devices" on fleet.iot_devices;
create policy "Fleet administrators can remove IoT devices" on fleet.iot_devices for delete to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'));
