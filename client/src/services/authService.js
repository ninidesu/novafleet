import { getRoleLabel, normalizeStoredRole } from "../config/roles.js";
import { publicSchema, supabase } from "./supabase.js";

export class ProfileNotFoundError extends Error { constructor() { super("Your account is authenticated but is not configured for the NovaFleet workspace."); this.name = "ProfileNotFoundError"; } }
export class UnsupportedRoleError extends Error { constructor() { super("Your NovaFleet account does not have an approved role."); this.name = "UnsupportedRoleError"; } }

let currentApplicationSession = null;

function getInitials(name) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export async function getProfileForUser(authUser) {
  const { data: profile, error } = await publicSchema
    .from("profiles")
    .select("id, full_name, role, module, created_at")
    .eq("id", authUser.id)
    .eq("module", "fleet")
    .maybeSingle();

  if (error) throw new Error(`Unable to load your NovaFleet profile: ${error.message}`);
  if (!profile) throw new ProfileNotFoundError();

  const role = normalizeStoredRole(profile.role);
  if (!role) throw new UnsupportedRoleError();

  return { ...profile, role, storedRole: profile.role };
}

export function buildApplicationUser(authUser, profile) {
  const name = profile.full_name?.trim() || authUser.email || "NovaFleet User";
  return { id: authUser.id, email: authUser.email, name, initials: getInitials(name), role: profile.role, roleLabel: getRoleLabel(profile.role), module: profile.module };
}

export function setApplicationSession(user) { currentApplicationSession = user; }
export function getSession() { return currentApplicationSession; }

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