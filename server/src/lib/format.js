// View-model formatting helpers, ported from the original client service layer
// so the REST responses match exactly what the React components expect.
// Locale is pinned to the Philippine context the app targets, keeping output
// deterministic regardless of the server's host locale/timezone.

const LOCALE = "en-PH";
const TIME_ZONE = "Asia/Manila";

export function titleCase(value, fallback = "Unknown") {
  return value
    ? String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : fallback;
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString(LOCALE, { timeZone: TIME_ZONE }) : "Not recorded";
}

export function formatDateTimeDetailed(value) {
  return value
    ? new Date(value).toLocaleString(LOCALE, { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "medium" })
    : "Not recorded";
}

// service_date is a plain date string (YYYY-MM-DD); render without timezone shift.
export function formatServiceDate(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString(LOCALE) : "Not recorded";
}

export function currency(value) {
  return value == null
    ? "Not recorded"
    : new Intl.NumberFormat(LOCALE, { style: "currency", currency: "PHP" }).format(Number(value));
}

export function riskLevel(score) {
  const value = Number(score || 0);
  if (value >= 80) return "Critical";
  if (value >= 60) return "High";
  if (value >= 30) return "Medium";
  return "Low";
}

// Normalize a stored polyline into [lat, lng] pairs, correcting [lng, lat] order.
export function normalizeRoute(route) {
  if (!route) return [];
  const coordinates = Array.isArray(route) ? route : route.coordinates;
  if (!Array.isArray(coordinates)) return [];
  return coordinates
    .map((point) => {
      if (!Array.isArray(point) || point.length < 2) return null;
      const first = Number(point[0]);
      const second = Number(point[1]);
      if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
      return Math.abs(first) > 90 ? [second, first] : [first, second];
    })
    .filter(Boolean);
}
