// Runtime configuration, read from Expo public env vars (EXPO_PUBLIC_*).
// See .env.example. Falls back to localhost for web/simulator dev.

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
