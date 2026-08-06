-- NovaFleet demo seed data.
-- Safe to run repeatedly: it deletes its own rows (by fixed IDs) first, then
-- reinserts. Telemetry uses now()-relative times so the live map is always
-- "fresh" whenever you run it. Does NOT touch public.profiles (your login user).
--
-- Paste into the Supabase SQL Editor and Run.

begin;

-- Fixed IDs so the seed is deterministic and re-runnable.
-- drivers d1..d5, vehicles v1..v5, trips t1..t3.

-- --- Cleanup (child rows first, respecting foreign keys) --------------------
delete from fleet.sensor_readings where trip_id in (
  '33333333-3333-3333-3333-333333333301','33333333-3333-3333-3333-333333333302','33333333-3333-3333-3333-333333333303');
delete from fleet.risk_scores where trip_id in (
  '33333333-3333-3333-3333-333333333301','33333333-3333-3333-3333-333333333302','33333333-3333-3333-3333-333333333303');
delete from fleet.route_anomalies where trip_id in (
  '33333333-3333-3333-3333-333333333301','33333333-3333-3333-3333-333333333302','33333333-3333-3333-3333-333333333303');
delete from fleet.incident_alerts where vehicle_id in (
  '22222222-2222-2222-2222-222222222201','22222222-2222-2222-2222-222222222202','22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204','22222222-2222-2222-2222-222222222205');
delete from fleet.fuel_logs where vehicle_id in (
  '22222222-2222-2222-2222-222222222201','22222222-2222-2222-2222-222222222202','22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204','22222222-2222-2222-2222-222222222205');
delete from fleet.maintenance_records where vehicle_id in (
  '22222222-2222-2222-2222-222222222201','22222222-2222-2222-2222-222222222202','22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204','22222222-2222-2222-2222-222222222205');
delete from fleet.trips where id in (
  '33333333-3333-3333-3333-333333333301','33333333-3333-3333-3333-333333333302','33333333-3333-3333-3333-333333333303');
delete from fleet.iot_devices where vehicle_id in (
  '22222222-2222-2222-2222-222222222201','22222222-2222-2222-2222-222222222202','22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204','22222222-2222-2222-2222-222222222205');
delete from fleet.driver_baseline where driver_id in (
  '11111111-1111-1111-1111-111111111101','11111111-1111-1111-1111-111111111102','11111111-1111-1111-1111-111111111103',
  '11111111-1111-1111-1111-111111111104','11111111-1111-1111-1111-111111111105');
update fleet.vehicles set assigned_driver_id = null where id in (
  '22222222-2222-2222-2222-222222222201','22222222-2222-2222-2222-222222222202','22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204','22222222-2222-2222-2222-222222222205');
delete from fleet.vehicles where id in (
  '22222222-2222-2222-2222-222222222201','22222222-2222-2222-2222-222222222202','22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204','22222222-2222-2222-2222-222222222205');
delete from fleet.drivers where id in (
  '11111111-1111-1111-1111-111111111101','11111111-1111-1111-1111-111111111102','11111111-1111-1111-1111-111111111103',
  '11111111-1111-1111-1111-111111111104','11111111-1111-1111-1111-111111111105');

-- --- Drivers ----------------------------------------------------------------
insert into fleet.drivers (id, full_name, license_number, contact_number, status) values
  ('11111111-1111-1111-1111-111111111101','Ramon dela Cruz','N01-11-000123','+63 917 555 0101','active'),
  ('11111111-1111-1111-1111-111111111102','Liza Manalo','N02-22-000456','+63 917 555 0102','active'),
  ('11111111-1111-1111-1111-111111111103','Ferdinand Reyes','N03-33-000789','+63 917 555 0103','active'),
  ('11111111-1111-1111-1111-111111111104','Grace Tolentino','N04-44-000234','+63 917 555 0104','inactive'),
  ('11111111-1111-1111-1111-111111111105','Nardo Santos','N05-55-000567','+63 917 555 0105','active');

-- --- Vehicles (statuses stored lowercase; UI title-cases them) ---------------
insert into fleet.vehicles (id, plate_number, vehicle_type, model, status, assigned_driver_id, fuel_capacity_liters, odometer_km) values
  ('22222222-2222-2222-2222-222222222201','NFA-1023','van','Toyota HiAce 2021','active','11111111-1111-1111-1111-111111111101',70,84210),
  ('22222222-2222-2222-2222-222222222202','NFA-2087','motorcycle','Honda XRM 125','active','11111111-1111-1111-1111-111111111102',12,31980),
  ('22222222-2222-2222-2222-222222222203','NFA-3341','suv','Mitsubishi Montero 2020','active','11111111-1111-1111-1111-111111111103',65,102540),
  ('22222222-2222-2222-2222-222222222204','NFA-4415','truck','Isuzu ELF 2019','maintenance','11111111-1111-1111-1111-111111111105',100,158300),
  ('22222222-2222-2222-2222-222222222205','NFA-5560','sedan','Toyota Vios 2022','active',null,42,19870);

-- --- Trips: t1 active (live map), t2 completed, t3 dispatched ----------------
insert into fleet.trips (id, vehicle_id, driver_id, origin, destination, planned_route_polyline, dispatch_time, start_time, end_time, status, purpose) values
  ('33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101',
    'Makati HQ','Quezon City Branch',
    '[[14.5555,121.0245],[14.5768,121.0285],[14.5951,121.0325],[14.6142,121.0366],[14.6760,121.0437]]'::jsonb,
    now() - interval '60 minutes', now() - interval '45 minutes', null, 'active', 'Cash pickup and client visit'),
  ('33333333-3333-3333-3333-333333333302','22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111102',
    'Pasig Branch','Mandaluyong Client',
    '[[14.5764,121.0851],[14.5820,121.0500],[14.5794,121.0359]]'::jsonb,
    now() - interval '1 day', now() - interval '1 day' + interval '10 minutes', now() - interval '1 day' + interval '2 hours', 'completed', 'Loan disbursement run'),
  ('33333333-3333-3333-3333-333333333303','22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111103',
    'Makati HQ','Alabang Branch', null,
    now() - interval '20 minutes', null, null, 'dispatched', 'Scheduled collection route');

-- --- Live telemetry for the active trip (t1): a fresh GPS trail -------------
insert into fleet.sensor_readings (trip_id, recorded_at, lat, lng, speed_kmh, source)
select '33333333-3333-3333-3333-333333333301', now() - make_interval(mins => m), lat, lng, spd, 'device'
from (values
  (13, 14.5555, 121.0245, 0),
  (12, 14.5602, 121.0250, 28),
  (11, 14.5655, 121.0262, 34),
  (10, 14.5710, 121.0271, 30),
  (9,  14.5768, 121.0285, 40),
  (8,  14.5825, 121.0298, 38),
  (7,  14.5888, 121.0312, 33),
  (6,  14.5951, 121.0325, 36),
  (5,  14.6015, 121.0338, 41),
  (4,  14.6080, 121.0352, 29),
  (3,  14.6142, 121.0366, 35),
  (2,  14.6205, 121.0380, 37),
  (1,  14.6270, 121.0395, 34)
) as p(m, lat, lng, spd);

-- --- A short historical trail for the completed trip (t2) -------------------
insert into fleet.sensor_readings (trip_id, recorded_at, lat, lng, speed_kmh, source)
select '33333333-3333-3333-3333-333333333302', now() - interval '1 day' + make_interval(mins => m), lat, lng, spd, 'device'
from (values
  (10, 14.5764, 121.0851, 22),
  (45, 14.5820, 121.0500, 31),
  (90, 14.5794, 121.0359, 0)
) as p(m, lat, lng, spd);

-- --- Risk scores ------------------------------------------------------------
insert into fleet.risk_scores (trip_id, behavior_anomaly_score, route_deviation_score, fuel_ratio_anomaly_score, total_risk_score, flagged, reviewed_at) values
  ('33333333-3333-3333-3333-333333333301', 30, 25, 17, 72, true, null),
  ('33333333-3333-3333-3333-333333333302', 8, 6, 8, 22, false, now() - interval '20 hours'),
  ('33333333-3333-3333-3333-333333333303', 18, 15, 12, 45, true, null);

-- --- Route anomalies --------------------------------------------------------
insert into fleet.route_anomalies (trip_id, max_deviation_meters, deviation_duration_min, flagged_at) values
  ('33333333-3333-3333-3333-333333333301', 320, 6, now() - interval '10 minutes'),
  ('33333333-3333-3333-3333-333333333302', 90, 2, now() - interval '23 hours');

-- --- Incident alerts --------------------------------------------------------
insert into fleet.incident_alerts (trip_id, vehicle_id, alert_type, accel_spike_value, gps_lat, gps_lng, triggered_at, acknowledged) values
  ('33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222201','harsh_acceleration', 3.42, 14.5951, 121.0325, now() - interval '8 minutes', false),
  ('33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222201','route_deviation', null, 14.6080, 121.0352, now() - interval '9 minutes', false),
  ('33333333-3333-3333-3333-333333333302','22222222-2222-2222-2222-222222222202','harsh_braking', 2.91, 14.5820, 121.0500, now() - interval '23 hours', true);

-- --- Maintenance records ----------------------------------------------------
insert into fleet.maintenance_records (vehicle_id, maintenance_type, service_date, cost, notes) values
  ('22222222-2222-2222-2222-222222222204','engine_repair', (now() - interval '2 days')::date, 12500, 'Overheating diagnosed; coolant system serviced.'),
  ('22222222-2222-2222-2222-222222222201','tire_rotation', (now() + interval '7 days')::date, 1800, 'Scheduled preventive maintenance.'),
  ('22222222-2222-2222-2222-222222222202','oil_change', (now() - interval '10 days')::date, 950, 'Routine oil and filter change.');

-- --- Fuel logs --------------------------------------------------------------
insert into fleet.fuel_logs (trip_id, vehicle_id, liters, cost, odometer_km, logged_at, source) values
  ('33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222201', 45.0, 3150, 84150, now() - interval '2 hours', 'manual'),
  ('33333333-3333-3333-3333-333333333302','22222222-2222-2222-2222-222222222202', 8.5, 595, 31900, now() - interval '1 day', 'manual'),
  (null,'22222222-2222-2222-2222-222222222203', 50.0, 3500, 102400, now() - interval '3 days', 'manual');

-- --- IoT devices (connection/gps values must match check constraints) -------
insert into fleet.iot_devices (device_uid, device_name, device_type, serial_number, firmware_version, connection_status, gps_status, vehicle_id, last_seen_at, installed_at, notes) values
  ('NF-ESP32-0001','Tracker HiAce','GPS Tracker','SN-0001','v1.2.0','Online','Active','22222222-2222-2222-2222-222222222201', now() - interval '1 minute', (now() - interval '90 days')::date, 'Primary unit'),
  ('NF-ESP32-0002','Tracker XRM','GPS Tracker','SN-0002','v1.2.0','Online','Active','22222222-2222-2222-2222-222222222202', now() - interval '4 minutes', (now() - interval '75 days')::date, null),
  ('NF-ESP32-0003','Tracker Montero','GPS Tracker','SN-0003','v1.1.5','Offline','No GPS','22222222-2222-2222-2222-222222222203', now() - interval '3 hours', (now() - interval '60 days')::date, 'Intermittent signal reported'),
  ('NF-ESP32-0004','Tracker ELF','GPS Tracker','SN-0004','v1.1.5','Maintenance','Disabled','22222222-2222-2222-2222-222222222204', now() - interval '2 days', (now() - interval '120 days')::date, 'Removed during engine repair');

-- --- Driver behavior baselines (used by anomaly scoring) --------------------
insert into fleet.driver_baseline (driver_id, avg_speed_kmh, harsh_accel_rate, harsh_brake_rate, samples) values
  ('11111111-1111-1111-1111-111111111101', 34.5, 0.12, 0.09, 240),
  ('11111111-1111-1111-1111-111111111102', 41.2, 0.21, 0.15, 180),
  ('11111111-1111-1111-1111-111111111103', 29.8, 0.08, 0.07, 310);

commit;
