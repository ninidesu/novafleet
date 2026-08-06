import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getAdminDashboardData } from "../services/dashboard.service.js";
import { getOperationalReports } from "../services/report.service.js";
import { getRiskScores, getRouteAnomalies } from "../services/monitoring.service.js";
import { getFleetNotifications } from "../services/notification.service.js";
import { getSettingsWorkspace } from "../services/settings.service.js";

export const dashboardRouter = Router();
dashboardRouter.get("/", asyncHandler(async (_req, res) => res.json(await getAdminDashboardData())));

export const reportsRouter = Router();
reportsRouter.get("/", asyncHandler(async (_req, res) => res.json(await getOperationalReports())));

export const monitoringRouter = Router();
monitoringRouter.get("/route-anomalies", asyncHandler(async (_req, res) => res.json(await getRouteAnomalies())));
monitoringRouter.get("/risk-scores", asyncHandler(async (_req, res) => res.json(await getRiskScores())));

export const notificationsRouter = Router();
notificationsRouter.get("/", asyncHandler(async (_req, res) => res.json(await getFleetNotifications())));

export const settingsRouter = Router();
settingsRouter.get("/", asyncHandler(async (req, res) => {
  // Admin-only sections are gated server-side regardless of query params.
  const isAdmin = req.auth.profile.role === "admin";
  res.json(await getSettingsWorkspace(req.auth, { includeUsers: isAdmin, includeAudit: isAdmin }));
}));
