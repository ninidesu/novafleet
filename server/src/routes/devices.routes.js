import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireRole } from "../middleware/auth.js";
import * as devices from "../services/device.service.js";

// IoT device management is an administrator-only area.
const router = Router();
router.use(requireRole("admin"));

router.get("/", asyncHandler(async (_req, res) => res.json(await devices.listDevices())));
router.get("/vehicles", asyncHandler(async (_req, res) => res.json(await devices.listDeviceVehicles())));
router.post("/", asyncHandler(async (req, res) => res.status(201).json(await devices.createDevice(req.body))));
router.patch("/:id", asyncHandler(async (req, res) => res.json(await devices.updateDevice(req.params.id, req.body))));
router.delete("/:id", asyncHandler(async (req, res) => { await devices.removeDevice(req.params.id); res.status(204).end(); }));

export default router;
