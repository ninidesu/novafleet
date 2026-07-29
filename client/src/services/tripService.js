import { supabase } from "./supabase.js";

const TRIP_SELECT = `
  id, vehicle_id, driver_id, origin, destination, planned_route_polyline,
  dispatch_time, start_time, end_time, status, purpose,
  vehicle:vehicles!trips_vehicle_id_fkey(id, plate_number, model, status),
  driver:drivers!trips_driver_id_fkey(id, full_name, status),
  incident_alerts(id, alert_type, triggered_at, acknowledged),
  route_anomalies(id, max_deviation_meters, deviation_duration_min, flagged_at),
  risk_scores(id, total_risk_score, flagged, reviewed_at)
`;

function titleCase(value, fallback = "Unknown") {
  return value ? String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : fallback;
}

function normalizeRoute(route) {
  if (!route) return [];
  const coordinates = Array.isArray(route) ? route : route.coordinates;
  if (!Array.isArray(coordinates)) return [];
  return coordinates.map((point) => {
    if (!Array.isArray(point) || point.length < 2) return null;
    const first = Number(point[0]); const second = Number(point[1]);
    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
    return Math.abs(first) > 90 ? [second, first] : [first, second];
  }).filter(Boolean);
}

function riskLevel(score) {
  const value = Number(score || 0);
  if (value >= 80) return "Critical";
  if (value >= 60) return "High";
  if (value >= 30) return "Medium";
  return "Low";
}

function routeStatus(row) {
  const status = String(row.status || "").toLowerCase();
  if (["completed", "complete"].includes(status)) return "Completed";
  if (["cancelled", "canceled"].includes(status)) return "Cancelled";
  if (row.route_anomalies?.length) return "Deviation";
  if (row.start_time && !row.end_time) return "On Route";
  return "Planned";
}

function mapTrip(row, readings = []) {
  const plannedRoute = normalizeRoute(row.planned_route_polyline);
  const actualRoute = readings.map((reading) => [Number(reading.lat), Number(reading.lng)]).filter(([lat,lng]) => Number.isFinite(lat) && Number.isFinite(lng));
  const latestReading = readings.at(-1);
  const latestRisk = [...(row.risk_scores || [])].sort((a,b) => Number(b.total_risk_score || 0) - Number(a.total_risk_score || 0))[0];
  const originCoordinates = plannedRoute[0] || actualRoute[0] || null;
  const destinationCoordinates = plannedRoute.at(-1) || actualRoute.at(-1) || null;
  const timeline = [
    row.dispatch_time && { id: "dispatch", title: "Trip dispatched", timestamp: new Date(row.dispatch_time).toLocaleString(), description: `${row.origin || "Origin"} to ${row.destination || "destination"}`, severity: "Low" },
    row.start_time && { id: "start", title: "Trip started", timestamp: new Date(row.start_time).toLocaleString(), description: "Active trip monitoring began.", severity: "Low" },
    ...(row.route_anomalies || []).map((item) => ({ id: item.id, title: "Route anomaly recorded", timestamp: new Date(item.flagged_at).toLocaleString(), description: `${item.max_deviation_meters || 0} m maximum deviation`, severity: "High" })),
    ...(row.incident_alerts || []).map((item) => ({ id: item.id, title: titleCase(item.alert_type, "Incident alert"), timestamp: new Date(item.triggered_at).toLocaleString(), description: item.acknowledged ? "Acknowledged" : "Awaiting acknowledgement", severity: item.acknowledged ? "Low" : "High" })),
    row.end_time && { id: "end", title: "Trip completed", timestamp: new Date(row.end_time).toLocaleString(), description: "Trip was marked complete.", severity: "Low" },
  ].filter(Boolean);
  return {
    id: row.id, tripCode: row.id.slice(0,8).toUpperCase(), vehicleId: row.vehicle_id, driverId: row.driver_id,
    vehicleCode: row.vehicle_id.slice(0,8), plateNumber: row.vehicle?.plate_number || "Unassigned", driverName: row.driver?.full_name || "Unassigned",
    origin: row.origin || "Not specified", destination: row.destination || "Not specified", scheduledDeparture: row.dispatch_time || "",
    actualDeparture: row.start_time || "", actualArrival: row.end_time || "", status: titleCase(row.status, "Dispatched"), routeStatus: routeStatus(row), purpose: row.purpose || "No purpose recorded",
    alertCount: row.incident_alerts?.length || 0, deviationCount: row.route_anomalies?.length || 0, riskScore: Number(latestRisk?.total_risk_score || 0), riskLevel: riskLevel(latestRisk?.total_risk_score),
    speed: Number(latestReading?.speed_kmh || 0), lastGpsUpdate: latestReading?.recorded_at ? new Date(latestReading.recorded_at).toLocaleString() : "No telemetry", gpsStatus: latestReading ? "Online" : "Offline",
    plannedRoute, actualRoute, deviationRoute: [], originCoordinates, destinationCoordinates, timeline,
  };
}

export async function getTrips() {
  const result = await supabase.from("trips").select(TRIP_SELECT).order("dispatch_time", { ascending: false });
  if (result.error) throw new Error(result.error.message);
  return (result.data || []).map((row) => mapTrip(row));
}

export async function getTripById(id) {
  const result = await supabase.from("trips").select(TRIP_SELECT).eq("id", id).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;
  const readings = await supabase.from("sensor_readings").select("recorded_at, lat, lng, speed_kmh, source").eq("trip_id", id).order("recorded_at");
  if (readings.error) throw new Error(readings.error.message);
  return mapTrip(result.data, readings.data || []);
}

export async function getTripOptions() {
  const [vehicles, drivers] = await Promise.all([
    supabase.from("vehicles").select("id, plate_number, model, vehicle_type, status").order("plate_number"),
    supabase.from("drivers").select("id, full_name, status").order("full_name"),
  ]);
  if (vehicles.error) throw new Error(vehicles.error.message);
  if (drivers.error) throw new Error(drivers.error.message);
  return { vehicles: vehicles.data || [], drivers: drivers.data || [] };
}

function tripPayload(values) {
  return { vehicle_id: values.vehicleId, driver_id: values.driverId, origin: values.origin.trim(), destination: values.destination.trim(), dispatch_time: new Date(values.dispatchTime).toISOString(), purpose: values.purpose.trim(), planned_route_polyline: values.plannedRoute || null };
}

export async function createTrip(values) {
  const conflict = await hasOverlappingAssignment(values);
  if (conflict) throw new Error("The selected vehicle or driver already has an open trip.");
  const result = await supabase.from("trips").insert({ ...tripPayload(values), status: "dispatched" }).select("id").single();
  if (result.error) throw new Error(result.error.message);
  return getTripById(result.data.id);
}

export async function updateTrip(id, values) {
  const conflict = await hasOverlappingAssignment(values, id);
  if (conflict) throw new Error("The selected vehicle or driver already has an open trip.");
  const result = await supabase.from("trips").update(tripPayload(values)).eq("id", id).select("id").single();
  if (result.error) throw new Error(result.error.message);
  return getTripById(result.data.id);
}

async function setTripState(id, updates) {
  const result = await supabase.from("trips").update(updates).eq("id", id).select("id").single();
  if (result.error) throw new Error(result.error.message);
  return getTripById(result.data.id);
}

export const cancelTrip = (id) => setTripState(id, { status: "cancelled", end_time: new Date().toISOString() });
export const startTrip = (id) => setTripState(id, { status: "active", start_time: new Date().toISOString() });
export const completeTrip = (id) => setTripState(id, { status: "completed", end_time: new Date().toISOString() });

export async function hasOverlappingAssignment({ vehicleId, driverId }, ignoredId) {
  if (!vehicleId || !driverId) return false;
  let query = supabase.from("trips").select("id").is("end_time", null).or(`vehicle_id.eq.${vehicleId},driver_id.eq.${driverId}`).limit(1);
  if (ignoredId) query = query.neq("id", ignoredId);
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data?.length);
}

export function subscribeToTrips(onChange) {
  const channel = supabase.channel("fleet-trip-updates").on("postgres_changes", { event: "*", schema: "fleet", table: "trips" }, onChange).subscribe();
  return () => supabase.removeChannel(channel);
}