export const roles = { admin: { label: "Administrator" }, dispatcher: { label: "Dispatcher" } };

export const allDashboardRoutes = ["/dashboard", "/live-fleet", "/vehicles", "/drivers", "/trips", "/route-risk-monitoring", "/devices", "/maintenance", "/reports", "/settings"];
export const rolePermissions = {
  admin: allDashboardRoutes,
  dispatcher: ["/dashboard", "/live-fleet", "/vehicles", "/drivers", "/trips", "/route-risk-monitoring", "/reports", "/settings"],
};
export const navigationGroups = [
  { label: "Overview", items: [{ label: "Dashboard", path: "/dashboard", icon: "OV" }] },
  { label: "Fleet Operations", items: [{ label: "Live Map", path: "/live-fleet", icon: "LF" }, { label: "Vehicles", path: "/vehicles", icon: "VH" }, { label: "Drivers", path: "/drivers", icon: "DR" }, { label: "Trips and Routes", path: "/trips", icon: "TR" }] },
  { label: "Monitoring", items: [{ label: "Route & Risk Monitoring", path: "/route-risk-monitoring", icon: "RM" }, { label: "IoT Devices", path: "/devices", icon: "IO" }] },
  { label: "Management", items: [{ label: "Maintenance", path: "/maintenance", icon: "MT" }, { label: "Reports", path: "/reports", icon: "RP" }] },
  { label: "System", items: [{ label: "Settings", path: "/settings", icon: "ST" }] },
];
export const tripActionPermissions = { admin: ["view", "create", "edit", "cancel", "start", "complete", "review"], dispatcher: ["view", "create", "edit", "cancel", "start", "complete", "add_note", "reroute", "resolve_alert"] };

export function normalizeStoredRole(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "admin" || normalized === "administrator") return "admin";
  if (normalized === "dispatcher") return "dispatcher";
  return null;
}
export function canPerformTripAction(role, action) { return Boolean(tripActionPermissions[role]?.includes(action)); }
export function isKnownRole(role) { return Boolean(roles[role]); }
export function getRoleLabel(role) { return roles[role]?.label || "Unknown Role"; }
export function canAccessRoute(role, path) { const normalizedPath = ["/route-deviations", "/risk-monitoring"].includes(path) ? "/route-risk-monitoring" : path; return Boolean(rolePermissions[role]?.some((route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`))); }
export function getNavigationForRole(role) { const allowedRoutes = rolePermissions[role] || []; return navigationGroups.map((group) => ({ ...group, items: group.items.filter((item) => allowedRoutes.includes(item.path)) })).filter((group) => group.items.length > 0); }