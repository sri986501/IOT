#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <math.h>
#include <string.h>

// ================================================
// WATER GUARDIAN - ESP32
// Fast sensor updates + independent cloud uploader
// Target Endpoint: dashboard/app/api/telemetry/route.ts
// ================================================

// Wi-Fi credentials
const char* WIFI_SSID = "SRIPRABANCHAN";
const char* WIFI_PASSWORD = "VETRIDEVI";

// Vercel API configuration - Points directly to route.ts
const char* API_URL = "https://iot-pi-nine.vercel.app/api/telemetry";
const char* DEVICE_TOKEN = "-yo1_XimjeNxK2NaDF2uFAvLSWCkji6T0_JR44Ktyc4";

// Hardware pins
#define TRIG_PIN    5
#define ECHO_PIN    18
#define FLOW_PIN    34
#define LED_PIN     27
#define BUZZER_PIN  26

// Tank and alarm configuration
const float TANK_HEIGHT_CM = 15.0;
const float HIGH_WATER_DISTANCE_CM = 5.0;
const float LOW_WATER_DISTANCE_CM = 10.0;

// Calibrate this against a known volume
const float PULSES_PER_LITER = 450.0;

// Timing
const unsigned long SENSOR_INTERVAL_MS = 100;
const unsigned long FLOW_INTERVAL_MS = 1000;
const unsigned long CLOUD_INTERVAL_MS = 3000;  // 3s interval for reliable HTTPS
const unsigned long SERIAL_INTERVAL_MS = 1000;
const unsigned long WIFI_RETRY_MS = 10000;

// Change to false if your buzzer module is active-LOW
const bool BUZZER_ACTIVE_HIGH = true;

// ================================================
// FLOW SENSOR ISR
// ================================================
volatile uint32_t flowPulseCount = 0;

portMUX_TYPE flowMux = portMUX_INITIALIZER_UNLOCKED;
portMUX_TYPE dataMux = portMUX_INITIALIZER_UNLOCKED;

void IRAM_ATTR flowPulseISR() {
  portENTER_CRITICAL_ISR(&flowMux);
  flowPulseCount++;
  portEXIT_CRITICAL_ISR(&flowMux);
}

// ================================================
// SHARED TELEMETRY DATA
// ================================================
struct Telemetry {
  float distanceCm;
  float waterHeightCm;
  float waterPercentage;
  float flowRateLMin;
  float totalLiters;

  bool flowDetected;
  bool highWaterAlarm;
  bool leakAlarm;
  bool systemAlarm;

  bool sensorError;
  char waterStatus[16];
};

Telemetry data = {
  0, 0, 0, 0, 0,
  false, false, false, false,
  true, "STARTING"
};

// Internal timing variables
unsigned long lastSensorRead = 0;
unsigned long lastFlowUpdate = 0;
unsigned long lastSerialPrint = 0;
unsigned long lastWiFiAttempt = 0;

uint32_t previousFlowPulses = 0;

// ================================================
// ULTRASONIC SENSOR
// ================================================
float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 25000UL);

  if (duration == 0) {
    return -1.0;
  }

  float distance = duration * 0.0343f / 2.0f;

  if (!isfinite(distance) || distance < 2.0f || distance > 400.0f) {
    return -1.0;
  }

  return distance;
}

// ================================================
// ALARM OUTPUTS
// ================================================
void applyAlarmOutputs(bool alarmOn) {
  digitalWrite(LED_PIN, alarmOn ? HIGH : LOW);

  if (BUZZER_ACTIVE_HIGH) {
    digitalWrite(BUZZER_PIN, alarmOn ? HIGH : LOW);
  } else {
    digitalWrite(BUZZER_PIN, alarmOn ? LOW : HIGH);
  }
}

// ================================================
// UPDATE WATER STATUS AND ALARMS
// ================================================
void updateWaterStatus(float distance) {
  Telemetry next = {};

  if (distance < 0) {
    next.sensorError = true;
    next.systemAlarm = true;
    next.highWaterAlarm = false;
    next.leakAlarm = false;
    strcpy(next.waterStatus, "SENSOR_ERROR");

    portENTER_CRITICAL(&dataMux);
    next.flowDetected = data.flowDetected;
    next.flowRateLMin = data.flowRateLMin;
    next.totalLiters = data.totalLiters;
    data = next;
    portEXIT_CRITICAL(&dataMux);

    applyAlarmOutputs(true);
    return;
  }

  next.sensorError = false;
  next.distanceCm = distance;
  next.waterHeightCm = TANK_HEIGHT_CM - distance;

  if (next.waterHeightCm < 0) {
    next.waterHeightCm = 0;
  }
  if (next.waterHeightCm > TANK_HEIGHT_CM) {
    next.waterHeightCm = TANK_HEIGHT_CM;
  }

  next.waterPercentage = (next.waterHeightCm / TANK_HEIGHT_CM) * 100.0f;

  if (distance <= HIGH_WATER_DISTANCE_CM) {
    strcpy(next.waterStatus, "HIGH");
    next.highWaterAlarm = true;
  } else if (distance <= LOW_WATER_DISTANCE_CM) {
    strcpy(next.waterStatus, "NORMAL");
    next.highWaterAlarm = false;
  } else {
    strcpy(next.waterStatus, "LOW");
    next.highWaterAlarm = false;
  }

  portENTER_CRITICAL(&dataMux);
  next.flowDetected = data.flowDetected;
  next.flowRateLMin = data.flowRateLMin;
  next.totalLiters = data.totalLiters;
  portEXIT_CRITICAL(&dataMux);

  // Leak heuristic: LOW water + flow detected
  next.leakAlarm = (strcmp(next.waterStatus, "LOW") == 0) && next.flowDetected;
  next.systemAlarm = next.highWaterAlarm || next.leakAlarm;

  portENTER_CRITICAL(&dataMux);
  data = next;
  portEXIT_CRITICAL(&dataMux);

  applyAlarmOutputs(next.systemAlarm);
}

// ================================================
// FLOW MEASUREMENTS
// ================================================
uint32_t getFlowPulseCount() {
  uint32_t count;
  portENTER_CRITICAL(&flowMux);
  count = flowPulseCount;
  portEXIT_CRITICAL(&flowMux);
  return count;
}

void updateFlowMeasurements(unsigned long elapsedMs) {
  uint32_t currentPulses = getFlowPulseCount();
  uint32_t newPulses = currentPulses - previousFlowPulses;
  previousFlowPulses = currentPulses;

  float flowRate = 0.0f;
  if (elapsedMs > 0) {
    flowRate = ((float)newPulses / PULSES_PER_LITER) * 60000.0f / (float)elapsedMs;
  }

  float totalLiters = (float)currentPulses / PULSES_PER_LITER;
  bool flowDetected = (newPulses > 0);

  portENTER_CRITICAL(&dataMux);
  data.flowRateLMin = flowRate;
  data.totalLiters = totalLiters;
  data.flowDetected = flowDetected;
  portEXIT_CRITICAL(&dataMux);

  float distance;
  bool sensorError;
  portENTER_CRITICAL(&dataMux);
  distance = data.distanceCm;
  sensorError = data.sensorError;
  portEXIT_CRITICAL(&dataMux);

  if (sensorError) {
    applyAlarmOutputs(true);
  } else {
    updateWaterStatus(distance);
  }
}

// ================================================
// WIFI MANAGEMENT
// ================================================
void startWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWiFiAttempt = millis();
  Serial.println("Connecting to Wi-Fi...");
}

void maintainWiFi() {
  unsigned long now = millis();
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }
  if (now - lastWiFiAttempt >= WIFI_RETRY_MS) {
    lastWiFiAttempt = now;
    Serial.println("WIFI STATUS: DISCONNECTED - Retrying...");
    WiFi.reconnect();
  }
}

// ================================================
// SERIAL MONITOR
// ================================================
void printStatus() {
  Telemetry snapshot;
  portENTER_CRITICAL(&dataMux);
  snapshot = data;
  portEXIT_CRITICAL(&dataMux);

  Serial.println();
  Serial.println("========== WATER GUARDIAN ==========");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WIFI STATUS: CONNECTED | IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WIFI STATUS: DISCONNECTED");
  }

  if (snapshot.sensorError) {
    Serial.println("SENSOR STATUS: ERROR");
  } else {
    Serial.print("Distance: ");
    Serial.print(snapshot.distanceCm, 2);
    Serial.println(" cm");

    Serial.print("Water Height: ");
    Serial.print(snapshot.waterHeightCm, 2);
    Serial.println(" cm");

    Serial.print("Water Level: ");
    Serial.print(snapshot.waterPercentage, 2);
    Serial.println(" %");

    Serial.print("Water Status: ");
    Serial.println(snapshot.waterStatus);
  }

  Serial.print("Flow Rate: ");
  Serial.print(snapshot.flowRateLMin, 2);
  Serial.println(" L/min");

  Serial.print("Total Water: ");
  Serial.print(snapshot.totalLiters, 2);
  Serial.println(" L");

  Serial.print("Flow Detected: ");
  Serial.println(snapshot.flowDetected ? "YES" : "NO");

  Serial.print("High Water Alarm: ");
  Serial.println(snapshot.highWaterAlarm ? "ON" : "OFF");

  Serial.print("Leak Alarm: ");
  Serial.println(snapshot.leakAlarm ? "ON" : "OFF");

  Serial.print("System Alarm: ");
  Serial.println(snapshot.systemAlarm ? "ON" : "OFF");
  Serial.println("====================================");
}

// ================================================
// CLOUD UPLOAD TASK (Core 0)
// Streams directly to route.ts on Vercel
// ================================================
void cloudUploadTask(void* parameter) {
  unsigned long lastUpload = 0;

  for (;;) {
    unsigned long now = millis();

    if (now - lastUpload >= CLOUD_INTERVAL_MS) {
      lastUpload = now;

      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("CLOUD STATUS: WIFI OFFLINE");
      } else {
        Telemetry snapshot;
        portENTER_CRITICAL(&dataMux);
        snapshot = data;
        portEXIT_CRITICAL(&dataMux);

        char payload[600];
        snprintf(
          payload,
          sizeof(payload),
          "{"
            "\"distance_cm\":%.2f,"
            "\"water_height_cm\":%.2f,"
            "\"water_percentage\":%.2f,"
            "\"water_status\":\"%s\","
            "\"flow_rate_l_min\":%.2f,"
            "\"total_liters\":%.2f,"
            "\"flow_detected\":%s,"
            "\"high_water_alarm\":%s,"
            "\"leak_alarm\":%s,"
            "\"system_alarm\":%s"
          "}",
          snapshot.distanceCm,
          snapshot.waterHeightCm,
          snapshot.waterPercentage,
          snapshot.waterStatus,
          snapshot.flowRateLMin,
          snapshot.totalLiters,
          snapshot.flowDetected ? "true" : "false",
          snapshot.highWaterAlarm ? "true" : "false",
          snapshot.leakAlarm ? "true" : "false",
          snapshot.systemAlarm ? "true" : "false"
        );

        WiFiClientSecure client;
        client.setInsecure();

        HTTPClient http;
        http.setConnectTimeout(3000);
        http.setTimeout(4000);

        if (http.begin(client, API_URL)) {
          http.addHeader("Content-Type", "application/json");
          http.addHeader("x-device-token", DEVICE_TOKEN);

          int httpCode = http.POST((uint8_t*)payload, strlen(payload));

          Serial.print("CLOUD UPLOAD: HTTP ");
          Serial.println(httpCode);

          if (httpCode == 201 || httpCode == 200) {
            Serial.println("-> Telemetry saved to Supabase & Live Dashboard!");
          } else if (httpCode > 0) {
            Serial.print("-> Server response: ");
            Serial.println(http.getString());
          } else {
            Serial.print("-> Error: ");
            Serial.println(http.errorToString(httpCode));
          }

          http.end();
        } else {
          Serial.println("CLOUD STATUS: HTTP BEGIN FAILED");
        }

        client.stop();
      }
    }

    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

// ================================================
// SETUP
// ================================================
void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(FLOW_PIN, INPUT);

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, BUZZER_ACTIVE_HIGH ? LOW : HIGH);

  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowPulseISR, FALLING);

  Serial.println();
  Serial.println("WATER GUARDIAN STARTING...");

  startWiFi();

  // Run cloud uploader on Core 0 so it never blocks sensor reads on Core 1
  BaseType_t result = xTaskCreatePinnedToCore(
    cloudUploadTask,
    "CloudUpload",
    8192,
    nullptr,
    1,
    nullptr,
    0
  );

  if (result != pdPASS) {
    Serial.println("ERROR: Cloud task creation failed");
  }
}

// ================================================
// MAIN LOOP (Core 1)
// ================================================
void loop() {
  unsigned long now = millis();

  maintainWiFi();

  if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = now;
    float distance = readDistanceCm();
    updateWaterStatus(distance);
  }

  if (now - lastFlowUpdate >= FLOW_INTERVAL_MS) {
    unsigned long elapsed = now - lastFlowUpdate;
    lastFlowUpdate = now;
    updateFlowMeasurements(elapsed);
  }

  if (now - lastSerialPrint >= SERIAL_INTERVAL_MS) {
    lastSerialPrint = now;
    printStatus();
  }
}
