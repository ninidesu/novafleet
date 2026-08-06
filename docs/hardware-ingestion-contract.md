# NovaFleet Telemetry Ingestion Contract

The single contract that **ESP32 firmware** and the **mobile offline-sync** both build against. Devices never talk to Supabase directly — they POST to this endpoint, and the server resolves *device → vehicle → active trip*, stores the reading, updates the device heartbeat, and raises alerts.

## Endpoint

```
POST  {API_BASE}/api/ingest/telemetry
GET   {API_BASE}/api/ingest/health      (no auth — connectivity probe)
```
`{API_BASE}` is e.g. `http://localhost:4000` in dev or `https://ingest.novafleet.app` in production.

## Authentication

Send the shared ingestion key as a header. This is **not** a user login token.

```
X-API-Key: <INGEST_API_KEY>
Content-Type: application/json
```

Missing/blank key → `503 ingest_disabled` (server not configured). Wrong key → `401 invalid_api_key`.

## Request body

The device is identified by `device_uid` (must match a row in `fleet.iot_devices`). You may send **one reading** (top-level fields) or a **batch** (`readings[]`). An optional `device_status` updates the heartbeat.

```jsonc
{
  "device_uid": "NF-ESP32-0001",       // required — provisioned per unit
  "device_status": {                    // optional heartbeat
    "connection": "Online",             // Online | Offline | Maintenance
    "gps": "Active"                     // Active | No GPS | Disabled
  },
  "readings": [
    {
      "client_id": "b3c1e2a4-...-uuid", // OPTIONAL but recommended: dedupe key
      "lat": 14.5951,                   // required, -90..90
      "lng": 121.0325,                  // required, -180..180
      "speed_kmh": 36,                  // optional
      "recorded_at": "2026-08-06T09:15:22Z", // when captured (keep for buffered)
      "source": "device",              // "device" (live) | "buffer" (offline resend)
      "accel_spike": 3.42               // optional; >= threshold raises an alert
    }
  ]
}
```

Single-reading form (no `readings` array) — put the reading fields at the top level alongside `device_uid`.

### Field notes
- **`client_id`** — a UUID the **device generates** per reading. Resending the same `client_id` is ignored (idempotent), so offline backlogs and retries never duplicate. Omit it and every send inserts a new row.
- **`recorded_at`** — the capture time, **not** the send time. Critical for buffered readings uploaded later. Defaults to server `now()` if omitted.
- **`source`** — use `"buffer"` for readings flushed from the MicroSD/local backlog so they're distinguishable from live data.
- Max **500 readings** per request (`413`-style `batch_too_large` otherwise).

## Response `200`

```jsonc
{
  "device_uid": "NF-ESP32-0001",
  "vehicle_id": "…",
  "trip_id": "…",          // the active trip readings were attached to, or null
  "received": 5,
  "stored": 4,             // newly inserted
  "duplicates": 1,         // skipped via client_id
  "alerts_created": 1,
  "note": "…"              // present when nothing was stored (see below)
}
```

### When `trip_id` is `null` (readings not stored)
The heartbeat is still recorded, but positional readings are **only stored while the vehicle has an active trip**. You'll get a `note`:
- `"No active trip for this vehicle; heartbeat recorded, readings not stored."`
- `"Device is not assigned to a vehicle; heartbeat recorded, readings not stored."`

This is expected: a device parked between trips still sends heartbeats, but its GPS trail is only logged during a dispatched/active trip.

## Errors

| Status | code | Meaning |
| --- | --- | --- |
| 400 | `invalid_reading` | A reading had non-numeric/out-of-range lat/lng |
| 400 | `batch_too_large` | More than 500 readings in one request |
| 401 | `invalid_api_key` | Wrong/missing `X-API-Key` |
| 404 | `unknown_device` | `device_uid` not found in `fleet.iot_devices` |
| 429 | `rate_limited` | Too many requests for this device (see `Retry-After`) |
| 503 | `ingest_disabled` | `INGEST_API_KEY` not set on the server |

Rate limit: `INGEST_RATE_LIMIT_PER_MIN` (default 120) requests per device per minute.

## Behavior summary (what the server does)

1. Verify API key.
2. Look up device by `device_uid`.
3. Update device heartbeat (`last_seen_at`, and connection/gps status if sent).
4. Find the vehicle's active trip (open, non-terminal).
5. Store readings idempotently on `client_id` → `fleet.sensor_readings`.
6. For readings with `accel_spike >= threshold`, raise `fleet.incident_alerts`.

## Examples

**Live single reading (curl):**
```bash
curl -X POST http://localhost:4000/api/ingest/telemetry \
  -H "X-API-Key: $INGEST_API_KEY" -H "Content-Type: application/json" \
  -d '{"device_uid":"NF-ESP32-0001","lat":14.5951,"lng":121.0325,"speed_kmh":36,"source":"device"}'
```

**Offline backlog flush (batch with client_ids):**
```bash
curl -X POST http://localhost:4000/api/ingest/telemetry \
  -H "X-API-Key: $INGEST_API_KEY" -H "Content-Type: application/json" \
  -d '{"device_uid":"NF-ESP32-0001","device_status":{"connection":"Online","gps":"Active"},
       "readings":[
         {"client_id":"11111111-1111-1111-1111-111111111111","lat":14.60,"lng":121.03,"speed_kmh":30,"recorded_at":"2026-08-06T09:10:00Z","source":"buffer"},
         {"client_id":"22222222-2222-2222-2222-222222222222","lat":14.61,"lng":121.04,"speed_kmh":34,"recorded_at":"2026-08-06T09:11:00Z","source":"buffer"}
       ]}'
```

## ESP32 data-flow (matches the hardware design)

```
loop:
  read GPS + accel from A7670C / sensors
  build reading { client_id = uuid(), lat, lng, speed_kmh, recorded_at = now, accel_spike }
  if cellular signal (AT+CREG):
      POST /api/ingest/telemetry  (source="device")
      on success: also flush any MicroSD backlog (source="buffer")
  else:
      append reading to MicroSD backlog
```

Because `client_id` makes every reading idempotent, the "flush backlog on reconnect" step is safe to retry — the server silently drops anything it already has.

## Mobile offline-sync uses the same contract
The Expo app's outbox posts to this exact endpoint (with `source="buffer"` and `client_id`) when connectivity returns, so hardware and mobile share one ingestion path.
