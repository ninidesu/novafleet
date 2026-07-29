export const VEHICLE_STATUSES = ["Moving", "Idle", "Stopped", "Offline"];
export const RISK_LEVELS = ["Low", "Medium", "High", "Critical"];
export const CONNECTION_STATUSES = ["Online", "Offline"];

export const fleetStatusConfig = {
  Moving: { color: "#15803D", symbol: "M" },
  Idle: { color: "#D97706", symbol: "I" },
  Stopped: { color: "#B91C1C", symbol: "S" },
  Offline: { color: "#64748B", symbol: "X" },
};

export function getVehicleFreshness(vehicle, now = Date.now()) {
  if (vehicle.status === "Offline" || vehicle.gpsStatus === "Offline") return "Offline";
  const ageSeconds = Math.max(0, (now - vehicle.updatedAt) / 1000);
  if (ageSeconds <= 10) return "Live";
  if (ageSeconds <= 60) return "Recently Updated";
  return "Delayed";
}
