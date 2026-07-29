import { getRoleLabel, isKnownRole } from "../config/roles.js";
import { publicSchema, supabase } from "./supabase.js";

let currentApplicationSession = null;

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

async function loadApplicationUser(authUser) {
  const { data: profile, error } = await publicSchema
    .from("profiles")
    .select("id, full_name, role, module")
    .eq("id", authUser.id)
    .eq("module", "fleet")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load your fleet profile: ${error.message}`);
  }

  if (!profile) {
    throw new Error("Your account does not have a NovaFleet profile.");
  }

  if (!isKnownRole(profile.role)) {
    throw new Error("Your NovaFleet account has an unsupported role.");
  }

  const name = profile.full_name?.trim() || authUser.email || "NovaFleet User";
  currentApplicationSession = {
    id: authUser.id,
    email: authUser.email,
    name,
    initials: getInitials(name),
    role: profile.role,
    roleLabel: getRoleLabel(profile.role),
    module: profile.module,
  };

  return currentApplicationSession;
}

export async function login({ email, password }) {
  if (!email?.trim() || !password) {
    throw new Error("Enter your email and password to continue.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(error.message || "Unable to sign in with those credentials.");
  }

  try {
    return await loadApplicationUser(data.user);
  } catch (profileError) {
    await supabase.auth.signOut({ scope: "local" });
    currentApplicationSession = null;
    throw profileError;
  }
}

export async function restoreSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    currentApplicationSession = null;
    throw error;
  }

  if (!data.session?.user) {
    currentApplicationSession = null;
    return null;
  }

  try {
    return await loadApplicationUser(data.session.user);
  } catch (profileError) {
    await supabase.auth.signOut({ scope: "local" });
    currentApplicationSession = null;
    throw profileError;
  }
}

export function getSession() {
  return currentApplicationSession;
}

export async function logout() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  currentApplicationSession = null;
  if (error) throw error;
}