# NovaFleet ESP32 Tracker (firmware)

Firmware for the in-vehicle unit: **ESP32 + A7670C (cellular + GNSS) + MicroSD**. It reads GPS from the A7670C, POSTs to the NovaFleet **ingestion API** ([`docs/hardware-ingestion-contract.md`](../../docs/hardware-ingestion-contract.md)), and buffers readings to the SD card when there's no signal — flushing them when the connection returns.

```
GNSS fix ─▶ ESP32 ─▶ (cellular up?) ─▶ POST /api/ingest/telemetry ─▶ NovaFleet API
                         │  no
                         └─▶ append to MicroSD ──(reconnect)──▶ flush buffer
```

## Wiring (matches the hardware diagram)

| A7670C | ESP32 | | MicroSD (SPI) | ESP32 |
|---|---|---|---|---|
| TXD | GPIO16 (RX2) | | CS | GPIO5 |
| RXD | GPIO17 (TX2) | | SCK | GPIO18 |
| PWRKEY | GPIO4 | | MOSI | GPIO23 |
| GND | GND | | MISO | GPIO19 |

Power per the design: **12V → A7670C VIN** (direct, fused) and **12V → buck → 5V → ESP32 VIN**, common (star) ground. Pins are configurable in `include/config.h`.

## Two build targets

| Target | For | Network | GPS |
|---|---|---|---|
| **`wifi`** | Bench testing on a bare ESP32 + USB | Wi-Fi (your LAN) | simulated (walks a route) |
| **`cellular`** | The real in-vehicle unit | A7670C cellular | real A7670C GNSS |

Start with **`wifi`** — it proves the whole *device → API → dashboard* pipeline with **no SIM, no APN, no tunnel, and no GPS hardware**, because on Wi-Fi the board is on your LAN and can hit `http://<PC-IP>:4000` directly. Move to **`cellular`** once the pipeline works and you're ready to put it in a vehicle.

## Common prerequisites (both targets)
- **Device is registered + on an active trip.** The seed already created `NF-ESP32-0001` on vehicle **NFA-1023**, which has an **active trip** — reuse that `DEVICE_UID` and readings store immediately. (Otherwise add a `fleet.iot_devices` row, assign a vehicle, ensure it has a dispatched/active trip.)
- **`INGEST_API_KEY`** in `include/config.h` = the same value as `server/.env`.

---

### A) Wi-Fi bench test (recommended first)

**1. Fill in `include/config.h`:**
```c
#define WIFI_SSID "your-wifi"
#define WIFI_PASS "your-password"
#define API_HOST  "192.168.100.203"   // your PC's LAN IP (run ipconfig)
#define API_PORT  4000
#define API_USE_SSL 0
```
(The ESP32 and your PC must be on the **same Wi-Fi**, and the API running: `cd server && npm run dev`.)

**2. Flash + monitor:**
```bash
cd firmware/esp32-tracker
pio run -e wifi -t upload
pio device monitor
```
No GPS hardware needed — `SIMULATE_GPS` walks a Makati→QC path so the map moves.

---

### B) Cellular (real vehicle unit)

The A7670C is on the cellular network, so the API must be **publicly reachable** — deploy it, or tunnel your local one:
```bash
ngrok http 4000     # prints https://ab12cd34.ngrok-free.app
```
Then in `config.h`: `API_HOST "ab12cd34.ngrok-free.app"`, `API_PORT 443`, `API_USE_SSL 1`, plus `GSM_APN` (your carrier's APN). Flash:
```bash
pio run -e cellular -t upload
pio device monitor
```

> **Arduino IDE alternative:** install the ESP32 board package + `TinyGSM`, `ArduinoHttpClient`, `ArduinoJson`. Set `USE_WIFI` / `SIMULATE_GPS` (and `TINY_GSM_MODEM_SIM7600` for cellular) at the top of `main.cpp` before the includes, since Arduino IDE has no per-env build flags.

## What you should see (serial monitor)

```
NovaFleet ESP32 Tracker starting...
[mode] Wi-Fi
[sd] ready
[wifi] connecting to your-wifi
[wifi] connected, IP 192.168.100.xx
[gps] 14.560200, 121.025000  speed 34.0
[post] status 200
```
(The `cellular` target instead shows `[modem] init...`, `[net] connecting GPRS`, and a real `[gps] fix`.)

`[post] status 200` means the API accepted the reading. Then open the web app's **Live Map** — **NFA-1023** should move to the reported position, just like the curl/simulator test earlier.

## Notes & limitations
- **Wi-Fi is bench-only** — a moving vehicle has no Wi-Fi, so the real unit must use the `cellular` target. Wi-Fi + `SIMULATE_GPS` exists to prove the pipeline on your desk.
- **GPS fix needs sky view** (cellular target) — the GNSS antenna must see the sky; indoors you'll get `[gps] no fix yet`. Test near a window or outside.
- **HTTPS through the modem** uses `TinyGsmClientSecure` (the A76xx SSL stack). If a tunnel's cert gives trouble, you can temporarily point at a plain-HTTP endpoint (`API_USE_SSL 0`, `API_PORT 80`) for bring-up.
- **Timestamps:** live readings are stamped server-side (`now()`); readings buffered offline get the *sync* time when flushed, not capture time (no RTC). Add an RTC or modem-time capture later if exact offline timing matters.
- **Idempotent:** every reading carries a UUID `client_id`, so re-sent buffered readings are de-duplicated by the server — safe to retry.
- Board-specific spots (modem power-on timing, GPS enable) are marked `TWEAK` in `main.cpp`.
