import { supabase } from "../lib/supabase.js";

// Base URL for the Express REST API. Defaults to "/api" which the Vite dev
// server proxies to the backend; in production set VITE_API_URL to the
// deployed API origin, e.g. https://novafleet-api.onrender.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request(path, { method = "GET", body, headers, ...rest } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body != null ? { "Content-Type": "application/json" } : {}),
      ...(await authHeader()),
      ...(headers || {}),
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
    ...rest,
  });

  if (response.status === 204) return null;

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload?.code);
  }
  return payload;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

// Polling-based replacement for the previous Supabase realtime subscriptions.
// Returns an unsubscribe function, matching the old subscribe* signatures.
export function pollingSubscription(onChange, intervalMs = 15000) {
  const timer = setInterval(() => {
    Promise.resolve(onChange()).catch(() => {});
  }, intervalMs);
  return () => clearInterval(timer);
}
