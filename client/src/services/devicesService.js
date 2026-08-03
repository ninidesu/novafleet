import { listFleetRecords } from "../lib/fleetQuery.js";
export function listDevices(limit = 50) { return listFleetRecords("iot_devices", { limit, orderBy: "created_at" }); }