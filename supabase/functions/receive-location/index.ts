import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type OwnTracksLocation = {
  _type?: string;
  tid?: string;
  topic?: string;
  lat?: number;
  lon?: number;
  acc?: number;
  vel?: number;
  tst?: number;
  batt?: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function basicCredentials(request: Request) {
  const value = request.headers.get("authorization") || "";
  if (!value.startsWith("Basic ")) return null;
  try {
    const decoded = atob(value.slice(6));
    const separator = decoded.indexOf(":");
    if (separator < 1) return null;
    return { user: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
  } catch {
    return null;
  }
}

function validCoordinate(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function deviceUid(payload: OwnTracksLocation) {
  if (payload.topic) {
    const parts = payload.topic.split("/").filter(Boolean);
    if (parts.length >= 3) return parts.at(-1);
  }
  return payload.tid || null;
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Only POST is supported." }, 405);

  const credentials = basicCredentials(request);
  const expectedUser = Deno.env.get("OWNTRACKS_USER");
  const expectedPassword = Deno.env.get("OWNTRACKS_PASSWORD");
  if (!credentials || !expectedUser || !expectedPassword || credentials.user !== expectedUser || credentials.password !== expectedPassword) {
    return new Response("Unauthorized", { status: 401, headers: { ...corsHeaders, "WWW-Authenticate": "Basic realm=OwnTracks" } });
  }

  let payload: OwnTracksLocation;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  if (payload._type !== "location") return json({ error: "Only OwnTracks location events are accepted." }, 400);
  const latitude = validCoordinate(payload.lat, -90, 90);
  const longitude = validCoordinate(payload.lon, -180, 180);
  const uid = deviceUid(payload);
  if (latitude === null || longitude === null || !uid) return json({ error: "A valid location and device ID are required." }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Receiver is not configured." }, 500);
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: device, error: deviceError } = await admin
    .schema("fleet")
    .from("iot_devices")
    .select("id, vehicle_id, device_uid")
    .eq("device_uid", uid)
    .maybeSingle();
  if (deviceError) return json({ error: deviceError.message }, 500);
  if (!device) return json({ error: `Unknown OwnTracks device: ${uid}` }, 404);

  const recordedAt = payload.tst ? new Date(Number(payload.tst) * 1000).toISOString() : new Date().toISOString();
  const speed = Number.isFinite(Number(payload.vel)) ? Math.max(0, Number(payload.vel)) : 0;
  const { error: deviceUpdateError } = await admin.schema("fleet").from("iot_devices").update({
    latitude,
    longitude,
    location_updated_at: recordedAt,
    last_seen_at: recordedAt,
    connection_status: "Online",
    gps_status: "Active",
  }).eq("id", device.id);
  if (deviceUpdateError) return json({ error: deviceUpdateError.message }, 500);

  let tripId: string | null = null;
  if (device.vehicle_id) {
    const { data: trip, error: tripError } = await admin.schema("fleet").from("trips")
      .select("id")
      .eq("vehicle_id", device.vehicle_id)
      .is("end_time", null)
      .not("status", "in", "(completed,cancelled,canceled)")
      .order("dispatch_time", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (tripError) return json({ error: tripError.message }, 500);
    tripId = trip?.id || null;
  }

  if (tripId) {
    const { error: readingError } = await admin.schema("fleet").from("sensor_readings").insert({
      trip_id: tripId,
      recorded_at: recordedAt,
      lat: latitude,
      lng: longitude,
      speed_kmh: speed,
      source: "owntracks",
    });
    if (readingError) return json({ error: readingError.message }, 500);
  }

  return json({ ok: true, deviceId: device.id, tripId, recordedAt }, tripId ? 200 : 202);
});
