// NovaFleet ESP32 Tracker
// Reads a GPS position and POSTs it to the NovaFleet ingestion API, buffering
// to MicroSD when offline. Two build targets (see platformio.ini):
//   env:wifi     -> USE_WIFI 1, SIMULATE_GPS 1  (bench test on a bare ESP32)
//   env:cellular -> USE_WIFI 0                  (A7670C cellular + real GNSS)
//
// Speaks docs/hardware-ingestion-contract.md:
//   POST /api/ingest/telemetry  { device_uid, device_status, readings:[...] }
//   header: X-API-Key: <INGEST_API_KEY>
#include "config.h"

#include <Arduino.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <SD.h>

// ---- Transport client ------------------------------------------------------
#if USE_WIFI
#include <WiFi.h>
#if API_USE_SSL
#include <WiFiClientSecure.h>
WiFiClientSecure netClient;
#else
WiFiClient netClient;
#endif
#else  // cellular
#include <TinyGsmClient.h>
HardwareSerial SerialAT(MODEM_UART_NUM);
TinyGsm modem(SerialAT);
#if API_USE_SSL
TinyGsmClientSecure netClient(modem);
#else
TinyGsmClient netClient(modem);
#endif
#endif

HttpClient http(netClient, API_HOST, API_PORT);

// ---- Network ---------------------------------------------------------------
bool netEnsure() {
#if USE_WIFI
  if (WiFi.status() == WL_CONNECTED) return true;
  Serial.print("[wifi] connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();
  bool ok = WiFi.status() == WL_CONNECTED;
  if (ok) {
    Serial.print("[wifi] connected, IP ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[wifi] failed");
  }
  return ok;
#else
  if (!modem.isNetworkConnected()) {
    Serial.println("[net] waiting for network...");
    if (!modem.waitForNetwork(60000L)) {
      Serial.println("[net] no network");
      return false;
    }
  }
  if (!modem.isGprsConnected()) {
    Serial.print("[net] connecting GPRS ");
    Serial.println(GSM_APN);
    if (!modem.gprsConnect(GSM_APN, GSM_USER, GSM_PASS)) {
      Serial.println("[net] GPRS failed");
      return false;
    }
  }
  return modem.isGprsConnected();
#endif
}

#if !USE_WIFI
void modemPowerOn() {
  // A7670C: pull PWRKEY low for >1s to power on. (TWEAK for your board.)
  pinMode(MODEM_PWRKEY_PIN, OUTPUT);
  digitalWrite(MODEM_PWRKEY_PIN, HIGH);
  delay(100);
  digitalWrite(MODEM_PWRKEY_PIN, LOW);
  delay(1200);
  digitalWrite(MODEM_PWRKEY_PIN, HIGH);
  delay(3000);
}

void setupModem() {
  SerialAT.begin(MODEM_BAUD, SERIAL_8N1, MODEM_RX_PIN, MODEM_TX_PIN);
  delay(500);
  modemPowerOn();
  Serial.println("[modem] init...");
  if (!modem.init()) {
    Serial.println("[modem] init failed, restarting...");
    modem.restart();
  }
  if (strlen(GSM_PIN) && modem.getSimStatus() != 3) modem.simUnlock(GSM_PIN);
  Serial.print("[modem] ");
  Serial.println(modem.getModemInfo());
  netEnsure();
  Serial.println("[gps] enabling GNSS...");
  modem.enableGPS();  // TWEAK: some A7670 builds use a different GPS enable
}
#endif

void setupTransport() {
#if USE_WIFI
  WiFi.mode(WIFI_STA);
#if API_USE_SSL
  netClient.setInsecure();  // skip cert validation for local/self-signed
#endif
  netEnsure();
#else
  setupModem();
#endif
}

// ---- GPS source ------------------------------------------------------------
bool getFix(double &lat, double &lng, double &speed) {
#if SIMULATE_GPS
  static int idx = 0;
  float t = (SIM_STEPS <= 1) ? 0.0f : (float)idx / (SIM_STEPS - 1);
  lat = SIM_START_LAT + (SIM_END_LAT - SIM_START_LAT) * t;
  lng = SIM_START_LNG + (SIM_END_LNG - SIM_START_LNG) * t;
  speed = SIM_SPEED_KMH;
  idx = (idx + 1) % SIM_STEPS;
  return true;
#elif USE_WIFI
  return false;  // Wi-Fi has no GPS; enable SIMULATE_GPS to bench test
#else
  float flat = 0, flng = 0, fspeed = 0;
  bool ok = modem.getGPS(&flat, &flng, &fspeed);
  lat = flat;
  lng = flng;
  speed = fspeed;
  return ok;
#endif
}

// ---- SD buffer -------------------------------------------------------------
bool sdReady = false;

void setupSD() {
  SPI.begin(SD_SCK_PIN, SD_MISO_PIN, SD_MOSI_PIN, SD_CS_PIN);
  sdReady = SD.begin(SD_CS_PIN);
  Serial.println(sdReady ? "[sd] ready" : "[sd] not found (offline buffering disabled)");
}

void bufferReading(const String &body) {
  if (!sdReady) {
    Serial.println("[sd] no card; reading dropped");
    return;
  }
  File f = SD.open(BUFFER_FILE, FILE_APPEND);
  if (!f) return;
  f.println(body);
  f.close();
  Serial.println("[sd] reading buffered");
}

// ---- HTTP ------------------------------------------------------------------
int postBody(const String &body) {
  http.beginRequest();
  http.post(API_PATH);
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("X-API-Key", (const char *)INGEST_API_KEY);
  http.sendHeader("Content-Length", body.length());
  http.beginBody();
  http.print(body);
  http.endRequest();
  int status = http.responseStatusCode();
  String resp = http.responseBody();
  if (status != 200) {
    Serial.print("[post] key sent: ");
    Serial.println(INGEST_API_KEY);
    Serial.print("[post] server said: ");
    Serial.println(resp);
  }
  http.stop();
  return status;
}

void flushBuffer() {
  if (!sdReady || !SD.exists(BUFFER_FILE)) return;
  File in = SD.open(BUFFER_FILE, FILE_READ);
  if (!in) return;
  File tmp = SD.open("/buffer.tmp", FILE_WRITE);
  int sent = 0, kept = 0;
  while (in.available()) {
    String line = in.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;
    if (sent < BUFFER_MAX_FLUSH && postBody(line) == 200) {
      sent++;
    } else {
      if (tmp) tmp.println(line);
      kept++;
    }
  }
  in.close();
  if (tmp) tmp.close();
  SD.remove(BUFFER_FILE);
  if (SD.exists("/buffer.tmp")) SD.rename("/buffer.tmp", BUFFER_FILE);
  if (sent) {
    Serial.print("[sd] flushed ");
    Serial.print(sent);
    Serial.print(", kept ");
    Serial.println(kept);
  }
}

// ---- Payload ---------------------------------------------------------------
void genUuidV4(char *out) {
  uint8_t b[16];
  for (int i = 0; i < 16; i++) b[i] = (uint8_t)(esp_random() & 0xFF);
  b[6] = (b[6] & 0x0F) | 0x40;
  b[8] = (b[8] & 0x3F) | 0x80;
  sprintf(out,
          "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
          b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7],
          b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15]);
}

void buildBody(String &out, double lat, double lng, double speedKmh, const char *source, bool online) {
  char uuid[37];
  genUuidV4(uuid);
  JsonDocument doc;
  doc["device_uid"] = DEVICE_UID;
  JsonObject status = doc["device_status"].to<JsonObject>();
  status["connection"] = online ? "Online" : "Offline";
  status["gps"] = "Active";
  JsonArray readings = doc["readings"].to<JsonArray>();
  JsonObject r = readings.add<JsonObject>();
  r["client_id"] = uuid;
  r["lat"] = lat;
  r["lng"] = lng;
  r["speed_kmh"] = speedKmh;
  r["source"] = source;
  serializeJson(doc, out);
}

void reportReading(double lat, double lng, double speedKmh) {
  if (netEnsure()) {
    String body;
    buildBody(body, lat, lng, speedKmh, SOURCE_LIVE, true);
    int status = postBody(body);
    Serial.print("[post] status ");
    Serial.println(status);
    if (status == 200) {
      flushBuffer();
      return;
    }
  }
  String buffered;
  buildBody(buffered, lat, lng, speedKmh, SOURCE_BUFFER, false);
  bufferReading(buffered);
}

// ---- Lifecycle -------------------------------------------------------------
unsigned long lastReport = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nNovaFleet ESP32 Tracker starting...");
  Serial.println(USE_WIFI ? "[mode] Wi-Fi" : "[mode] Cellular");
  setupSD();
  setupTransport();
  Serial.println("Setup complete.");
}

void loop() {
  if (millis() - lastReport < REPORT_INTERVAL_MS) {
    delay(50);
    return;
  }
  lastReport = millis();

  double lat = 0, lng = 0, speed = 0;
  if (getFix(lat, lng, speed)) {
    Serial.print("[gps] ");
    Serial.print(lat, 6);
    Serial.print(", ");
    Serial.print(lng, 6);
    Serial.print("  speed ");
    Serial.println(speed);
    reportReading(lat, lng, speed);
  } else {
    Serial.println("[gps] no fix yet (needs clear sky view / antenna)");
  }
}
