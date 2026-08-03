import { listFleetRecords } from "../lib/fleetQuery.js";
export function listMaintenanceRecords(limit = 50) { return listFleetRecords("maintenance_records", { limit, orderBy: "service_date" }); }