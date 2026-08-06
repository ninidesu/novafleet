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
