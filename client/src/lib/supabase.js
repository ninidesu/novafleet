import { createClient } from "@supabase/supabase-js";
import { SupabaseConfigurationError } from "./databaseError.js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Keep the old variable working during a staged migration; use the publishable name in new environments.
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new SupabaseConfigurationError(
    "Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in client/.env.local.",
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  db: { schema: "fleet" },
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const fleetDb = supabase.schema("fleet");
export const publicSchema = supabase.schema("public");