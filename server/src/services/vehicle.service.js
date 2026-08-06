import { fleetDb } from "../config/supabase.js";
import { fromDbError } from "../lib/httpError.js";
import { titleCase } from "../lib/format.js";

const VEHICLE_SELECT =
  "id,plate_number,vehicle_type,model,status,assigned_driver_id,fuel_capacity_liters,odometer_km,created_at,assigned_driver:drivers!vehicles_assigned_driver_id_fkey(id,full_name)";

function mapVehicle(row) {
  return {
    id: row.id,
    plateNumber: row.plate_number,
    vehicleType: titleCase(row.vehicle_type, "Not specified"),
    model: row.model || "Not specified",
    status: titleCase(row.status, "Inactive"),
    assignedDriverId: row.assigned_driver_id || "",
    assignedDriver: row.assigned_driver?.full_name || "Unassigned",
    fuelCapacityValue: row.fuel_capacity_liters ?? "",
    fuelCapacity: row.fuel_capacity_liters == null ? "Not recorded" : `${Number(row.fuel_capacity_liters).toLocaleString()} L`,
    odometerValue: row.odometer_km ?? "",
    odometer: row.odometer_km == null ? "Not recorded" : `${Number(row.odometer_km).toLocaleString()} km`,
    createdAt: row.created_at,
  };
}

function payload(values) {
  const data = {
    plate_number: String(values.plateNumber || "").trim().toUpperCase(),
    vehicle_type: String(values.vehicleType || "").trim(),
    model: String(values.model || "").trim(),
    status: String(values.status || "").toLowerCase().replaceAll(" ", "_"),
    fuel_capacity_liters: values.fuelCapacity === "" || values.fuelCapacity == null ? null : Number(values.fuelCapacity),
    odometer_km: values.odometer === "" || values.odometer == null ? null : Number(values.odometer),
  };
  if (Object.hasOwn(values, "assignedDriverId")) data.assigned_driver_id = values.assignedDriverId || null;
  return data;
}

export async function listVehicles() {
  const { data, error } = await fleetDb.from("vehicles").select(VEHICLE_SELECT).order("plate_number");
  if (error) throw fromDbError(error, "list vehicles");
  return (data || []).map(mapVehicle);
}

export async function listVehicleDrivers() {
  const { data, error } = await fleetDb.from("drivers").select("id,full_name,status").order("full_name");
  if (error) throw fromDbError(error, "list drivers");
  return data || [];
}

export async function createVehicle(values) {
  const { data, error } = await fleetDb.from("vehicles").insert(payload(values)).select(VEHICLE_SELECT).single();
  if (error) throw translateVehicleError(error);
  return mapVehicle(data);
}

export async function updateVehicle(id, values) {
  const { data, error } = await fleetDb.from("vehicles").update(payload(values)).eq("id", id).select(VEHICLE_SELECT).single();
  if (error) throw translateVehicleError(error);
  return mapVehicle(data);
}

export async function changeVehicleStatus(id, status) {
  const normalized = String(status || "").toLowerCase().replaceAll(" ", "_");
  const { data, error } = await fleetDb.from("vehicles").update({ status: normalized }).eq("id", id).select(VEHICLE_SELECT).single();
  if (error) throw translateVehicleError(error);
  return mapVehicle(data);
}

export async function removeVehicle(id) {
  const { error } = await fleetDb.from("vehicles").delete().eq("id", id);
  if (error) throw translateVehicleError(error);
}

function translateVehicleError(error) {
  if (error.code === "23505") return fromDbError({ code: "23505", message: "That plate number is already registered." });
  if (error.code === "23503")
    return fromDbError({
      code: "23503",
      message: "This vehicle has related operational records and cannot be removed. Set its status to Inactive instead.",
    });
  return fromDbError(error, "vehicle");
}
