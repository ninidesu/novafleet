-- Store the most recent IoT device position for map display when trip telemetry is unavailable.
begin;

alter table fleet.iot_devices
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_updated_at timestamptz;

alter table fleet.iot_devices
  drop constraint if exists iot_devices_latitude_range,
  drop constraint if exists iot_devices_longitude_range,
  add constraint iot_devices_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint iot_devices_longitude_range check (longitude is null or longitude between -180 and 180);

commit;
