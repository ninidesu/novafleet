import { supabase } from "./supabase.js";

function titleCase(value, fallback = "Incident alert") {
  if (!value) return fallback;
  return String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function getFleetNotifications() {
  const { data, error } = await supabase
    .from("incident_alerts")
    .select("id, alert_type, triggered_at, acknowledged, vehicle:vehicles!incident_alerts_vehicle_id_fkey(plate_number)")
    .order("triggered_at", { ascending: false })
    .limit(12);
  if (error) throw new Error(error.message);
  return (data || []).map((alert) => ({
    id: alert.id,
    title: titleCase(alert.alert_type),
    vehicle: alert.vehicle?.plate_number || "Unknown vehicle",
    timestamp: alert.triggered_at,
    acknowledged: Boolean(alert.acknowledged),
  }));
}

export function subscribeToFleetNotifications(onChange) {
  const channel = supabase
    .channel(`topbar-notifications-${crypto.randomUUID()}`)
    .on("postgres_changes", { event: "*", schema: "fleet", table: "incident_alerts" }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
