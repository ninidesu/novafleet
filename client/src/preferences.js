export const APPEARANCE_KEY = "novafleet-appearance";
export const NOTIFICATION_PREFS_KEY = "novafleet-notification-preferences";
export const DEFAULT_APPEARANCE = { theme: "light", textSize: "default" };
export const DEFAULT_NOTIFICATIONS = { incidentAlerts: true, routeDeviations: true, maintenanceReminders: true, browserSound: false };
export function loadPreference(key, fallback) { try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || "{}") }; } catch { return fallback; } }
export function applyAppearance(preferences) {
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.dataset.textSize = preferences.textSize;
}
export function saveAppearance(preferences) { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(preferences)); applyAppearance(preferences); }
export function applyStoredAppearance() { applyAppearance(loadPreference(APPEARANCE_KEY, DEFAULT_APPEARANCE)); }
