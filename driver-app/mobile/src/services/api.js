import { API_URL } from "../config";
import { supabase } from "../lib/supabase";

const BASE = `${API_URL}/api`;

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function authHeader() {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body, headers } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body != null ? { "Content-Type": "application/json" } : {}),
      ...(await authHeader()),
      ...(headers || {}),
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 204) return null;
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }
  if (!response.ok) {
    throw new ApiError(payload?.message || `Request failed (${response.status})`, response.status, payload?.code);
  }
  return payload;
}

// Driver-scoped API — everything the mobile app needs.
export const driverApi = {
  me: () => request("/driver/me"),
  assignments: () => request("/driver/assignments"),
  notifications: () => request("/driver/notifications"),
  trip: (id) => request(`/driver/trips/${id}`),
  startTrip: (id) => request(`/driver/trips/${id}/start`, { method: "POST" }),
  completeTrip: (id) => request(`/driver/trips/${id}/complete`, { method: "POST" }),
  reportIncident: (payload) => request("/driver/incidents", { method: "POST", body: payload }),
  logFuel: (payload) => request("/driver/fuel-logs", { method: "POST", body: payload }),
};

// Device/mobile telemetry ingestion (offline-sync path). Reused for GPS uploads.
export function postTelemetry(payload, apiKey) {
  return request("/ingest/telemetry", { method: "POST", body: payload, headers: { "X-API-Key": apiKey } });
}
