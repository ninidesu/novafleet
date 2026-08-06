import { fleetDb, getUserFromToken, publicDb } from "../config/supabase.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { forbidden, unauthorized } from "../lib/httpError.js";

export function normalizeRole(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "admin" || normalized === "administrator") return "admin";
  if (normalized === "dispatcher") return "dispatcher";
  if (normalized === "driver") return "driver";
  return null;
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

// Verifies the Supabase access token and loads the caller's fleet profile.
// Populates req.auth = { user, profile, role }. Rejects tokens without a fleet
// profile or an approved role with a code the client maps to its account states.
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = bearerToken(req);
  if (!token) throw unauthorized("Missing bearer token.", "missing_token");

  const user = await getUserFromToken(token);
  if (!user) throw unauthorized("Invalid or expired session.", "invalid_token");

  const { data: profile, error } = await publicDb
    .from("profiles")
    .select("id, full_name, role, module, created_at")
    .eq("id", user.id)
    .eq("module", "fleet")
    .maybeSingle();

  if (error) throw unauthorized(`Unable to load profile: ${error.message}`, "profile_error");
  if (!profile) throw forbidden("Your account is not configured for the NovaFleet workspace.", "profile_not_found");

  const role = normalizeRole(profile.role);
  if (!role) throw forbidden("Your NovaFleet account does not have an approved role.", "unsupported_role");

  req.auth = { user, profile: { ...profile, role, storedRole: profile.role } };
  next();
});

// Restrict a route to specific normalized roles (e.g. requireRole("admin")).
export function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.auth?.profile?.role) return next(unauthorized());
    if (!allowed.includes(req.auth.profile.role)) {
      return next(forbidden("This action requires elevated privileges."));
    }
    next();
  };
}

// Staff-only gate (admin or dispatcher) for the fleet-management API. Keeps
// drivers — who authenticate for the mobile app — out of the whole-fleet views.
export const requireStaff = requireRole("admin", "dispatcher");

// Resolve the fleet.drivers record linked to the caller's profile and attach it
// as req.auth.driver. Used by the driver-scoped /api/driver routes.
export const requireDriver = asyncHandler(async (req, _res, next) => {
  const { data, error } = await fleetDb
    .from("drivers")
    .select("id, full_name, status, profile_id")
    .eq("profile_id", req.auth.profile.id)
    .maybeSingle();
  if (error) throw unauthorized(`Unable to load driver record: ${error.message}`, "driver_lookup_error");
  if (!data) throw forbidden("No driver record is linked to this account.", "driver_not_linked");
  req.auth.driver = data;
  next();
});
