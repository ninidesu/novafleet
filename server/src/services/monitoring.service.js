import { fleetDb } from "../config/supabase.js";
import { fromDbError } from "../lib/httpError.js";
import { formatDateTime, riskLevel } from "../lib/format.js";

function requireData(result, label) {
  if (result.error) throw fromDbError(result.error, label);
  return result.data || [];
}

export async function getRouteAnomalies() {
  const result = await fleetDb
    .from("route_anomalies")
    .select(
      "id, trip_id, max_deviation_meters, deviation_duration_min, flagged_at, trip:trips!route_anomalies_trip_id_fkey(id, vehicle:vehicles!trips_vehicle_id_fkey(plate_number), driver:drivers!trips_driver_id_fkey(full_name))"
    )
    .order("flagged_at", { ascending: false });
  return requireData(result, "Route deviations").map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    vehicle: row.trip?.vehicle?.plate_number || "Unknown vehicle",
    driver: row.trip?.driver?.full_name || "Unknown driver",
    detectedTime: formatDateTime(row.flagged_at),
    deviationDistance: row.max_deviation_meters == null ? "Not recorded" : `${Number(row.max_deviation_meters).toLocaleString()} m`,
    duration: row.deviation_duration_min == null ? "Not recorded" : `${row.deviation_duration_min} min`,
  }));
}

export async function getRiskScores() {
  const result = await fleetDb
    .from("risk_scores")
    .select(
      "id, trip_id, behavior_anomaly_score, route_deviation_score, fuel_ratio_anomaly_score, total_risk_score, flagged, reviewed_at, trip:trips!risk_scores_trip_id_fkey(id, driver:drivers!trips_driver_id_fkey(full_name), vehicle:vehicles!trips_vehicle_id_fkey(plate_number))"
    )
    .order("total_risk_score", { ascending: false });
  return requireData(result, "Risk scores").map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    driver: row.trip?.driver?.full_name || "Unknown driver",
    vehicle: row.trip?.vehicle?.plate_number || "Unknown vehicle",
    score: Number(row.total_risk_score || 0),
    riskLevel: riskLevel(row.total_risk_score),
    behaviorScore: Number(row.behavior_anomaly_score || 0),
    routeScore: Number(row.route_deviation_score || 0),
    fuelScore: Number(row.fuel_ratio_anomaly_score || 0),
    reviewStatus: row.reviewed_at ? "Reviewed" : row.flagged ? "Pending" : "Stable",
  }));
}
