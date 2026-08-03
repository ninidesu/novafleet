import { listFleetRecords } from "../lib/fleetQuery.js";
export function listDrivers(limit = 50) { return listFleetRecords("drivers", { limit, orderBy: "created_at" }); }