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
