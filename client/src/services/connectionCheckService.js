import { DatabaseError, normalizeDatabaseError } from "../lib/databaseError.js";
import { listVehiclesForConnectionCheck } from "./vehiclesService.js";

export async function checkFleetConnection() {
  try {
    const vehicles = await listVehiclesForConnectionCheck();
    return { status: vehicles.length ? "success_with_records" : "success_empty", recordCount: vehicles.length, vehicles };
  } catch (error) {
    const normalized = normalizeDatabaseError(error, "fleet.vehicles connection check");
    return { status: "failed", error: { message: normalized.message, code: normalized.code, details: normalized.details, hint: normalized.hint, kind: normalized.kind } };
  }
}

export function requireFleetConnection(result) {
  if (result.status === "failed") throw new DatabaseError(result.error.message, result.error);
  return result;
}