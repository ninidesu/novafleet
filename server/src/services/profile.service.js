import { publicDb } from "../config/supabase.js";
import { fromDbError } from "../lib/httpError.js";
import { normalizeRole } from "../middleware/auth.js";

const PROFILE_SELECT = "id, full_name, role, module, created_at";

// Build the /me payload from an already-authenticated request context.
export function currentProfile(auth) {
  return {
    id: auth.profile.id,
    full_name: auth.profile.full_name,
    role: auth.profile.role,
    storedRole: auth.profile.storedRole,
    module: auth.profile.module,
    created_at: auth.profile.created_at,
    email: auth.user.email,
  };
}

export async function updateProfileName(auth, fullName) {
  const { data, error } = await publicDb
    .from("profiles")
    .update({ full_name: String(fullName || "").trim() })
    .eq("id", auth.user.id)
    .select(PROFILE_SELECT)
    .single();
  if (error) throw fromDbError(error, "update profile");
  return {
    ...data,
    role: normalizeRole(data.role) || data.role,
    storedRole: data.role,
    email: auth.user.email,
  };
}
