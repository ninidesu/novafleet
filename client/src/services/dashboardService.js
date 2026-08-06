import { api, pollingSubscription } from "./api.js";

export function getAdminDashboardData() {
  return api.get("/dashboard");
}

export function subscribeToAdminDashboard(onChange) {
  // The live map benefits from a tighter refresh cadence than the CRUD lists.
  return pollingSubscription(onChange, 10000);
}
