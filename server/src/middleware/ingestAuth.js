import { env } from "../config/env.js";

// Devices authenticate with a shared ingestion API key (X-API-Key header),
// NOT a user JWT — an ESP32 has no Supabase session. The key is provisioned to
// firmware/mobile out of band. Per-device keys are a future hardening step.
export function ingestAuth(req, res, next) {
  if (!env.ingestApiKey) {
    return res.status(503).json({ message: "Ingestion is not configured (INGEST_API_KEY unset).", code: "ingest_disabled" });
  }
  const headerKey = req.get("x-api-key") || (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (headerKey !== env.ingestApiKey) {
    return res.status(401).json({ message: "Invalid ingestion API key.", code: "invalid_api_key" });
  }
  next();
}
