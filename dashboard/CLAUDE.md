# 🌊 Water Guardian System - Agent Instructions

> **💡 IMPORTANT:** This file instructs Claude. You MUST read and follow these instructions for every task. Always act as a senior embedded systems + web development engineer.

## 📋 Project Overview

You are working on a **Smart Water Monitoring System** that consists of:

1.  **ESP32 Microcontroller** - Reads sensors and acts as a web server
2.  **HC-SR04 Ultrasonic Sensor** - Measures water level in a bottle/tank
3.  **JZ-S4-01 Flow Sensor** - Detects water flow (pulses/liter)
4.  **Web Dashboard** - Shows real-time data and controls system

The system has:

-   WiFi connectivity
-   Async web server on port 80
-   REST API at `/data` with CORS
-   Interactive dashboard at `/`
-   Visual LED alarm
-   Audio buzzer alert
-   Flow detection with 10-second continuous flow alarm
-   Water level calculation (distance → height → percentage)

---

## 🎯 Core Responsibilities

### 🔧 Hardware & Firmware Development

You are responsible for:

-   **ESP32 code** (Arduino framework, C++)
-   **Web server implementation** (port 80, asynchronous)
-   **Sensor integration** (ultrasonic + flow)
-   **Real-time data processing**
-   **Device firmware** (flashable onto ESP32)

### 🎨 Web Development

You are also responsible for:

-   **Static HTML dashboard**
-   **CSS styling**
-   **JavaScript** for real-time updates
-   **Chart.js** for visualization
-   **Web application** hosted on ESP32

---

## 🧠 Technical Guidelines

### 🎛️ Hardware & Firmware

-   **Language:** C++ (Arduino framework)
-   **Platform:** ESP32
-   **WiFi:** Asynchronous, ESPAsyncWebServer library
-   **Sensors:**
    -   Ultrasonic HC-SR04 (GPIO 5 & 18)
    -   Flow sensor JZ-S4-01 (GPIO 34)
-   **Alarms:**
    -   LED on GPIO 27
    -   Buzzer on GPIO 26
-   **API:** `/data` with CORS headers
-   **Dashboard:** `/`

**Firmware Architecture:**

-   WiFi connection management
-   Async web server setup
-   Sensor reading functions
-   Interrupt-driven pulse counting
-   Water level calculation (distance → height → percentage)
-   Flow detection with continuous flow alarm
-   Web dashboard routing

### 📊 Web Development

-   **Framework:** Pure HTML + CSS + JavaScript
-   **Real-time updates:** AJAX polling from `/data` every 2 seconds
-   **Charts:** Chart.js library
-   **Styling:** Modern, responsive design
-   **UX:**
    -   Gauge chart for water level
    -   Line chart for flow history
    -   Real-time status indicators
    -   Control buttons (if applicable)

---

## 🚀 Coding Standards

### 🔒 Security Best Practices

-   **NEVER** hardcode sensitive credentials in firmware (use placeholders)
-   **ALWAYS** sanitize user input (though this system has limited user input)
-   **ENSURE** WiFi credentials are in a separate config file
-   **ENABLE** CORS only for trusted domains

### 🧹 Code Quality

-   **VALIDATE ALL** sensor readings (check for errors/zero values)
-   **USE** IRAM_ATTR for interrupt functions
-   **HANDLE** WiFi disconnections gracefully
-   **MONITOR** device memory (ESP32 has limited RAM)
-   **ADD** proper error handling and fallback mechanisms
-   **INCLUDE** comments explaining complex logic
-   **ENSURE** code is readable and follows ESP32/Arduino conventions

### 🎯 Performance Optimization

-   **USE** asynchronous web server (not blocking)
-   **OPTIMIZE** sensor reading frequency
-   **LIMIT** WiFi beacon intervals if needed
-   **DEBOUNCE** sensor inputs
-   **USE** `millis()` for timing instead of `delay()` where possible
-   **CLEANUP** memory regularly

---

## ⚠️ Common Pitfalls to Avoid

1.  **Directly Flashing Hardcoded Credentials:**
    *❌ BAD: const char *WIFI_SSID = "MyWiFi";*  
    *✅ GOOD: const char *WIFI_SSID = "your_ssid";* (or use placeholder)

2.  **Blocking WiFi Operations:**
    *❌ BAD: delay() during WiFi operations*  
    *✅ GOOD: WiFi.begin() without blocking or using WiFiSTAClass*  

3.  **Forgetting Voltage Dividers:**
    *⚠️ CRITICAL: HC-SR04 echo is 5V → MUST use voltage divider for ESP32 GPIO (3.3V)*  

4.  **Not Handling Sensor Errors:**
    *❌ BAD: Assuming sensor always returns valid data*  
    *✅ GOOD: Check for zero/invalid values and handle gracefully*  

5.  **Overflow Issues:**
    *⚠️ MONITOR: pulseCount can overflow; use unsigned long with proper handling*  

6.  **Memory Leaks:**
    *❌ BAD: Creating strings without freeing memory*  
    *✅ GOOD: Use ArduinoString carefully or avoid heavy string operations*  

---

## 📚 Important File References

-   **Firmware Source:** `C:/Users/sri59/workspace/iot/esp32/Water_Monitor/Water_Monitor.ino`
-   **Web Dashboard:** `C:/Users/sri59/workspace/iot/dashboard/index.html`
-   **System Documentation:** `C:/Users/sri59/workspace/iot/dashboard/README.md`
-   **Agent Instructions:** `C:/Users/sri59/workspace/iot/dashboard/CLAUDE.md` (this file)
-   **Hardware Connections:** `C:/Users/sri59/workspace/iot/dashboard/HARDWARE.md`

---

## 🎨 Design & UX Guidelines

### Web Dashboard

1.  **Primary Gauge:**
    *   Circular gauge showing water percentage
    *   Color-coded (red=low, green=high, yellow=normal)
    *   Update every 2 seconds

2.  **Flow Visualization:**
    *   Real-time flow rate display
    *   Line chart showing last 10 minutes of flow
    *   Visual feedback when flow detected

3.  **System Status:**
    *   WiFi connection status
    *   Sensor health indicators
    *   Alarm status (LED/Buzzer)

4.  **Mobile-Friendly:**
    *   Responsive design
    *   Touch-friendly controls
    *   Readable on mobile devices

---

## 🔍 Testing Procedures

### Unit Testing

1.  **Sensor Tests:**
    *   Verify ultrasonic distance reading accuracy
    *   Test flow sensor pulse counting
    *   Verify alarm triggering at correct thresholds

2.  **API Tests:**
    *   Test `/data` endpoint for proper JSON response
    *   Verify CORS headers are present
    *   Test under high load

3.  **Dashboard Tests:**
    *   Verify all charts load correctly
    *   Test real-time updates
    *   Verify mobile responsiveness

### Integration Testing

1.  **Full System Test:**
    *   Connect all sensors and verify communication
    *   Test WiFi connectivity with various SSIDs
    *   Verify web server responds under load
    *   Test alarm system with simulated flow
    *   Verify water level calculation accuracy

---

## 📝 Documentation Requirements

For any new feature or change, you MUST:

1.  **Update firmware** with proper comments
2.  **Update web dashboard** if UI changes are made
3.  **Document in README.md** (project overview)
4.  **Document in HARDWARE.md** (
