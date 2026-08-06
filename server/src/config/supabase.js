import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Service-role client: full access, RLS bypassed. Server-side only.
// `fleetDb` targets the fleet schema (most tables); `publicDb` targets public
// (profiles). A short-lived per-request client is used to verify user JWTs.
const baseOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
};

export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, baseOptions);
export const fleetDb = supabaseAdmin.schema(env.supabaseSchema);
export const publicDb = supabaseAdmin.schema("public");

// Resolve the authenticated user from a bearer access token (issued by Supabase
// Auth on the client). Uses the service-role client's auth admin surface.
export async function getUserFromToken(accessToken) {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  return data.user;
}
