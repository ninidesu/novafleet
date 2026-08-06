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
