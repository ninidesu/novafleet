import { listFleetRecords } from "../lib/fleetQuery.js";
export function listTrips(limit = 50) { return listFleetRecords("trips", { limit, orderBy: "dispatch_time" }); }