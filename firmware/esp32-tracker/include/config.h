// NovaFleet ESP32 Tracker — configuration.
// Fill in the values marked TODO for your unit, SIM, and API.
#pragma once

// ---------------------------------------------------------------------------
// Device identity — must match a row in fleet.iot_devices (device_uid), and
// that device must be assigned to a vehicle that has an active trip for the
// server to store its GPS readings (otherwise it only records a heartbeat).
// ---------------------------------------------------------------------------
#define DEVICE_UID "NF-ESP32-0001"

// ---------------------------------------------------------------------------
// Transport: Wi-Fi (bench testing) or cellular A7670C (in-vehicle product).
// Selected by the PlatformIO env (see platformio.ini):
//   [env:wifi]     -> USE_WIFI 1  (+ SIMULATE_GPS 1 for a bare board)
//   [env:cellular] -> USE_WIFI 0  (real A7670C GNSS)
// You can also just set these here.
// ---------------------------------------------------------------------------
#ifndef USE_WIFI
#define USE_WIFI 0
#endif
#ifndef SIMULATE_GPS
#define SIMULATE_GPS 0
#endif

// Wi-Fi credentials (only used when USE_WIFI 1).
#define WIFI_SSID "BATKOKONEK 2G"       // TODO
#define WIFI_PASS "LJCREATIVEPRINTSMAXX22"   // TODO

// ---------------------------------------------------------------------------
// API endpoint. API_HOST is the bare host (no https://, no path).
//   - Wi-Fi to your local API:  host = your PC's LAN IP, PORT 4000, SSL 0
//   - Cellular / public HTTPS:  host = domain or ngrok host, PORT 443, SSL 1
// ---------------------------------------------------------------------------
#define API_HOST "192.168.100.203"  // TODO (LAN IP for Wi-Fi, or public host)
#define API_PORT 4000
#define API_USE_SSL 0
#define API_PATH "/api/ingest/telemetry"

// ---------------------------------------------------------------------------
// Simulated GPS (USE only for bench testing without a GPS fix). Walks a path
// from START to END so the Live Map shows the vehicle moving.
// ---------------------------------------------------------------------------
#define SIM_START_LAT 14.5547
#define SIM_START_LNG 121.0244
#define SIM_END_LAT 14.6760
#define SIM_END_LNG 121.0437
#define SIM_STEPS 30
#define SIM_SPEED_KMH 34.0

// Ingestion API key — the same INGEST_API_KEY as server/.env.
#define INGEST_API_KEY "nf_ingest_965d6ac83dee184880b1988c9bccd1a88ed760d9eb4eda83"  // TODO

// ---------------------------------------------------------------------------
// Cellular / SIM
// ---------------------------------------------------------------------------
#define GSM_APN "internet"  // TODO: your carrier's APN
#define GSM_USER ""
#define GSM_PASS ""
#define GSM_PIN ""  // SIM PIN if any

// ---------------------------------------------------------------------------
// Behavior
// ---------------------------------------------------------------------------
#define REPORT_INTERVAL_MS 15000   // how often to read GPS + report
#define GPS_FIX_TIMEOUT_MS 90000   // how long to wait for the first fix
#define SOURCE_LIVE "device"       // source tag for live readings
#define SOURCE_BUFFER "buffer"     // source tag for flushed offline readings

// ---------------------------------------------------------------------------
// Pin map (from the NovaFleet hardware wiring diagram)
// ---------------------------------------------------------------------------
// A7670C modem on UART2
#define MODEM_UART_NUM 2
#define MODEM_TX_PIN 17  // ESP32 TX2 -> A7670C RXD
#define MODEM_RX_PIN 16  // ESP32 RX2 <- A7670C TXD
#define MODEM_PWRKEY_PIN 4
#define MODEM_BAUD 115200

// MicroSD (SPI) — offline buffer
#define SD_CS_PIN 5
#define SD_SCK_PIN 18
#define SD_MOSI_PIN 23
#define SD_MISO_PIN 19
#define BUFFER_FILE "/buffer.jsonl"
#define BUFFER_MAX_FLUSH 50  // max buffered readings to send per reconnect pass
