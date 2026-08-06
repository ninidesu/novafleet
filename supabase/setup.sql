-- NovaFleet full database setup — generated bundle of all migrations in order.
-- Idempotent: safe to run multiple times. Paste into the Supabase SQL Editor and Run.


-- ============================================================
-- migrations/202607200001_fleet_foundation.sql
-- ============================================================
-- NovaFleet foundation schema.
-- Reverse-engineered from the application's data access layer so a fresh Supabase
-- project matches every table, column, and foreign-key name the code expects.
--
-- This migration is intentionally dated before the earlier IoT / access migrations
-- so it runs first: fleet.iot_devices references fleet.vehicles, which is created here.
-- Every statement is guarded with "if not exists" so re-applying it against a
-- database that was bootstrapped manually is a harmless no-op.

begin;

create schema if not exists fleet;
grant usage on schema fleet to authenticated;

-- ---------------------------------------------------------------------------
-- public.profiles — application identity + role (source of truth for auth).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'dispatcher' check (lower(role) in ('admin', 'administrator', 'dispatcher')),
  module text not null default 'fleet',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- fleet.drivers — created before vehicles because vehicles references drivers.
-- ---------------------------------------------------------------------------
create table if not exists fleet.drivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  license_number text unique,
  contact_number text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- fleet.vehicles
-- ---------------------------------------------------------------------------
create table if not exists fleet.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null unique,
  vehicle_type text,
  model text,
  status text not null default 'active',
  assigned_driver_id uuid,
  fuel_capacity_liters numeric,
  odometer_km numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_assigned_driver_id_fkey
    foreign key (assigned_driver_id) references fleet.drivers (id) on delete set null
);
create index if not exists vehicles_assigned_driver_id_idx on fleet.vehicles (assigned_driver_id);

-- ---------------------------------------------------------------------------
-- fleet.trips
-- ---------------------------------------------------------------------------
create table if not exists fleet.trips (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null,
  driver_id uuid not null,
  origin text,
  destination text,
  planned_route_polyline jsonb,
  dispatch_time timestamptz,
  start_time timestamptz,
  end_time timestamptz,
  status text not null default 'dispatched',
  purpose text,
  created_at timestamptz not null default now(),
  constraint trips_vehicle_id_fkey foreign key (vehicle_id) references fleet.vehicles (id) on delete restrict,
  constraint trips_driver_id_fkey foreign key (driver_id) references fleet.drivers (id) on delete restrict
);
create index if not exists trips_vehicle_id_idx on fleet.trips (vehicle_id);
create index if not exists trips_driver_id_idx on fleet.trips (driver_id);
create index if not exists trips_dispatch_time_idx on fleet.trips (dispatch_time desc);
-- Supports the "open trip" conflict check (end_time is null).
create index if not exists trips_open_idx on fleet.trips (end_time) where end_time is null;

-- ---------------------------------------------------------------------------
-- fleet.sensor_readings — GPS/telemetry stream (ESP32 + simulator sources).
-- ---------------------------------------------------------------------------
create table if not exists fleet.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  recorded_at timestamptz not null default now(),
  lat double precision,
  lng double precision,
  speed_kmh numeric,
  source text,
  constraint sensor_readings_trip_id_fkey foreign key (trip_id) references fleet.trips (id) on delete cascade
);
create index if not exists sensor_readings_trip_recorded_idx on fleet.sensor_readings (trip_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- fleet.incident_alerts
-- ---------------------------------------------------------------------------
create table if not exists fleet.incident_alerts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid,
  vehicle_id uuid,
  alert_type text,
  accel_spike_value numeric,
  gps_lat double precision,
  gps_lng double precision,
  triggered_at timestamptz not null default now(),
  acknowledged boolean not null default false,
  constraint incident_alerts_trip_id_fkey foreign key (trip_id) references fleet.trips (id) on delete set null,
  constraint incident_alerts_vehicle_id_fkey foreign key (vehicle_id) references fleet.vehicles (id) on delete set null
);
create index if not exists incident_alerts_triggered_at_idx on fleet.incident_alerts (triggered_at desc);

-- ---------------------------------------------------------------------------
-- fleet.risk_scores — AI/ML risk assessment per trip.
-- ---------------------------------------------------------------------------
create table if not exists fleet.risk_scores (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  behavior_anomaly_score numeric,
  route_deviation_score numeric,
  fuel_ratio_anomaly_score numeric,
  total_risk_score numeric,
  flagged boolean not null default false,
  reviewed_at timestamptz,
  constraint risk_scores_trip_id_fkey foreign key (trip_id) references fleet.trips (id) on delete cascade
);
create index if not exists risk_scores_trip_id_idx on fleet.risk_scores (trip_id);
create index if not exists risk_scores_total_idx on fleet.risk_scores (total_risk_score desc);

-- ---------------------------------------------------------------------------
-- fleet.route_anomalies
-- ---------------------------------------------------------------------------
create table if not exists fleet.route_anomalies (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  max_deviation_meters numeric,
  deviation_duration_min numeric,
  flagged_at timestamptz not null default now(),
  constraint route_anomalies_trip_id_fkey foreign key (trip_id) references fleet.trips (id) on delete cascade
);
create index if not exists route_anomalies_trip_id_idx on fleet.route_anomalies (trip_id);
create index if not exists route_anomalies_flagged_at_idx on fleet.route_anomalies (flagged_at desc);

-- ---------------------------------------------------------------------------
-- fleet.maintenance_records
-- ---------------------------------------------------------------------------
create table if not exists fleet.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null,
  maintenance_type text,
  service_date date,
  cost numeric,
  notes text,
  created_at timestamptz not null default now(),
  constraint maintenance_records_vehicle_id_fkey foreign key (vehicle_id) references fleet.vehicles (id) on delete cascade
);
create index if not exists maintenance_records_vehicle_id_idx on fleet.maintenance_records (vehicle_id);
create index if not exists maintenance_records_service_date_idx on fleet.maintenance_records (service_date desc);

-- ---------------------------------------------------------------------------
-- fleet.fuel_logs
-- ---------------------------------------------------------------------------
create table if not exists fleet.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid,
  vehicle_id uuid,
  liters numeric,
  cost numeric,
  odometer_km numeric,
  logged_at timestamptz not null default now(),
  source text,
  constraint fuel_logs_trip_id_fkey foreign key (trip_id) references fleet.trips (id) on delete set null,
  constraint fuel_logs_vehicle_id_fkey foreign key (vehicle_id) references fleet.vehicles (id) on delete cascade
);
create index if not exists fuel_logs_vehicle_id_idx on fleet.fuel_logs (vehicle_id);

-- ---------------------------------------------------------------------------
-- fleet.driver_baseline — per-driver behavior baseline for anomaly scoring.
-- ---------------------------------------------------------------------------
create table if not exists fleet.driver_baseline (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null unique,
  avg_speed_kmh numeric,
  harsh_accel_rate numeric,
  harsh_brake_rate numeric,
  samples integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint driver_baseline_driver_id_fkey foreign key (driver_id) references fleet.drivers (id) on delete cascade
);

commit;


-- ============================================================
-- migrations/202607220001_create_iot_devices.sql
-- ============================================================
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


-- ============================================================
-- migrations/202607220002_admin_vehicle_management.sql
-- ============================================================
grant select,insert,update,delete on fleet.vehicles to authenticated;

drop policy if exists "Fleet administrators can add vehicles" on fleet.vehicles;
create policy "Fleet administrators can add vehicles"
on fleet.vehicles for insert to authenticated
with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'));

drop policy if exists "Fleet administrators can update vehicles" on fleet.vehicles;
create policy "Fleet administrators can update vehicles"
on fleet.vehicles for update to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'))
with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'));

drop policy if exists "Fleet administrators can remove vehicles" on fleet.vehicles;
create policy "Fleet administrators can remove vehicles"
on fleet.vehicles for delete to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'));


-- ============================================================
-- migrations/202608010001_phase2_authenticated_access.sql
-- ============================================================
-- Phase 2: authenticated NovaFleet profile resolution and fleet connection check.
-- Run through the Supabase migration workflow after confirming that `fleet` is exposed in Data API settings.

begin;

-- Profiles are the source of application role assignment. No browser client may update roles.
-- This policy assumes the existing profile model: id, full_name, role, module, created_at.
grant select on table public.profiles to authenticated;
alter table public.profiles enable row level security;
drop policy if exists "NovaFleet users can read their own profile" on public.profiles;
create policy "NovaFleet users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()) and module = 'fleet');

-- Least privilege for the Phase 1 connection check. No anonymous access and no new write grants.
grant usage on schema fleet to authenticated;
grant select on table fleet.vehicles to authenticated;
alter table fleet.vehicles enable row level security;
drop policy if exists "NovaFleet members can read vehicles" on fleet.vehicles;
create policy "NovaFleet members can read vehicles"
on fleet.vehicles for select to authenticated
using (
  exists (
    select 1 from public.profiles profile
    where profile.id = (select auth.uid())
      and profile.module = 'fleet'
      and lower(profile.role) in ('admin', 'administrator', 'dispatcher')
  )
);

commit;

-- ============================================================
-- migrations/202608010002_phase3_driver_vehicle_access.sql
-- ============================================================
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

-- ============================================================
-- migrations/202608050001_audit_and_rls.sql
-- ============================================================
-- NovaFleet: row-level security posture + persistent change auditing.
-- Ported from the ad-hoc SQL that previously lived in client/supabase/ so the
-- behavior is versioned. Idempotent: safe to re-run.
--
-- Architecture note: data access now goes through the Express REST API using the
-- Supabase service-role key, which bypasses RLS. RLS is kept enabled as
-- defense-in-depth so a leaked anon/publishable key cannot read fleet data
-- directly. Only public.profiles is readable by the authenticated browser
-- session (needed for the login/role bootstrap and admin user list).

begin;

-- ---------------------------------------------------------------------------
-- Administrator detection helper (SECURITY DEFINER avoids RLS recursion).
-- ---------------------------------------------------------------------------
create or replace function public.is_novafleet_administrator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and lower(role) in ('admin', 'administrator')
  );
$$;
revoke all on function public.is_novafleet_administrator() from public;
grant execute on function public.is_novafleet_administrator() to authenticated;

-- ---------------------------------------------------------------------------
-- public.profiles: a user sees their own profile; admins see all.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
grant select on table public.profiles to authenticated;
drop policy if exists "Administrators can view all profiles" on public.profiles;
create policy "Administrators can view all profiles"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_novafleet_administrator()));

-- ---------------------------------------------------------------------------
-- Enable RLS on every fleet data table. No authenticated data policies are
-- added: the Express service role bypasses RLS; the browser must not read
-- these tables directly.
-- ---------------------------------------------------------------------------
do $$
declare
  target text;
begin
  foreach target in array array[
    'vehicles', 'drivers', 'trips', 'sensor_readings', 'incident_alerts',
    'risk_scores', 'route_anomalies', 'maintenance_records', 'fuel_logs',
    'driver_baseline', 'iot_devices'
  ]
  loop
    if to_regclass(format('fleet.%I', target)) is not null then
      execute format('alter table fleet.%I enable row level security', target);
    end if;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Persistent change auditing.
-- ---------------------------------------------------------------------------
create table if not exists fleet.audit_logs (
  id bigint generated by default as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  schema_name text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb
);
create index if not exists audit_logs_occurred_at_idx on fleet.audit_logs (occurred_at desc);
create index if not exists audit_logs_actor_id_idx on fleet.audit_logs (actor_id);
create index if not exists audit_logs_resource_idx on fleet.audit_logs (schema_name, table_name, record_id);

alter table fleet.audit_logs enable row level security;
drop policy if exists "Administrators can view audit logs" on fleet.audit_logs;
create policy "Administrators can view audit logs"
on fleet.audit_logs for select to authenticated
using ((select public.is_novafleet_administrator()));

create or replace function fleet.capture_audit_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, fleet
as $$
declare
  before_row jsonb;
  after_row jsonb;
  changed_record_id text;
begin
  if TG_OP = 'INSERT' then
    before_row := null;
    after_row := to_jsonb(NEW);
  elsif TG_OP = 'UPDATE' then
    before_row := to_jsonb(OLD);
    after_row := to_jsonb(NEW);
    if before_row = after_row then
      return NEW;
    end if;
  else
    before_row := to_jsonb(OLD);
    after_row := null;
  end if;

  changed_record_id := coalesce(after_row ->> 'id', before_row ->> 'id');

  insert into fleet.audit_logs (actor_id, action, schema_name, table_name, record_id, old_data, new_data)
  values (auth.uid(), TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME, changed_record_id, before_row, after_row);

  return coalesce(NEW, OLD);
end;
$$;

-- Attach the audit trigger to every mutable NovaFleet table that exists.
do $$
declare
  target record;
begin
  for target in
    select * from (values
      ('public', 'profiles'), ('fleet', 'vehicles'), ('fleet', 'drivers'),
      ('fleet', 'trips'), ('fleet', 'iot_devices'), ('fleet', 'sensor_readings'),
      ('fleet', 'incident_alerts'), ('fleet', 'maintenance_records'),
      ('fleet', 'fuel_logs'), ('fleet', 'risk_scores'), ('fleet', 'route_anomalies'),
      ('fleet', 'driver_baseline')
    ) as tracked(schema_name, table_name)
  loop
    if to_regclass(format('%I.%I', target.schema_name, target.table_name)) is not null then
      execute format('drop trigger if exists novafleet_audit_change on %I.%I', target.schema_name, target.table_name);
      execute format(
        'create trigger novafleet_audit_change after insert or update or delete on %I.%I for each row execute function fleet.capture_audit_change()',
        target.schema_name, target.table_name
      );
    end if;
  end loop;
end
$$;

commit;


-- ============================================================
-- migrations/202608050002_service_role_grants.sql
-- ============================================================
-- Grant the API's service_role access to the fleet schema.
-- Custom schemas do NOT automatically expose privileges to Supabase's built-in
-- roles, so without this the REST API (which authenticates as service_role and
-- bypasses RLS) still gets "permission denied for schema fleet". Idempotent.

begin;

grant usage on schema fleet to service_role;
grant all privileges on all tables in schema fleet to service_role;
grant all privileges on all sequences in schema fleet to service_role;

-- Ensure future fleet tables/sequences are also accessible to service_role.
alter default privileges in schema fleet grant all on tables to service_role;
alter default privileges in schema fleet grant all on sequences to service_role;

commit;


-- ============================================================
-- migrations/202608050003_reconcile_fuel_logs.sql
-- ============================================================
-- Reconcile fleet.fuel_logs to the schema the application expects.
-- A legacy fuel_logs table pre-existed with different columns, so the earlier
-- "create table if not exists" was skipped and left it out of sync. fuel_logs
-- is only used for counts (no real data), so we rebuild it cleanly.

begin;

drop table if exists fleet.fuel_logs cascade;

create table fleet.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid,
  vehicle_id uuid,
  liters numeric,
  cost numeric,
  odometer_km numeric,
  logged_at timestamptz not null default now(),
  source text,
  constraint fuel_logs_trip_id_fkey foreign key (trip_id) references fleet.trips (id) on delete set null,
  constraint fuel_logs_vehicle_id_fkey foreign key (vehicle_id) references fleet.vehicles (id) on delete cascade
);
create index if not exists fuel_logs_vehicle_id_idx on fleet.fuel_logs (vehicle_id);

alter table fleet.fuel_logs enable row level security;
grant all privileges on fleet.fuel_logs to service_role;

-- Re-attach the change-audit trigger.
drop trigger if exists novafleet_audit_change on fleet.fuel_logs;
create trigger novafleet_audit_change
  after insert or update or delete on fleet.fuel_logs
  for each row execute function fleet.capture_audit_change();

commit;


-- ============================================================
-- migrations/202608050004_reconcile_driver_baseline.sql
-- ============================================================
-- Reconcile fleet.driver_baseline to the schema the application expects.
-- Like fuel_logs, a legacy table pre-existed with different columns so the
-- earlier "create table if not exists" was skipped. driver_baseline holds
-- per-driver behavior baselines for anomaly scoring (regenerable), so we
-- rebuild it cleanly.

begin;

drop table if exists fleet.driver_baseline cascade;

create table fleet.driver_baseline (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null unique,
  avg_speed_kmh numeric,
  harsh_accel_rate numeric,
  harsh_brake_rate numeric,
  samples integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint driver_baseline_driver_id_fkey foreign key (driver_id) references fleet.drivers (id) on delete cascade
);

alter table fleet.driver_baseline enable row level security;
grant all privileges on fleet.driver_baseline to service_role;

drop trigger if exists novafleet_audit_change on fleet.driver_baseline;
create trigger novafleet_audit_change
  after insert or update or delete on fleet.driver_baseline
  for each row execute function fleet.capture_audit_change();

commit;


-- ============================================================
-- migrations/202608060001_ingestion_support.sql
-- ============================================================
-- Hardware/mobile telemetry ingestion support.
-- Adds a client-generated id to sensor_readings so device and offline-buffer
-- resends are idempotent (ON CONFLICT DO NOTHING). NULL client_id is allowed
-- and never conflicts, so live readings that omit it still insert normally.

begin;

alter table fleet.sensor_readings add column if not exists client_id uuid;

-- Unique so a resent buffered reading (same client_id) is deduplicated.
create unique index if not exists sensor_readings_client_id_key
  on fleet.sensor_readings (client_id);

commit;


-- ============================================================
-- migrations/202608060002_driver_role.sql
-- ============================================================
-- Allow the 'driver' role on public.profiles (for the mobile driver app).
-- profiles pre-existed and may carry a role check constraint under an unknown
-- name, so drop whatever role check exists, then add one that permits 'driver'.

begin;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%';
  if constraint_name is not null then
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end if;
end
$$;

alter table public.profiles
  add constraint profiles_role_check
  check (lower(role) in ('admin', 'administrator', 'dispatcher', 'driver'));

commit;

