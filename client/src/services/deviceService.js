import { api, pollingSubscription } from "./api.js";

export function getDevices() {
  return api.get("/devices");
}

export function getDeviceVehicles() {
  return api.get("/devices/vehicles");
}

export function createDevice(values) {
  return api.post("/devices", values);
}

export function updateDevice(id, values) {
  return api.patch(`/devices/${id}`, values);
}

export function removeDevice(id) {
  return api.delete(`/devices/${id}`);
}

export function subscribeToDevices(onChange) {
  return pollingSubscription(onChange);
}
