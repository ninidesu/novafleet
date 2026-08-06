import { api } from "./api.js";

// Route & risk monitoring reads. Other former responsibilities of this module
// (vehicles, drivers, maintenance, profile) now live in their own REST-backed
// services and the /reports + /settings endpoints.
export function getRouteAnomalies() {
  return api.get("/monitoring/route-anomalies");
}

export function getRiskScores() {
  return api.get("/monitoring/risk-scores");
}
