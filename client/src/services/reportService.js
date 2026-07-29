import { getDrivers, getMaintenanceRecords, getVehicles } from "./fleetResourceService.js";
import { getTrips } from "./tripService.js";
import { supabase } from "./supabase.js";

function requireData(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data || [];
}
function titleCase(value, fallback = "Unknown") {
  return value ? String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : fallback;
}
function formatDate(value) { return value ? new Date(value).toLocaleString() : "Not recorded"; }

async function getSafetyAlerts() {
  const result = await supabase.from("incident_alerts").select("id, trip_id, alert_type, accel_spike_value, triggered_at, acknowledged, vehicle:vehicles!incident_alerts_vehicle_id_fkey(plate_number)").order("triggered_at", { ascending: false });
  return requireData(result, "Safety alerts").map((row) => ({
    id: row.id, tripId: row.trip_id?.slice(0, 8).toUpperCase() || "Not linked", vehicle: row.vehicle?.plate_number || "Unknown vehicle",
    alertType: titleCase(row.alert_type, "Incident"), acceleration: row.accel_spike_value == null ? "Not recorded" : Number(row.accel_spike_value).toFixed(2),
    triggeredAt: formatDate(row.triggered_at), status: row.acknowledged ? "Acknowledged" : "Open",
  }));
}

export async function getOperationalReports() {
  const [trips, vehicles, drivers, safety, maintenance] = await Promise.all([getTrips(), getVehicles(), getDrivers(), getSafetyAlerts(), getMaintenanceRecords()]);
  return {
    trips: trips.map((row) => ({ id: row.id, tripCode: row.tripCode, vehicle: row.plateNumber, driver: row.driverName, origin: row.origin, destination: row.destination, dispatchTime: formatDate(row.scheduledDeparture), status: row.status })),
    vehicles, drivers, safety, maintenance,
  };
}
