import { listFleetRecords } from "../lib/fleetQuery.js";
export function listVehiclesForConnectionCheck(limit = 10) { return listFleetRecords("vehicles", { limit, orderBy: "created_at" }); }