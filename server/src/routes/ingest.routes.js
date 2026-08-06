import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { env } from "../config/env.js";
import { ingestAuth } from "../middleware/ingestAuth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { ingestTelemetry } from "../services/ingestion.service.js";

const router = Router();

// Unauthenticated liveness probe for devices to check connectivity.
router.get("/health", (_req, res) => res.json({ status: "ok", ingest: env.ingestApiKey ? "ready" : "unconfigured" }));

// Everything below requires the device API key + is rate-limited per device.
router.use(ingestAuth);
router.use(rateLimit({ max: env.ingestRateLimitPerMin }));

function singleFrom(body) {
  return {
    client_id: body.client_id,
    lat: body.lat,
    lng: body.lng,
    speed_kmh: body.speed_kmh,
    recorded_at: body.recorded_at,
    source: body.source,
    accel_spike: body.accel_spike,
  };
}

// Accepts either a batch ({ readings: [...] }) or a single reading (top-level
// lat/lng), plus an optional { device_status } heartbeat.
router.post("/telemetry", asyncHandler(async (req, res) => {
  const body = req.body || {};
  let readings = [];
  if (Array.isArray(body.readings)) readings = body.readings;
  else if (body.lat != null || body.lng != null) readings = [singleFrom(body)];

  const result = await ingestTelemetry({
    deviceUid: body.device_uid,
    deviceStatus: body.device_status,
    readings,
  });
  res.status(200).json(result);
}));

export default router;
