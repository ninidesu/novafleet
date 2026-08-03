import { listFleetRecords } from "../lib/fleetQuery.js";
export function listIncidentAlerts(limit = 50) { return listFleetRecords("incident_alerts", { limit, orderBy: "triggered_at" }); }