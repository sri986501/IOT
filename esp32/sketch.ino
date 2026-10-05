#include <HTTPClient.h>
#include <WebServer.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

// ========== WIFI CONFIGURATION ==========
const char *WIFI_SSID = "SRIPRABANCHAN";
const char *WIFI_PASSWORD = "VETRIDEVI";

// ========== VERCEL API CONFIGURATION ==========
const char *API_URL = "https://iot-pi-nine.vercel.app/api/telemetry";
const char *DEVICE_TOKEN = "-yo1_XimjeNxK2NaDF2uFAvLSWCkji6T0_JR44Ktyc4";

// ========== LOCAL HOTSPOT WEB SERVER ==========
WebServer localServer(80);

// ========== SENSOR PINS ==========
#define TRIG_PIN 5
#define ECHO_PIN 18
#define FLOW_PIN 34
#define LED_PIN 27
#define BUZZER_PIN 26

// ========== TANK CONFIGURATION ==========
const float TANK_HEIGHT_CM = 15.0;
const float HIGH_LEVEL_DISTANCE_CM = 5.0;
const float NORMAL_LEVEL_DISTANCE_CM = 10.0;

// Calibrate this value using a known quantity of water
const float PULSES_PER_LITER = 450.0;

// ========== TIMING ==========
const unsigned long RESULT_INTERVAL = 7000;
const unsigned long WIFI_RETRY_INTERVAL = 10000;

// ========== FLOW SENSOR ==========
volatile unsigned long flowPulseCount = 0;

unsigned long lastResultTime = 0;
unsigned long lastWiFiRetryTime = 0;

float totalLiters = 0.0;
float flowRateLMin = 0.0;

bool flowDetected = false;
bool highWaterAlarm = false;
bool leakAlarm = false;
bool systemAlarm = false;

float distanceCm = -1.0;
float waterHeightCm = 0.0;
float waterPercentage = 0.0;

String waterStatus = "NORMAL";

// ========== FLOW INTERRUPT ==========
void IRAM_ATTR countFlowPulse() { flowPulseCount++; }

// ========== WIFI STATUS ==========
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println();
  Serial.println("Connecting to Wi-Fi...");

  unsigned long startAttempt = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 15000) {
    Serial.print(".");
    delay(500);
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WIFI STATUS: CONNECTED");
    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());
    Serial.print("IP ADDRESS: ");
    Serial.println(WiFi.localIP());
    Serial.print("SIGNAL STRENGTH: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("WIFI STATUS: DISCONNECTED");
    Serial.println("Sensor monitoring will continue offline.");
  }
}

void maintainWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  if (millis() - lastWiFiRetryTime >= WIFI_RETRY_INTERVAL) {
    lastWiFiRetryTime = millis();

    Serial.println("WIFI STATUS: DISCONNECTED");
    Serial.println("Trying to reconnect...");

    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
}

// ========== ULTRASONIC SENSOR ==========
float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    return -1.0;
  }

  return duration * 0.0343 / 2.0;
}

// ========== READ FLOW SENSOR ==========
void updateFlowData() {
  static unsigned long previousFlowTime = 0;

  unsigned long currentTime = millis();
  unsigned long elapsed = currentTime - previousFlowTime;

  if (elapsed < RESULT_INTERVAL) {
    return;
  }

  noInterrupts();
  unsigned long pulses = flowPulseCount;
  flowPulseCount = 0;
  interrupts();

  if (PULSES_PER_LITER > 0) {
    float litersThisInterval = pulses / PULSES_PER_LITER;

    totalLiters += litersThisInterval;

    flowRateLMin = litersThisInterval * 60000.0 / elapsed;
  }

  flowDetected = (pulses > 0);

  previousFlowTime = currentTime;
}

// ========== WATER LEVEL & ALARMS ==========
void updateWaterStatus() {
  distanceCm = readDistanceCm();

  if (distanceCm < 0 || distanceCm > TANK_HEIGHT_CM + 5.0) {
    waterStatus = "SENSOR_ERROR";

    waterHeightCm = 0.0;
    waterPercentage = 0.0;

    highWaterAlarm = false;
    leakAlarm = false;
    systemAlarm = false;

    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);

    Serial.println("WARNING: Ultrasonic sensor reading invalid.");
    return;
  }

  waterHeightCm = TANK_HEIGHT_CM - distanceCm;

  waterHeightCm = constrain(waterHeightCm, 0.0, TANK_HEIGHT_CM);

  waterPercentage = (waterHeightCm / TANK_HEIGHT_CM) * 100.0;
  waterPercentage = constrain(waterPercentage, 0.0, 100.0);

  if (distanceCm <= HIGH_LEVEL_DISTANCE_CM) {
    waterStatus = "HIGH";
  } else if (distanceCm <= NORMAL_LEVEL_DISTANCE_CM) {
    waterStatus = "NORMAL";
  } else {
    waterStatus = "LOW";
  }

  // High water level alarm
  highWaterAlarm = (distanceCm <= HIGH_LEVEL_DISTANCE_CM);

  // Demo heuristic: low water + flow = possible leak
  leakAlarm = (waterStatus == "LOW" && flowDetected);

  systemAlarm = highWaterAlarm || leakAlarm;

  digitalWrite(LED_PIN, systemAlarm ? HIGH : LOW);
  digitalWrite(BUZZER_PIN, systemAlarm ? HIGH : LOW);
}

// ========== SERIAL OUTPUT ==========
void printResults() {
  Serial.println();
  Serial.println("========== WATER GUARDIAN ==========");

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WIFI STATUS: CONNECTED");
    Serial.print("IP ADDRESS: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WIFI STATUS: DISCONNECTED");
  }

  Serial.print("Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");

  Serial.print("Water Height: ");
  Serial.print(waterHeightCm);
  Serial.println(" cm");

  Serial.print("Water Level: ");
  Serial.print(waterPercentage);
  Serial.println(" %");

  Serial.print("Water Status: ");
  Serial.println(waterStatus);

  Serial.print("Flow Rate: ");
  Serial.print(flowRateLMin);
  Serial.println(" L/min");

  Serial.print("Total Water: ");
  Serial.print(totalLiters);
  Serial.println(" L");

  Serial.print("Flow Detected: ");
  Serial.println(flowDetected ? "YES" : "NO");

  Serial.print("High Water Alarm: ");
  Serial.println(highWaterAlarm ? "ON" : "OFF");

  Serial.print("Possible Leak Alarm: ");
  Serial.println(leakAlarm ? "ON" : "OFF");

  Serial.print("System Alarm: ");
  Serial.println(systemAlarm ? "ON" : "OFF");

  Serial.println("====================================");
}

// ========== PAYLOAD BUILDER ==========
String buildPayloadJson() {
  String payload = "{";
  payload += "\"distance_cm\":" + String(distanceCm, 2) + ",";
  payload += "\"water_height_cm\":" + String(waterHeightCm, 2) + ",";
  payload += "\"water_percentage\":" + String(waterPercentage, 2) + ",";
  payload += "\"water_status\":\"" + waterStatus + "\",";
  payload += "\"flow_rate_l_min\":" + String(flowRateLMin, 3) + ",";
  payload += "\"total_liters\":" + String(totalLiters, 3) + ",";
  payload += "\"flow_detected\":" + String(flowDetected ? "true" : "false") + ",";
  payload += "\"high_water_alarm\":" + String(highWaterAlarm ? "true" : "false") + ",";
  payload += "\"leak_alarm\":" + String(leakAlarm ? "true" : "false") + ",";
  payload += "\"system_alarm\":" + String(systemAlarm ? "true" : "false");
  payload += "}";
  return payload;
}

// ========== SEND DATA TO VERCEL ==========
void uploadTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("CLOUD STATUS: SKIPPED - Wi-Fi disconnected");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  https.setTimeout(5000);
  https.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  if (!https.begin(client, API_URL)) {
    Serial.println("CLOUD STATUS: CONNECTION FAILED");
    return;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("x-device-token", DEVICE_TOKEN);

  String payload = buildPayloadJson();
  Serial.print("Uploading sensor data to ");
  Serial.println(API_URL);

  int httpCode = https.POST(payload);

  if (httpCode == 201) {
    Serial.println("CLOUD STATUS: UPLOAD SUCCESS (201 Created)");
  } else if (httpCode > 0) {
    Serial.print("CLOUD STATUS: HTTP ");
    Serial.println(httpCode);
    Serial.println(https.getString());
  } else {
    Serial.print("CLOUD STATUS: REQUEST FAILED: ");
    Serial.println(https.errorToString(httpCode));
  }

  https.end();
}

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(FLOW_PIN, INPUT);

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), countFlowPulse, FALLING);

  Serial.println();
  Serial.println("WATER GUARDIAN STARTING...");

  connectWiFi();

  // Configure local hotspot endpoints
  localServer.enableCORS(true);
  localServer.on("/", []() {
    localServer.sendHeader("Access-Control-Allow-Origin", "*");
    localServer.send(200, "application/json", buildPayloadJson());
  });
  localServer.on("/api/telemetry", []() {
    localServer.sendHeader("Access-Control-Allow-Origin", "*");
    localServer.send(200, "application/json", buildPayloadJson());
  });
  localServer.begin();
  Serial.println("LOCAL SERVER: http://" + WiFi.localIP().toString() + "/");

  lastResultTime = millis();
  lastWiFiRetryTime = millis();
}

// ========== MAIN LOOP ==========
void loop() {
  maintainWiFi();
  localServer.handleClient();

  // Calculate flow over the same 7-second interval.
  updateFlowData();

  // Update results and upload every 7 seconds.
  if (millis() - lastResultTime >= RESULT_INTERVAL) {
    lastResultTime = millis();

    updateWaterStatus();
    printResults();
    uploadTelemetry();
  }

  delay(10);
}
