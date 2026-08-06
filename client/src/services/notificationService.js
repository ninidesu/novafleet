import { api, pollingSubscription } from "./api.js";

export function getFleetNotifications() {
  return api.get("/notifications");
}

export function subscribeToFleetNotifications(onChange) {
  return pollingSubscription(onChange, 20000);
}
