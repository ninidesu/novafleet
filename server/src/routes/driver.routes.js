import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireDriver } from "../middleware/auth.js";
import * as driverApp from "../services/driverApp.service.js";

// Driver-scoped API for the mobile app. requireAuth already ran (so the caller
// is an authenticated fleet user); requireDriver resolves their driver record
// and rejects anyone without one.
const router = Router();
router.use(requireDriver);

router.get("/me", asyncHandler(async (req, res) => res.json(await driverApp.getDriverProfile(req.auth.driver))));
router.get("/assignments", asyncHandler(async (req, res) => res.json(await driverApp.getAssignments(req.auth.driver))));
router.get("/notifications", asyncHandler(async (req, res) => res.json(await driverApp.getNotifications(req.auth.driver))));

router.get("/trips/:id", asyncHandler(async (req, res) => res.json(await driverApp.getTrip(req.auth.driver, req.params.id))));
router.post("/trips/:id/start", asyncHandler(async (req, res) => res.json(await driverApp.startTrip(req.auth.driver, req.params.id))));
router.post("/trips/:id/complete", asyncHandler(async (req, res) => res.json(await driverApp.completeTrip(req.auth.driver, req.params.id))));

router.post("/incidents", asyncHandler(async (req, res) => res.status(201).json(await driverApp.reportIncident(req.auth.driver, req.body))));
router.post("/fuel-logs", asyncHandler(async (req, res) => res.status(201).json(await driverApp.logFuel(req.auth.driver, req.body))));

export default router;
