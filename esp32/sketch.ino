/*
 * ============================================================================
 * Water Guardian - ESP32 Smart Water Monitoring System
 * ============================================================================
 * Features:
 *   - HC-SR04 Ultrasonic Distance Sensor (Bottle/Tank level)
 *   - JZ-S4-01 Hall Effect Flow Sensor (pulse interrupt on GPIO 34)
 *   - Visual Alarm Indicator (LED on GPIO 27)
 *   - Audio Alert Siren (Active Buzzer on GPIO 26)
 *   - Embedded Asynchronous Web Server on Port 80
 *   - REST JSON API at /data with Cross-Origin (CORS) headers
 *   - Interactive Web Dashboard at /
 * ============================================================================
 * WIRING DIAGRAM:
 *   HC-SR04 VCC   --> 5V / VIN
 *   HC-SR04 GND   --> GND
 *   HC-SR04 TRIG  --> GPIO 5
 *   HC-SR04 ECHO  --> GPIO 18 (Use voltage divider: 5V echo -> 3.3V GPIO 18)
 *
 *   Flow Sensor VCC --> 5V / 3.3V
 *   Flow Sensor GND --> GND
 *   Flow Sensor SIG --> GPIO 34 (Input only, add 10k pull-up if needed)
 *
 *   LED (+) Anode   --> 220 Ohm resistor --> GPIO 27
 *   LED (-) Cathode --> GND
 *
 *   Active Buzzer (+) --> GPIO 26
 *   Active Buzzer (-) --> GND
 * ============================================================================
 */

#include <WebServer.h>
#include <WiFi.h>

// =====================================================
// WIFI CREDENTIALS (UPDATE BEFORE FLASHING)
// =====================================================

const char *WIFI_SSID = "Water_Monitor";
const char *WIFI_PASSWORD = "sri986501";

// =====================================================
// PIN CONFIGURATION
// =====================================================

#define TRIG_PIN 5
#define ECHO_PIN 18

#define FLOW_PIN 34

#define LED_PIN 27
#define BUZZER_PIN 26

// =====================================================
// WATER TANK / BOTTLE CALIBRATION
// =====================================================

const float BOTTLE_HEIGHT_CM = 30.0;

// Distance from ultrasonic sensor to water surface:
// LOW:  water height < 10 cm (distance > 20 cm)
const float LOW_DISTANCE = 20.0;

// HIGH: water height >= 20 cm (distance <= 10 cm)
const float HIGH_DISTANCE = 10.0;

// =====================================================
// FLOW ALARM & CALIBRATION
// =====================================================

const unsigned long FLOW_ALARM_TIME = 10000; // 10 seconds continuous flow alert

// JZ-S4-01 flow sensor pulse calibration (pulses per liter)
const float PULSES_PER_LITER = 450.0;

// =====================================================
// RUNTIME VARIABLES
// =====================================================

volatile unsigned long pulseCount = 0;

unsigned long lastFlowCalculation = 0;
unsigned long lastPulseTime = 0;
unsigned long flowStartTime = 0;

bool flowDetected = false;
bool flowAlarm = false;

float flowRate = 0.0;
float totalLiters = 0.0;

float distanceCM = -1;
float waterHeightCM = -1;
float waterPercentage = -1;

String waterStatus = "SENSOR_ERROR";

// =====================================================
// WEB SERVER (PORT 80)
// =====================================================

WebServer server(80);

// =====================================================
// FLOW SENSOR INTERRUPT
// =====================================================

void IRAM_ATTR flowPulse() {
  pulseCount++;
  lastPulseTime = millis();
}

// =====================================================
// ULTRASONIC SENSOR READING (HC-SR04)
// =====================================================

float readDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    return -1;
  }

  float distance = duration * 0.0343 / 2.0;
  return distance;
}

// =====================================================
// WATER STATUS EVALUATION
// =====================================================

String getWaterStatus(float distance) {
  if (distance < 0) {
    return "SENSOR_ERROR";
  }

  // LOW WATER
  if (distance > LOW_DISTANCE) {
    return "LOW";
  }

  // HIGH WATER
  if (distance <= HIGH_DISTANCE) {
    return "HIGH";
  }

  // NORMAL
  return "NORMAL";
}

// =====================================================
// UPDATE WATER METRICS
// =====================================================

void updateWaterData() {
  distanceCM = readDistanceCM();

  if (distanceCM < 0) {
    waterHeightCM = -1;
    waterPercentage = -1;
    waterStatus = "SENSOR_ERROR";
    return;
  }

  // Water height in container
  waterHeightCM = BOTTLE_HEIGHT_CM - distanceCM;

  // Boundary clamp
  if (waterHeightCM < 0) {
    waterHeightCM = 0;
  }

  if (waterHeightCM > BOTTLE_HEIGHT_CM) {
    waterHeightCM = BOTTLE_HEIGHT_CM;
  }

  // Calculate percentage
  waterPercentage = (waterHeightCM / BOTTLE_HEIGHT_CM) * 100.0;

  waterStatus = getWaterStatus(distanceCM);
}

// =====================================================
// UPDATE FLOW METRICS
// =====================================================

void updateFlow() {
  unsigned long currentTime = millis();

  if (currentTime - lastFlowCalculation >= 1000) {
    noInterrupts();
    unsigned long pulses = pulseCount;
    pulseCount = 0;
    interrupts();

    // Calculate flow rate in Liters/minute
    flowRate = (pulses / PULSES_PER_LITER) * 60.0;

    // Accumulate total liters
    totalLiters += pulses / PULSES_PER_LITER;

    // -------------------------------------------------
    // FLOW DETECTION
    // -------------------------------------------------
    if (pulses > 0) {
      if (!flowDetected) {
        flowDetected = true;
        flowStartTime = currentTime;
        Serial.println("[FLOW] Started flowing...");
      }
    } else {
      flowDetected = false;
      flowStartTime = 0;
      flowAlarm = false;
    }

    // -------------------------------------------------
    // 10-SECOND CONTINUOUS FLOW ALARM
    // -------------------------------------------------
    if (flowDetected) {
      unsigned long flowDuration = currentTime - flowStartTime;

      if (flowDuration >= FLOW_ALARM_TIME) {
        flowAlarm = true;
      }
    }

    lastFlowCalculation = currentTime;
  }
}

// =====================================================
// ALARM LOGIC (LED & BUZZER)
// =====================================================

void updateAlarm() {
  bool waterAlarm = false;

  // LOW or HIGH trigger alarm
  if (waterStatus == "LOW" || waterStatus == "HIGH") {
    waterAlarm = true;
  }

  // System alarm is active if water alarm OR continuous flow alarm
  bool finalAlarm = waterAlarm || flowAlarm;

  // Output to LED & Buzzer
  digitalWrite(LED_PIN, finalAlarm ? HIGH : LOW);
  digitalWrite(BUZZER_PIN, finalAlarm ? HIGH : LOW);
}

// =====================================================
// JSON PAYLOAD GENERATOR
// =====================================================

String getSensorJSON() {
  bool waterAlarm = (waterStatus == "LOW" || waterStatus == "HIGH");

  String json = "{";
  json += "\"distance\":" + String(distanceCM, 2) + ",";
  json += "\"waterHeight\":" + String(waterHeightCM, 2) + ",";
  json += "\"waterPercentage\":" + String(waterPercentage, 1) + ",";
  json += "\"waterStatus\":\"" + waterStatus + "\",";
  json += "\"flowRate\":" + String(flowRate, 2) + ",";
  json += "\"totalLiters\":" + String(totalLiters, 2) + ",";
  json += "\"flowDetected\":" + String(flowDetected ? "true" : "false") + ",";
  json += "\"flowAlarm\":" + String(flowAlarm ? "true" : "false") + ",";
  json += "\"waterAlarm\":" + String(waterAlarm ? "true" : "false") + ",";
  json +=
      "\"systemAlarm\":" + String((waterAlarm || flowAlarm) ? "true" : "false");
  json += "}";

  return json;
}

// =====================================================
// WEB API ROUTE: /data
// =====================================================

void handleData() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(200, "application/json", getSensorJSON());
}

// =====================================================
// WEB UI ROUTE: /
// =====================================================

void handleRoot() {
  String page = "<!DOCTYPE html><html><head>";
  page += "<meta charset='UTF-8'>";
  page +=
      "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  page += "<title>Water Guardian ESP32</title>";
  page += "<style>";
  page += "body{font-family:sans-serif;background:#0b1329;color:#e2e8f0;"
          "padding:24px;margin:0;}";
  page +=
      ".card{max-width:540px;margin:20px auto;background:#132042;border:1px "
      "solid #1e293b;border-radius:16px;padding:24px;box-shadow:0 8px 32px "
      "rgba(0,0,0,0.4);}";
  page += "h1{color:#38bdf8;margin-top:0;font-size:24px;}";
  page += "pre{background:#0a0f1d;border:1px solid "
          "#334155;border-radius:8px;padding:16px;font-size:14px;color:#38bdf8;"
          "overflow:auto;}";
  page += ".badge{display:inline-block;padding:4px "
          "10px;border-radius:999px;font-size:12px;font-weight:bold;margin-"
          "bottom:12px;}";
  page += ".badge-ok{background:#065f46;color:#34d399;}";
  page += "</style>";
  page += "</head><body><div class='card'>";
  page += "<h1>Water Guardian</h1>";
  page += "<span class='badge badge-ok'>ESP32 ACTIVE</span>";
  page += "<p>Real-time sensor telemetry directly from ESP32:</p>";
  page += "<pre id='data'>Loading telemetry stream...</pre>";
  page += "<script>";
  page += "setInterval(async()=>{";
  page += "  try{";
  page += "    let r=await fetch('/data');";
  page += "    let d=await r.json();";
  page +=
      "    document.getElementById('data').innerText=JSON.stringify(d,null,2);";
  page += "  }catch(e){";
  page += "    document.getElementById('data').innerText='Connection error: "
          "'+e.message;";
  page += "  }";
  page += "},1000);";
  page += "</script></div></body></html>";

  server.send(200, "text/html", page);
}

// =====================================================
// SETUP
// =====================================================

void setup() {
  Serial.begin(115200);

  // ---------------------------------------------------
  // PIN CONFIGURATION
  // ---------------------------------------------------
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(FLOW_PIN, INPUT);

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Default state: OFF
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(TRIG_PIN, LOW);

  // ---------------------------------------------------
  // FLOW SENSOR INTERRUPT
  // ---------------------------------------------------
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowPulse, RISING);

  // ---------------------------------------------------
  // WI-FI CONNECTION
  // ---------------------------------------------------
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println();
  Serial.println("==========================================");
  Serial.println("         WATER GUARDIAN FIRMWARE          ");
  Serial.println("==========================================");
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("[WIFI] Connected successfully!");
  Serial.print("[WIFI] ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // ---------------------------------------------------
  // WEB SERVER ROUTES
  // ---------------------------------------------------
  server.on("/", handleRoot);
  server.on("/data", handleData);
  server.begin();

  Serial.println("[SERVER] HTTP Server started on port 80");
  Serial.print("[SERVER] Direct API: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/data");
  Serial.println("==========================================");

  lastFlowCalculation = millis();
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop() {
  // 1. Read ultrasonic sensor
  updateWaterData();

  // 2. Read flow pulses
  updateFlow();

  // 3. Update alarm outputs (LED & Buzzer)
  updateAlarm();

  // 4. Handle incoming HTTP client requests
  server.handleClient();

  // 5. Periodic Serial debug stream (every 1s)
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint >= 1000) {
    lastPrint = millis();

    Serial.println("----------------------------------------");
    Serial.print("Distance      : ");
    Serial.print(distanceCM);
    Serial.println(" cm");
    Serial.print("Water Height  : ");
    Serial.print(waterHeightCM);
    Serial.println(" cm");
    Serial.print("Water Level   : ");
    Serial.print(waterPercentage);
    Serial.println(" %");
    Serial.print("Water Status  : ");
    Serial.println(waterStatus);
    Serial.print("Flow Rate     : ");
    Serial.print(flowRate);
    Serial.println(" L/min");
    Serial.print("Total Flow    : ");
    Serial.print(totalLiters);
    Serial.println(" L");
    Serial.print("Flow Detected : ");
    Serial.println(flowDetected ? "YES" : "NO");
    Serial.print("Flow Alarm    : ");
    Serial.println(flowAlarm ? "ON" : "OFF");
    Serial.print("Water Alarm   : ");
    Serial.println((waterStatus == "LOW" || waterStatus == "HIGH") ? "ON"
                                                                   : "OFF");
    Serial.print("System Alarm  : ");
    bool alarm = (waterStatus == "LOW" || waterStatus == "HIGH" || flowAlarm);
    Serial.println(alarm ? "TRIGGERED (LED+BUZZER ACTIVE)" : "NORMAL");
  }

  delay(50);
}
