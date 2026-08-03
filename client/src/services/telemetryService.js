import { listFleetRecords } from "../lib/fleetQuery.js";
export function listSensorReadings(limit = 100) { return listFleetRecords("sensor_readings", { limit, orderBy: "recorded_at" }); }