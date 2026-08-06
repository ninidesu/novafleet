import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Copy server/.env.example to server/.env and fill it in.`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseSchema: process.env.SUPABASE_SCHEMA || "fleet",
  isProduction: process.env.NODE_ENV === "production",

  // Hardware/mobile telemetry ingestion (device-authenticated, not user JWT).
  ingestApiKey: process.env.INGEST_API_KEY || "",
  ingestAccelThreshold: Number(process.env.INGEST_ACCEL_THRESHOLD) || 3.0,
  ingestRateLimitPerMin: Number(process.env.INGEST_RATE_LIMIT_PER_MIN) || 120,
};
