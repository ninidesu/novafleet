import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireRole } from "../middleware/auth.js";
import * as drivers from "../services/driver.service.js";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => res.json(await drivers.listDrivers())));
router.get("/assignable-vehicles", asyncHandler(async (_req, res) => res.json(await drivers.listAssignableVehicles())));

router.post("/:id/assign", requireRole("admin"), asyncHandler(async (req, res) => {
  await drivers.assignDriverToVehicle(req.params.id, req.body.vehicleId || "");
  res.status(204).end();
}));

router.post("/", requireRole("admin"), asyncHandler(async (req, res) => res.status(201).json(await drivers.createDriver(req.body))));
router.patch("/:id", requireRole("admin"), asyncHandler(async (req, res) => res.json(await drivers.updateDriver(req.params.id, req.body))));
router.patch("/:id/status", requireRole("admin"), asyncHandler(async (req, res) => res.json(await drivers.changeDriverStatus(req.params.id, req.body.status))));
router.delete("/:id", requireRole("admin"), asyncHandler(async (req, res) => { await drivers.removeDriver(req.params.id); res.status(204).end(); }));

export default router;
