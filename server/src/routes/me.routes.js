import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { currentProfile, updateProfileName } from "../services/profile.service.js";

const router = Router();

router.get("/", (req, res) => res.json(currentProfile(req.auth)));
router.patch("/", asyncHandler(async (req, res) => res.json(await updateProfileName(req.auth, req.body.fullName))));

export default router;
