import { fleetDb } from "../config/supabase.js";
import { conflict, fromDbError } from "../lib/httpError.js";

const DEVICE_SELECT =
  "id,device_uid,device_name,device_type,serial_number,firmware_version,connection_status,gps_status,last_seen_at,installed_at,notes,vehicle_id,vehicles:vehicle_id(id,plate_number,model)";

function mapDevice(row) {
  const vehicle = Array.isArray(row.vehicles) ? row.vehicles[0] : row.vehicles;
  return {
    id: row.id,
    deviceUid: row.device_uid,
    name: row.device_name,
    type: row.device_type,
    serialNumber: row.serial_number || "...",
    firmwareVersion: row.firmware_version || "...",
    connectionStatus: row.connection_status,
    gpsStatus: row.gps_status,
    lastSeenAt: row.last_seen_at,
    installedAt: row.installed_at,
    notes: row.notes || "",
    vehicleId: row.vehicle_id || "",
    assignedVehicle: vehicle?.plate_number || "Unassigned",
    vehicleModel: vehicle?.model || "",
  };
}

function toPayload(v) {
  return {
    device_uid: String(v.deviceUid || "").trim(),
    device_name: String(v.name || "").trim(),
    device_type: v.type,
    serial_number: String(v.serialNumber || "").trim() || null,
    firmware_version: String(v.firmwareVersion || "").trim() || null,
    connection_status: v.connectionStatus,
    gps_status: v.gpsStatus,
    installed_at: v.installedAt || null,
    vehicle_id: v.vehicleId || null,
    notes: String(v.notes || "").trim() || null,
  };
}

function translate(error) {
  if (error.code === "23505") return conflict("That device ID or serial number is already registered.");
  return fromDbError(error, "device");
}

export async function listDevices() {
  const { data, error } = await fleetDb.from("iot_devices").select(DEVICE_SELECT).order("created_at", { ascending: false });
  if (error) throw translate(error);
  return (data || []).map(mapDevice);
}

export async function listDeviceVehicles() {
  const { data, error } = await fleetDb.from("vehicles").select("id,plate_number,model").order("plate_number");
  if (error) throw translate(error);
  return data || [];
}

export async function createDevice(values) {
  const { data, error } = await fleetDb.from("iot_devices").insert(toPayload(values)).select(DEVICE_SELECT).single();
  if (error) throw translate(error);
  return mapDevice(data);
}

export async function updateDevice(id, values) {
  const { data, error } = await fleetDb.from("iot_devices").update(toPayload(values)).eq("id", id).select(DEVICE_SELECT).single();
  if (error) throw translate(error);
  return mapDevice(data);
}

export async function removeDevice(id) {
  const { error } = await fleetDb.from("iot_devices").delete().eq("id", id);
  if (error) throw translate(error);
}
