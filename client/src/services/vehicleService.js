import { api, pollingSubscription } from "./api.js";

export function listVehicles() {
  return api.get("/vehicles");
}

export function listVehicleDrivers() {
  return api.get("/vehicles/drivers");
}

export function createVehicle(values) {
  return api.post("/vehicles", values);
}

export function updateVehicle(id, values) {
  return api.patch(`/vehicles/${id}`, values);
}

export function changeVehicleStatus(id, status) {
  return api.patch(`/vehicles/${id}/status`, { status });
}

export function removeVehicle(id) {
  return api.delete(`/vehicles/${id}`);
}

export function subscribeToVehicles(onChange) {
  return pollingSubscription(onChange);
}
