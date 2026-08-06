import { fleetDb } from "../config/supabase.js";
import { fromDbError } from "../lib/httpError.js";
import { currency, formatDateTime, titleCase } from "../lib/format.js";
import { listTrips } from "./trip.service.js";

function requireData(result, label) {
  if (result.error) throw fromDbError(result.error, label);
  return result.data || [];
}

// The Reports page consumes a leaner projection than the CRUD endpoints, so
// these mirror the original fleetResourceService report shapes exactly.
async function getReportVehicles() {
  const result = await fleetDb
    .from("vehicles")
    .select(
      "id, plate_number, vehicle_type, model, status, fuel_capacity_liters, odometer_km, created_at, assigned_driver:drivers!vehicles_assigned_driver_id_fkey(id, full_name)"
    )
    .order("plate_number");
  return requireData(result, "Vehicles").map((row) => ({
    id: row.id,
    plateNumber: row.plate_number,
    vehicleType: titleCase(row.vehicle_type, "Not specified"),
    model: row.model || "Not specified",
    assignedDriver: row.assigned_driver?.full_name || "Unassigned",
    status: titleCase(row.status),
    fuelCapacity: row.fuel_capacity_liters == null ? "Not recorded" : `${row.fuel_capacity_liters} L`,
    odometer: row.odometer_km == null ? "Not recorded" : `${Number(row.odometer_km).toLocaleString()} km`,
  }));
}

async function getReportDrivers() {
  const result = await fleetDb
    .from("drivers")
    .select(
      "id, full_name, license_number, contact_number, status, created_at, vehicles!vehicles_assigned_driver_id_fkey(id, plate_number)"
    )
    .order("full_name");
  return requireData(result, "Drivers").map((row) => ({
    id: row.id,
    name: row.full_name,
    licenseNumber: row.license_number || "Not recorded",
    contactNumber: row.contact_number || "Not recorded",
    assignedVehicle: row.vehicles?.[0]?.plate_number || "Unassigned",
    status: titleCase(row.status),
    createdAt: formatDateTime(row.created_at),
  }));
}

async function getReportMaintenance() {
  const result = await fleetDb
    .from("maintenance_records")
    .select("id, vehicle_id, maintenance_type, service_date, cost, notes, vehicle:vehicles!maintenance_records_vehicle_id_fkey(plate_number)")
    .order("service_date", { ascending: false });
  return requireData(result, "Maintenance").map((row) => ({
    id: row.id,
    vehicle: row.vehicle?.plate_number || "Unknown vehicle",
    maintenanceType: titleCase(row.maintenance_type, "Maintenance"),
    serviceDate: row.service_date ? new Date(`${row.service_date}T00:00:00`).toLocaleDateString() : "Not recorded",
    cost: currency(row.cost),
    notes: row.notes || "—",
  }));
}

async function getSafetyAlerts() {
  const result = await fleetDb
    .from("incident_alerts")
    .select(
      "id, trip_id, alert_type, accel_spike_value, triggered_at, acknowledged, vehicle:vehicles!incident_alerts_vehicle_id_fkey(plate_number)"
    )
    .order("triggered_at", { ascending: false });
  return requireData(result, "Safety alerts").map((row) => ({
    id: row.id,
    tripId: row.trip_id?.slice(0, 8).toUpperCase() || "Not linked",
    vehicle: row.vehicle?.plate_number || "Unknown vehicle",
    alertType: titleCase(row.alert_type, "Incident"),
    acceleration: row.accel_spike_value == null ? "Not recorded" : Number(row.accel_spike_value).toFixed(2),
    triggeredAt: formatDateTime(row.triggered_at),
    status: row.acknowledged ? "Acknowledged" : "Open",
  }));
}

export async function getOperationalReports() {
  const [trips, vehicles, drivers, safety, maintenance] = await Promise.all([
    listTrips(),
    getReportVehicles(),
    getReportDrivers(),
    getSafetyAlerts(),
    getReportMaintenance(),
  ]);
  return {
    trips: trips.map((row) => ({
      id: row.id,
      tripCode: row.tripCode,
      vehicle: row.plateNumber,
      driver: row.driverName,
      origin: row.origin,
      destination: row.destination,
      dispatchTime: formatDateTime(row.scheduledDeparture),
      status: row.status,
    })),
    vehicles,
    drivers,
    safety,
    maintenance,
  };
}
