import { fleetDb } from "../config/supabase.js";
import { env } from "../config/env.js";
import { badRequest, fromDbError, notFound } from "../lib/httpError.js";

const MAX_BATCH = 500;
const INACTIVE_TRIP = new Set(["completed", "complete", "cancelled", "canceled"]);

function validReading(r) {
  const lat = Number(r.lat);
  const lng = Number(r.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return {
    client_id: r.client_id || null,
    recorded_at: r.recorded_at || new Date().toISOString(),
    lat,
    lng,
    speed_kmh: r.speed_kmh == null ? null : Number(r.speed_kmh),
    source: r.source || "device",
    _accel: r.accel_spike == null ? null : Number(r.accel_spike),
  };
}

// Core telemetry ingestion. Resolves the device, updates its heartbeat, finds
// the vehicle's active trip, stores readings idempotently, and raises alerts.
export async function ingestTelemetry({ deviceUid, deviceStatus, readings = [] }) {
  if (!deviceUid) throw badRequest("device_uid is required.");
  if (!Array.isArray(readings)) throw badRequest("readings must be an array.");
  if (readings.length > MAX_BATCH) throw badRequest(`Too many readings; max ${MAX_BATCH} per request.`, "batch_too_large");

  // 1. Identify the device.
  const { data: device, error: devErr } = await fleetDb
    .from("iot_devices")
    .select("id, device_uid, vehicle_id")
    .eq("device_uid", deviceUid)
    .maybeSingle();
  if (devErr) throw fromDbError(devErr, "device lookup");
  if (!device) throw notFound("Unknown device_uid.", "unknown_device");

  // 2. Heartbeat: always record that the device phoned in.
  const heartbeat = { last_seen_at: new Date().toISOString() };
  if (deviceStatus?.connection) heartbeat.connection_status = deviceStatus.connection;
  if (deviceStatus?.gps) heartbeat.gps_status = deviceStatus.gps;
  await fleetDb.from("iot_devices").update(heartbeat).eq("id", device.id);

  const base = { device_uid: deviceUid, vehicle_id: device.vehicle_id, trip_id: null, received: readings.length, stored: 0, duplicates: 0, alerts_created: 0 };

  if (!device.vehicle_id) return { ...base, note: "Device is not assigned to a vehicle; heartbeat recorded, readings not stored." };
  if (readings.length === 0) return { ...base, note: "Heartbeat recorded; no readings sent." };

  // 3. Find the vehicle's active (open, non-terminal) trip.
  const { data: openTrips, error: tripErr } = await fleetDb
    .from("trips")
    .select("id, status, dispatch_time")
    .eq("vehicle_id", device.vehicle_id)
    .is("end_time", null)
    .order("dispatch_time", { ascending: false });
  if (tripErr) throw fromDbError(tripErr, "active trip lookup");
  const activeTrip = (openTrips || []).find((t) => !INACTIVE_TRIP.has(String(t.status || "").toLowerCase()));
  if (!activeTrip) {
    return { ...base, note: "No active trip for this vehicle; heartbeat recorded, readings not stored." };
  }

  // 4. Validate + de-duplicate client_ids within this batch.
  const seen = new Set();
  const rows = [];
  for (const r of readings) {
    const v = validReading(r);
    if (!v) throw badRequest("Each reading needs valid numeric lat/lng.", "invalid_reading");
    if (v.client_id) {
      if (seen.has(v.client_id)) continue;
      seen.add(v.client_id);
    }
    rows.push({ ...v, trip_id: activeTrip.id });
  }

  // 5. Store readings idempotently (ON CONFLICT (client_id) DO NOTHING).
  const insertRows = rows.map(({ _accel, ...row }) => row);
  const { data: stored, error: insErr } = await fleetDb
    .from("sensor_readings")
    .upsert(insertRows, { onConflict: "client_id", ignoreDuplicates: true })
    .select("id, client_id");
  if (insErr) throw fromDbError(insErr, "store readings");
  const storedCount = stored?.length || 0;

  // 6. Raise incident alerts for newly-stored readings with an acceleration spike.
  const storedClientIds = new Set((stored || []).map((s) => s.client_id).filter(Boolean));
  const alertRows = rows
    .filter((r) => r._accel != null && r._accel >= env.ingestAccelThreshold && (!r.client_id || storedClientIds.has(r.client_id)))
    .map((r) => ({
      trip_id: activeTrip.id,
      vehicle_id: device.vehicle_id,
      alert_type: "harsh_acceleration",
      accel_spike_value: r._accel,
      gps_lat: r.lat,
      gps_lng: r.lng,
      triggered_at: r.recorded_at,
      acknowledged: false,
    }));
  let alertsCreated = 0;
  if (alertRows.length) {
    const { data: alerts, error: alertErr } = await fleetDb.from("incident_alerts").insert(alertRows).select("id");
    if (!alertErr) alertsCreated = alerts?.length || 0;
  }

  return {
    ...base,
    trip_id: activeTrip.id,
    stored: storedCount,
    duplicates: rows.length - storedCount,
    alerts_created: alertsCreated,
  };
}
