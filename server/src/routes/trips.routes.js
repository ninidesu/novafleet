import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { notFound } from "../lib/httpError.js";
import * as trips from "../services/trip.service.js";
import { insertSensorReading } from "../services/telemetry.service.js";

const router = Router();

// Static paths before "/:id" so they are not captured as ids.
router.get("/options", asyncHandler(async (_req, res) => res.json(await trips.getTripOptions())));
router.get("/", asyncHandler(async (_req, res) => res.json(await trips.listTrips())));

router.get("/:id", asyncHandler(async (req, res) => {
  const trip = await trips.getTripById(req.params.id);
  if (!trip) throw notFound("Trip not found.");
  res.json(trip);
}));

router.post("/", asyncHandler(async (req, res) => res.status(201).json(await trips.createTrip(req.body))));
router.patch("/:id", asyncHandler(async (req, res) => res.json(await trips.updateTrip(req.params.id, req.body))));
router.post("/:id/cancel", asyncHandler(async (req, res) => res.json(await trips.cancelTrip(req.params.id))));
router.post("/:id/start", asyncHandler(async (req, res) => res.json(await trips.startTrip(req.params.id))));
router.post("/:id/complete", asyncHandler(async (req, res) => res.json(await trips.completeTrip(req.params.id))));

// Telemetry ingestion for a trip (route simulator + ESP32 firmware).
router.post("/:id/sensor-readings", asyncHandler(async (req, res) => {
  const reading = await insertSensorReading({
    tripId: req.params.id,
    lat: req.body.lat,
    lng: req.body.lng,
    speedKmh: req.body.speed_kmh ?? req.body.speedKmh,
    source: req.body.source,
    recordedAt: req.body.recorded_at ?? req.body.recordedAt,
  });
  res.status(201).json(reading);
}));

export default router;
