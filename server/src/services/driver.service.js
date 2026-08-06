import { fleetDb } from "../config/supabase.js";
import { conflict, fromDbError } from "../lib/httpError.js";
import { titleCase } from "../lib/format.js";

const DRIVER_SELECT =
  "id,profile_id,full_name,license_number,contact_number,status,created_at,vehicles!vehicles_assigned_driver_id_fkey(id,plate_number,model,status)";

function mapDriver(row) {
  const vehicle = row.vehicles?.[0];
  return {
    id: row.id,
    profileId: row.profile_id || "",
    name: row.full_name,
    licenseNumber: row.license_number || "Not recorded",
    contactNumber: row.contact_number || "Not recorded",
    status: titleCase(row.status, "Inactive"),
    assignedVehicleId: vehicle?.id || "",
    assignedVehicle: vehicle?.plate_number || "Unassigned",
    vehicleModel: vehicle?.model || "",
    createdAt: row.created_at,
  };
}

function translate(error) {
  if (error.code === "23505") return fromDbError({ code: "23505", message: "That license number is already registered." });
  if (error.code === "23503")
    return fromDbError({
      code: "23503",
      message: "This driver has related trip or fleet records and cannot be removed. Set the driver to Inactive instead.",
    });
  return fromDbError(error, "driver");
}

// Ensure a driver is assigned to at most one vehicle: clear prior assignment,
// then set the new one. Passing an empty vehicleId only clears.
export async function assignDriverToVehicle(driverId, vehicleId) {
  const clear = await fleetDb.from("vehicles").update({ assigned_driver_id: null }).eq("assigned_driver_id", driverId);
  if (clear.error) throw translate(clear.error);
  if (vehicleId) {
    const set = await fleetDb.from("vehicles").update({ assigned_driver_id: driverId }).eq("id", vehicleId);
    if (set.error) throw translate(set.error);
  }
}

export async function listDrivers() {
  const { data, error } = await fleetDb.from("drivers").select(DRIVER_SELECT).order("full_name");
  if (error) throw translate(error);
  return (data || []).map(mapDriver);
}

async function getDriverById(id) {
  const { data, error } = await fleetDb.from("drivers").select(DRIVER_SELECT).eq("id", id).single();
  if (error) throw translate(error);
  return mapDriver(data);
}

export async function listAssignableVehicles() {
  const { data, error } = await fleetDb
    .from("vehicles")
    .select("id,plate_number,model,status,assigned_driver_id")
    .order("plate_number");
  if (error) throw translate(error);
  return data || [];
}

function driverPayload(values) {
  return {
    full_name: String(values.name || "").trim(),
    license_number: String(values.licenseNumber || "").trim() || null,
    contact_number: String(values.contactNumber || "").trim() || null,
    status: String(values.status || "active").toLowerCase(),
  };
}

export async function createDriver(values) {
  const { data, error } = await fleetDb.from("drivers").insert(driverPayload(values)).select("id").single();
  if (error) throw translate(error);
  if (Object.hasOwn(values, "assignedVehicleId")) await assignDriverToVehicle(data.id, values.assignedVehicleId);
  return getDriverById(data.id);
}

export async function updateDriver(id, values) {
  const { error } = await fleetDb.from("drivers").update(driverPayload(values)).eq("id", id);
  if (error) throw translate(error);
  if (Object.hasOwn(values, "assignedVehicleId")) await assignDriverToVehicle(id, values.assignedVehicleId);
  return getDriverById(id);
}

export async function changeDriverStatus(id, status) {
  const { error } = await fleetDb.from("drivers").update({ status: String(status || "").toLowerCase() }).eq("id", id);
  if (error) throw translate(error);
  return getDriverById(id);
}

export async function removeDriver(id) {
  const [trips, baseline] = await Promise.all([
    fleetDb.from("trips").select("id", { count: "exact", head: true }).eq("driver_id", id),
    fleetDb.from("driver_baseline").select("id", { count: "exact", head: true }).eq("driver_id", id),
  ]);
  if (trips.error) throw translate(trips.error);
  if (baseline.error) throw translate(baseline.error);
  if ((trips.count || 0) > 0 || (baseline.count || 0) > 0) {
    throw conflict("This driver has operational history and cannot be removed. Set the driver to Inactive instead.");
  }
  await assignDriverToVehicle(id, "");
  const { error } = await fleetDb.from("drivers").delete().eq("id", id);
  if (error) throw translate(error);
}
