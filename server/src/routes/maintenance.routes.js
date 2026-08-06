import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireRole } from "../middleware/auth.js";
import * as maintenance from "../services/maintenance.service.js";

// Maintenance management is an administrator-only area.
const router = Router();
router.use(requireRole("admin"));

router.get("/", asyncHandler(async (_req, res) => res.json(await maintenance.listMaintenanceRecords())));
router.get("/vehicles", asyncHandler(async (_req, res) => res.json(await maintenance.listMaintenanceVehicles())));
router.post("/", asyncHandler(async (req, res) => res.status(201).json(await maintenance.createMaintenanceRecord(req.body))));
router.patch("/:id", asyncHandler(async (req, res) => res.json(await maintenance.updateMaintenanceRecord(req.params.id, req.body))));
router.delete("/:id", asyncHandler(async (req, res) => { await maintenance.removeMaintenanceRecord(req.params.id); res.status(204).end(); }));

export default router;
