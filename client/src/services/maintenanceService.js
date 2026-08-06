import { api, pollingSubscription } from "./api.js";

export function listMaintenanceRecords() {
  return api.get("/maintenance");
}

export function listMaintenanceVehicles() {
  return api.get("/maintenance/vehicles");
}

export function createMaintenanceRecord(values) {
  return api.post("/maintenance", values);
}

export function updateMaintenanceRecord(id, values) {
  return api.patch(`/maintenance/${id}`, values);
}

export function removeMaintenanceRecord(id) {
  return api.delete(`/maintenance/${id}`);
}

export function subscribeToMaintenance(onChange) {
  return pollingSubscription(onChange);
}
