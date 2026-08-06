import { api, pollingSubscription } from "./api.js";

export function getTrips() {
  return api.get("/trips");
}

export function getTripById(id) {
  return api.get(`/trips/${id}`);
}

export function getTripOptions() {
  return api.get("/trips/options");
}

export function createTrip(values) {
  return api.post("/trips", values);
}

export function updateTrip(id, values) {
  return api.patch(`/trips/${id}`, values);
}

export function cancelTrip(id) {
  return api.post(`/trips/${id}/cancel`);
}

export function startTrip(id) {
  return api.post(`/trips/${id}/start`);
}

export function completeTrip(id) {
  return api.post(`/trips/${id}/complete`);
}

export function subscribeToTrips(onChange) {
  return pollingSubscription(onChange);
}
