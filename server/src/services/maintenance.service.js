import { fleetDb } from "../config/supabase.js";
import { fromDbError } from "../lib/httpError.js";
import { currency, titleCase } from "../lib/format.js";

const SELECT =
  "id,vehicle_id,maintenance_type,service_date,cost,notes,vehicle:vehicles!maintenance_records_vehicle_id_fkey(id,plate_number,model,status)";

function mapRecord(row) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const serviceDate = row.service_date ? new Date(`${row.service_date}T00:00:00`) : null;
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicle: row.vehicle?.plate_number || "Unknown vehicle",
    vehicleModel: row.vehicle?.model || "",
    vehicleStatus: titleCase(row.vehicle?.status || "Unknown"),
    maintenanceType: titleCase(row.maintenance_type, "Maintenance"),
    serviceDateValue: row.service_date || "",
    serviceDate: serviceDate ? serviceDate.toLocaleDateString() : "Not recorded",
    scheduleStatus: serviceDate && serviceDate > today ? "Scheduled" : "Recorded",
    costValue: row.cost ?? "",
    cost: currency(row.cost),
    notes: row.notes || "",
  };
}

function payload(values) {
  return {
    vehicle_id: values.vehicleId,
    maintenance_type: String(values.maintenanceType || "").trim(),
    service_date: values.serviceDate,
    cost: values.cost === "" || values.cost == null ? null : Number(values.cost),
    notes: String(values.notes || "").trim() || null,
  };
}

function translate(error) {
  if (error.code === "23503") return fromDbError({ code: "23503", message: "The selected vehicle no longer exists." });
  return fromDbError(error, "maintenance record");
}

export async function listMaintenanceRecords() {
  const { data, error } = await fleetDb.from("maintenance_records").select(SELECT).order("service_date", { ascending: false });
  if (error) throw translate(error);
  return (data || []).map(mapRecord);
}

export async function listMaintenanceVehicles() {
  const { data, error } = await fleetDb.from("vehicles").select("id,plate_number,model,status").order("plate_number");
  if (error) throw translate(error);
  return data || [];
}

export async function createMaintenanceRecord(values) {
  const { data, error } = await fleetDb.from("maintenance_records").insert(payload(values)).select(SELECT).single();
  if (error) throw translate(error);
  return mapRecord(data);
}

export async function updateMaintenanceRecord(id, values) {
  const { data, error } = await fleetDb.from("maintenance_records").update(payload(values)).eq("id", id).select(SELECT).single();
  if (error) throw translate(error);
  return mapRecord(data);
}

export async function removeMaintenanceRecord(id) {
  const { error } = await fleetDb.from("maintenance_records").delete().eq("id", id);
  if (error) throw translate(error);
}
