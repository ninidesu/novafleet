import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireRole } from "../middleware/auth.js";
import * as vehicles from "../services/vehicle.service.js";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => res.json(await vehicles.listVehicles())));
router.get("/drivers", asyncHandler(async (_req, res) => res.json(await vehicles.listVehicleDrivers())));

router.post("/", requireRole("admin"), asyncHandler(async (req, res) => res.status(201).json(await vehicles.createVehicle(req.body))));
router.patch("/:id", requireRole("admin"), asyncHandler(async (req, res) => res.json(await vehicles.updateVehicle(req.params.id, req.body))));
router.patch("/:id/status", requireRole("admin"), asyncHandler(async (req, res) => res.json(await vehicles.changeVehicleStatus(req.params.id, req.body.status))));
router.delete("/:id", requireRole("admin"), asyncHandler(async (req, res) => { await vehicles.removeVehicle(req.params.id); res.status(204).end(); }));

export default router;
