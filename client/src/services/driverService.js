import { api, pollingSubscription } from "./api.js";

export function listDrivers() {
  return api.get("/drivers");
}

export function listAssignableVehicles() {
  return api.get("/drivers/assignable-vehicles");
}

export function createDriver(values) {
  return api.post("/drivers", values);
}

export function updateDriver(id, values) {
  return api.patch(`/drivers/${id}`, values);
}

export function changeDriverStatus(id, status) {
  return api.patch(`/drivers/${id}/status`, { status });
}

export function removeDriver(id) {
  return api.delete(`/drivers/${id}`);
}

export function assignDriverToVehicle(driverId, vehicleId) {
  return api.post(`/drivers/${driverId}/assign`, { vehicleId: vehicleId || "" });
}

export function subscribeToDrivers(onChange) {
  return pollingSubscription(onChange);
}
