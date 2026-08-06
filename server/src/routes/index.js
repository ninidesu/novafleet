import { Router } from "express";
import { requireAuth, requireStaff } from "../middleware/auth.js";
import ingestRouter from "./ingest.routes.js";
import driverRouter from "./driver.routes.js";
import meRouter from "./me.routes.js";
import vehiclesRouter from "./vehicles.routes.js";
import driversRouter from "./drivers.routes.js";
import tripsRouter from "./trips.routes.js";
import devicesRouter from "./devices.routes.js";
import maintenanceRouter from "./maintenance.routes.js";
import {
  dashboardRouter,
  monitoringRouter,
  notificationsRouter,
  reportsRouter,
  settingsRouter,
} from "./misc.routes.js";

const api = Router();

// Health check is public (used by UptimeRobot / Render).
api.get("/health", (_req, res) => res.json({ status: "ok", service: "novafleet-api", time: new Date().toISOString() }));

// Device telemetry ingestion — authenticated by device API key, NOT a user JWT,
// so it is mounted before the requireAuth gate below.
api.use("/ingest", ingestRouter);

// Everything below requires a valid Supabase session with a fleet profile.
api.use(requireAuth);

// Driver-scoped mobile API (accessible to the 'driver' role). Mounted before
// the requireStaff gate so drivers can reach it but not the fleet-wide views.
api.use("/driver", driverRouter);

// The fleet-management API is staff-only (admin / dispatcher).
api.use(requireStaff);

api.use("/me", meRouter);
api.use("/vehicles", vehiclesRouter);
api.use("/drivers", driversRouter);
api.use("/trips", tripsRouter);
api.use("/devices", devicesRouter);
api.use("/maintenance", maintenanceRouter);
api.use("/dashboard", dashboardRouter);
api.use("/reports", reportsRouter);
api.use("/monitoring", monitoringRouter);
api.use("/notifications", notificationsRouter);
api.use("/settings", settingsRouter);

export default api;
