import { fleetDb } from "../config/supabase.js";
import { badRequest, forbidden, fromDbError, notFound } from "../lib/httpError.js";
import { normalizeRoute, titleCase } from "../lib/format.js";

const INACTIVE_TRIP = new Set(["completed", "complete", "cancelled", "canceled"]);

const TRIP_SELECT =
  "id, vehicle_id, driver_id, origin, destination, planned_route_polyline, dispatch_time, start_time, end_time, status, purpose, vehicle:vehicles!trips_vehicle_id_fkey(id, plate_number, model, vehicle_type)";

function tripState(row) {
  const status = String(row.status || "").toLowerCase();
  if (INACTIVE_TRIP.has(status)) return "completed";
  if (row.start_time && !row.end_time) return "active";
  return "upcoming";
}

function mapTrip(row) {
  return {
    id: row.id,
    tripCode: row.id.slice(0, 8).toUpperCase(),
    origin: row.origin || "Not specified",
    destination: row.destination || "Not specified",
    route: `${row.origin || "Origin"} → ${row.destination || "Destination"}`,
    status: titleCase(row.status, "Dispatched"),
    state: tripState(row),
    vehicle: row.vehicle?.plate_number || "Unassigned",
    vehicleModel: row.vehicle?.model || "",
    purpose: row.purpose || "No purpose recorded",
    dispatchTime: row.dispatch_time,
    startTime: row.start_time,
    endTime: row.end_time,
  };
}

// The driver's own profile + assigned vehicle.
export async function getDriverProfile(driver) {
  const { data, error } = await fleetDb
    .from("drivers")
    .select("id, full_name, license_number, contact_number, status, vehicles!vehicles_assigned_driver_id_fkey(id, plate_number, model, vehicle_type, status)")
    .eq("id", driver.id)
    .single();
  if (error) throw fromDbError(error, "driver profile");
  const vehicle = data.vehicles?.[0];
  return {
    id: data.id,
    name: data.full_name,
    licenseNumber: data.license_number || "Not recorded",
    contactNumber: data.contact_number || "Not recorded",
    status: titleCase(data.status, "Inactive"),
    vehicle: vehicle
      ? { id: vehicle.id, plateNumber: vehicle.plate_number, model: vehicle.model || "", vehicleType: titleCase(vehicle.vehicle_type, "Vehicle"), status: titleCase(vehicle.status) }
      : null,
  };
}

// All of the driver's trips, grouped for the mobile home/assignments screens.
export async function getAssignments(driver) {
  const { data, error } = await fleetDb
    .from("trips")
    .select(TRIP_SELECT)
    .eq("driver_id", driver.id)
    .order("dispatch_time", { ascending: false });
  if (error) throw fromDbError(error, "assignments");
  const trips = (data || []).map(mapTrip);
  return {
    active: trips.find((t) => t.state === "active") || null,
    upcoming: trips.filter((t) => t.state === "upcoming"),
    history: trips.filter((t) => t.state === "completed"),
  };
}

async function requireOwnedTrip(driver, tripId) {
  const { data, error } = await fleetDb.from("trips").select(TRIP_SELECT).eq("id", tripId).maybeSingle();
  if (error) throw fromDbError(error, "trip");
  if (!data) throw notFound("Trip not found.");
  if (data.driver_id !== driver.id) throw forbidden("This trip is not assigned to you.");
  return data;
}

export async function getTrip(driver, tripId) {
  const row = await requireOwnedTrip(driver, tripId);
  const base = mapTrip(row);

  // Coordinates for the map: planned route + actual GPS trail + latest position.
  const plannedRoute = normalizeRoute(row.planned_route_polyline);
  const { data: readings, error } = await fleetDb
    .from("sensor_readings")
    .select("lat, lng, recorded_at")
    .eq("trip_id", tripId)
    .order("recorded_at", { ascending: true });
  if (error) throw fromDbError(error, "trip telemetry");
  const path = (readings || [])
    .map((r) => [Number(r.lat), Number(r.lng)])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  const position = path.length ? path[path.length - 1] : plannedRoute[0] || null;

  return { ...base, plannedRoute, path, position };
}

async function setState(driver, tripId, updates) {
  await requireOwnedTrip(driver, tripId);
  const { data, error } = await fleetDb.from("trips").update(updates).eq("id", tripId).select(TRIP_SELECT).single();
  if (error) throw fromDbError(error, "update trip");
  return mapTrip(data);
}

export function startTrip(driver, tripId) {
  return setState(driver, tripId, { status: "active", start_time: new Date().toISOString() });
}

export function completeTrip(driver, tripId) {
  return setState(driver, tripId, { status: "completed", end_time: new Date().toISOString() });
}

// The driver's current active trip + assigned vehicle, for creating records.
async function activeTripAndVehicle(driver) {
  const { data, error } = await fleetDb
    .from("trips")
    .select("id, vehicle_id, end_time, status")
    .eq("driver_id", driver.id)
    .is("end_time", null)
    .order("dispatch_time", { ascending: false });
  if (error) throw fromDbError(error, "active trip");
  const active = (data || []).find((t) => !INACTIVE_TRIP.has(String(t.status || "").toLowerCase()));
  return active || null;
}

export async function reportIncident(driver, { type, note, lat, lng, clientId }) {
  const trip = await activeTripAndVehicle(driver);
  if (!trip) throw badRequest("You have no active trip to report an incident for.", "no_active_trip");
  const { data, error } = await fleetDb
    .from("incident_alerts")
    .insert({
      trip_id: trip.id,
      vehicle_id: trip.vehicle_id,
      alert_type: type || "driver_report",
      gps_lat: lat == null ? null : Number(lat),
      gps_lng: lng == null ? null : Number(lng),
      triggered_at: new Date().toISOString(),
      acknowledged: false,
    })
    .select("id")
    .single();
  if (error) throw fromDbError(error, "report incident");
  return { id: data.id, tripId: trip.id, note: note || null };
}

export async function logFuel(driver, { liters, cost, odometerKm }) {
  const trip = await activeTripAndVehicle(driver);
  const vehicleId = trip?.vehicle_id || (await getDriverProfile(driver)).vehicle?.id || null;
  if (!vehicleId) throw badRequest("No vehicle is associated with your account.", "no_vehicle");
  const { data, error } = await fleetDb
    .from("fuel_logs")
    .insert({
      trip_id: trip?.id || null,
      vehicle_id: vehicleId,
      liters: liters == null ? null : Number(liters),
      cost: cost == null ? null : Number(cost),
      odometer_km: odometerKm == null ? null : Number(odometerKm),
      logged_at: new Date().toISOString(),
      source: "mobile",
    })
    .select("id")
    .single();
  if (error) throw fromDbError(error, "log fuel");
  return { id: data.id, tripId: trip?.id || null };
}

export async function getNotifications(driver) {
  // Alerts on the driver's own trips.
  const trips = await fleetDb.from("trips").select("id").eq("driver_id", driver.id);
  if (trips.error) throw fromDbError(trips.error, "notifications");
  const tripIds = (trips.data || []).map((t) => t.id);
  if (!tripIds.length) return [];
  const { data, error } = await fleetDb
    .from("incident_alerts")
    .select("id, alert_type, triggered_at, acknowledged")
    .in("trip_id", tripIds)
    .order("triggered_at", { ascending: false })
    .limit(20);
  if (error) throw fromDbError(error, "notifications");
  return (data || []).map((a) => ({
    id: a.id,
    title: titleCase(a.alert_type, "Alert"),
    timestamp: a.triggered_at,
    acknowledged: Boolean(a.acknowledged),
  }));
}
