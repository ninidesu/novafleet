import { fleetDb } from "../config/supabase.js";
import { fromDbError } from "../lib/httpError.js";
import { titleCase } from "../lib/format.js";

export async function getFleetNotifications() {
  const { data, error } = await fleetDb
    .from("incident_alerts")
    .select("id, alert_type, triggered_at, acknowledged, vehicle:vehicles!incident_alerts_vehicle_id_fkey(plate_number)")
    .order("triggered_at", { ascending: false })
    .limit(12);
  if (error) throw fromDbError(error, "notifications");
  return (data || []).map((alert) => ({
    id: alert.id,
    title: titleCase(alert.alert_type, "Incident alert"),
    vehicle: alert.vehicle?.plate_number || "Unknown vehicle",
    timestamp: alert.triggered_at,
    acknowledged: Boolean(alert.acknowledged),
  }));
}
