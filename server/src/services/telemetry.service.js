import { fleetDb } from "../config/supabase.js";
import { badRequest, fromDbError } from "../lib/httpError.js";

// Insert a single GPS/telemetry reading for a trip. Used by ESP32 firmware and
// the route simulator. Returns the stored row.
export async function insertSensorReading({ tripId, lat, lng, speedKmh, source, recordedAt }) {
  if (!tripId) throw badRequest("tripId is required.");
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw badRequest("lat and lng must be valid numbers.");
  }
  const { data, error } = await fleetDb
    .from("sensor_readings")
    .insert({
      trip_id: tripId,
      recorded_at: recordedAt || new Date().toISOString(),
      lat: latitude,
      lng: longitude,
      speed_kmh: speedKmh == null ? null : Number(speedKmh),
      source: source || "api",
    })
    .select("id, trip_id, recorded_at, lat, lng, speed_kmh, source")
    .single();
  if (error) throw fromDbError(error, "sensor reading");
  return data;
}
