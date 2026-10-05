
# 🌊 Water Guardian — Smart IoT Water Monitoring & Alert System
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino-red?style=for-the-badge&logo=espressif)](https://www.espressif.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
**Water Guardian** is an end-to-end IoT solution for real-time water storage and flow monitoring. Built with an **ESP32 microcontroller**, precision sensors, a **Supabase** cloud backend, and a modern **Next.js** real-time analytics dashboard.
---
## 📑 Table of Contents
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Hardware Wiring & Pinout](#-hardware-wiring--pinout)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [1. Database Setup (Supabase)](#1-database-setup-supabase)
  - [2. Firmware Setup (ESP32)](#2-firmware-setup-esp32)
  - [3. Dashboard Setup (Next.js)](#3-dashboard-setup-nextjs)
- [API Reference](#-api-reference)
- [Troubleshooting & Calibration](#-troubleshooting--calibration)
- [License](#-license)
---
## ✨ Features
- **Real-Time Tank Level Monitoring**: Measures water depth, remaining percentage, and total volume using an ultrasonic distance sensor.
- **Precision Flow Rate Tracking**: High-accuracy pulse-based water flow meter calculates liters-per-minute (LPM) and aggregate consumption.
- **Autonomous Multi-Stage Alerts**:
  - **Local Hardware Alarms**: Onboard warning LED and high-decibel active buzzer siren trigger on low/overflow water levels or abnormal continuous flow.
  - **Cloud Alerts**: Instant notification records stored in Supabase with severity tags (`critical`, `warning`, `notice`).
- **Dual Dashboard Modes**:
  - **Cloud Next.js Dashboard**: High-performance dashboard featuring Recharts analytics, Framer Motion animations, device status, and live telemetry.
  - **Local ESP32 Web Server**: Embedded fallback HTTP server and JSON API hosted directly on the ESP32 (Port 80) for local network monitoring.
---
## 🏛️ System Architecture
```mermaid
graph TD
    A[HC-SR04 Ultrasonic Sensor] -->|GPIO 5 / 18| ESP[ESP32 Microcontroller]
    B[JZ-S4-01 Flow Sensor] -->|GPIO 34 Interrupt| ESP
    ESP -->|GPIO 27| LED[Visual LED Indicator]
    ESP -->|GPIO 26| BUZZ[Active Buzzer Siren]
    
    ESP -->|Local HTTP / Port 80| LOCAL[Local Web UI / REST API]
    ESP -->|Wi-Fi Telemetry Sync| SUPA[(Supabase PostgreSQL)]
    
    SUPA -->|Real-time Subscriptions| DASH[Next.js Web Dashboard]
🔌 Hardware Wiring & Pinout
Components Required
ESP32 Dev Module (ESP-WROOM-32)
HC-SR04 Ultrasonic Distance Sensor
JZ-S4-01 Hall Effect Water Flow Sensor
Active Buzzer (3.3V - 5V)
Warning LED + 220Ω Resistor
Resistors for Voltage Divider (1kΩ and 2kΩ recommended for HC-SR04 ECHO pin)
Pin Configuration Table
Component	Pin	ESP32 GPIO	Description / Notes
HC-SR04	VCC	5V / VIN	Sensor power supply
HC-SR04	GND	GND	Ground
HC-SR04	TRIG	GPIO 5	Trigger signal (Output)
HC-SR04	ECHO	GPIO 18	Echo pulse (Input) — Use voltage divider (5V → 3.3V)
Flow Sensor	VCC	5V / 3.3V	Hall sensor power
Flow Sensor	GND	GND	Ground
Flow Sensor	SIG	GPIO 34	Pulse interrupt input (Pull-up recommended)
Alert LED	Anode (+)	GPIO 27	Through 220Ω current-limiting resistor
Alert LED	Cathode (-)	GND	Ground
Buzzer	VCC (+)	GPIO 26	Active buzzer control
Buzzer	GND (-)	GND	Ground
📂 Project Structure
text
├── dashboard/              # Next.js 16 web application
│   ├── app/                # App router (pages, layouts, API routes)
│   ├── components/         # Reusable UI components & charts
│   ├── hooks/              # Custom React hooks (realtime listeners)
│   ├── lib/                # Supabase client & utilities
│   ├── store/              # Zustand global state stores
│   └── types/              # TypeScript type definitions
├── esp32/                  # ESP32 firmware source
│   ├── sketch.ino          # Main Arduino / ESP32 code
│   └── libraries.txt       # Dependency / library list
├── supabase/               # Database definitions & migrations
│   ├── schema.sql          # Table schemas, indices, and RLS policies
│   └── cleanup.sql         # 7-day automated data retention cron job
├── package.json            # Root workspace scripts
└── README.md
🚀 Getting Started
1. Database Setup (Supabase)
Create a project at Supabase.com.
Open the SQL Editor in your Supabase project dashboard.
Paste and run the contents of 

supabase/schema.sql
.
(Optional) Set up the data retention cleanup job by running 

supabase/cleanup.sql
.
Obtain your Project URL and Anon Public Key from Settings → API.
2. Firmware Setup (ESP32)
Open 

esp32/sketch.ino
 in Arduino IDE or VS Code + PlatformIO.
Install required board packages and libraries:
ESP32 Board Support (esp32 by Espressif)
WebServer.h, WiFi.h (Built into ESP32 core)
Configure your network credentials and tank dimensions in sketch.ino:
cpp
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const float BOTTLE_HEIGHT_CM = 30.0; // Calibrate to your tank height
Connect your ESP32 via USB and click Upload.
Open the Serial Monitor at 115200 baud to view the assigned IP address.
3. Dashboard Setup (Next.js)
Navigate to the dashboard directory:
bash
cd dashboard
Install dependencies:
bash
npm install
Create a .env.local file based on .env.local.example:
env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
Start the local development server:
bash
npm run dev
Open http://localhost:3000 in your browser.
💡 Pro Tip: You can also run commands directly from the root repository:

bash
npm run dev   # Starts dashboard in dev mode
npm run build # Builds the production bundle
📡 API Reference
When connected to your local network, the ESP32 hosts a built-in JSON REST endpoint:

GET /data
Returns current sensor metrics in JSON format with permissive CORS headers.

Sample Response:

json
{
  "distance_cm": 12.4,
  "water_height_cm": 17.6,
  "water_level_pct": 58.67,
  "volume_liters": 2.93,
  "flow_rate_lpm": 1.25,
  "total_liters": 14.80,
  "is_flowing": true,
  "flow_duration_s": 4,
  "alert_led": false,
  "alert_buzzer": false,
  "uptime_s": 3600
}
🛠️ Calibration & Diagnostics
Ultrasonic Distance: Ensure the HC-SR04 sensor has a clear line of sight to the water surface without condensation on the transducer faces.
Flow Sensor Calibration Factor: Pulse conversion rates may differ between flow sensor models. Adjust the calibration multiplier in sketch.ino (PULSES_PER_LITER) if testing against a known volume.
5V to 3.3V Logic Protection: The HC-SR04 ECHO output is 5V. Use a simple voltage divider (e.g. 1kΩ / 2kΩ) before connecting to ESP32 GPIO 18 to protect the pin.
