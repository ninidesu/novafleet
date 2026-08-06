import { getRoleLabel, normalizeStoredRole } from "../config/roles.js";
import { supabase } from "../lib/supabase.js";
import { ApiError, api } from "./api.js";

export class ProfileNotFoundError extends Error {
  constructor() {
    super("Your account is authenticated but is not configured for the NovaFleet workspace.");
    this.name = "ProfileNotFoundError";
  }
}
export class UnsupportedRoleError extends Error {
  constructor() {
    super("Your NovaFleet account does not have an approved role.");
    this.name = "UnsupportedRoleError";
  }
}

let currentApplicationSession = null;

function getInitials(name) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

// Resolve the caller's fleet profile via the REST API (which verifies the
// Supabase session server-side). Auth errors are translated back into the
// domain errors AuthContext already understands.
export async function getProfileForUser(_authUser) {
  let profile;
  try {
    profile = await api.get("/me");
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "profile_not_found") throw new ProfileNotFoundError();
      if (error.code === "unsupported_role") throw new UnsupportedRoleError();
    }
    throw new Error(error?.message || "Unable to load your NovaFleet profile.");
  }

  const role = normalizeStoredRole(profile.role);
  if (!role) throw new UnsupportedRoleError();
  return { ...profile, role, storedRole: profile.storedRole ?? profile.role };
}

export function buildApplicationUser(authUser, profile) {
  const name = profile.full_name?.trim() || authUser.email || "NovaFleet User";
  return {
    id: authUser.id,
    email: authUser.email,
    name,
    initials: getInitials(name),
    role: profile.role,
    roleLabel: getRoleLabel(profile.role),
    module: profile.module,
  };
}

export function setApplicationSession(user) {
  currentApplicationSession = user;
}
export function getSession() {
  return currentApplicationSession;
}

export async function signInWithPassword({ email, password }) {
  if (!email?.trim() || !password) throw new Error("Enter your email and password to continue.");
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(error.message || "Unable to sign in with those credentials.");
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  currentApplicationSession = null;
  if (error) throw new Error(error.message || "Unable to sign out.");
}
