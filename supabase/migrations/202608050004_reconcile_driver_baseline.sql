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
