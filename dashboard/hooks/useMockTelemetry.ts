'use client';

import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { fetchLatestReading, fetchDevice, fetchActiveAlerts } from '@/lib/api';
import { useRealtimeReadings, useRealtimeAlerts, useRealtimeDeviceStatus } from '@/lib/realtime';

const POLL_ESP32_INTERVAL_MS = 1000;
const MOCK_INTERVAL_MS = 2000;

/**
 * useMockTelemetry
 * - Priority 1: Direct ESP32 HTTP stream (/api/esp32/telemetry)
 * - Priority 2: Supabase Realtime DB stream
 * - Priority 3: Built-in SCADA Simulation Engine
 */
export function useMockTelemetry(deviceId = 'ESP32-001') {
  const store = useTelemetryStore();
  const mockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const esp32PollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mockState = useRef({
    distanceCm: 25.0,
    flowBase: 8.5,
    uptimeSeconds: 0,
    filling: false,
  });

  // ── Real Supabase data path ───────────────────────────────────────────────
  useRealtimeReadings(deviceId, (reading) => {
    store.setMockMode(false);
    if (mockRef.current) clearInterval(mockRef.current);
    applyReading(reading.distance_cm, reading.flow_rate_lpm, reading.created_at);
  });

  useRealtimeAlerts(deviceId, (alert) => {
    store.setAlerts([alert, ...store.alerts].slice(0, 50));
  });

  useRealtimeDeviceStatus(deviceId, (device) => {
    store.setDevice(device);
    store.setHardware({ esp32Connected: device.status === 'online' });
  });

  // Initial fetch & start polling
  useEffect(() => {
    let isCancelled = false;

    async function checkHardwareAndInit() {
      // 1. Try direct ESP32 connection
      try {
        const espRes = await fetch('/api/esp32/telemetry');
        if (espRes.ok) {
          const espJson = await espRes.json();
          if (espJson.success && espJson.data && !isCancelled) {
            store.setMockMode(false);
            store.setHardware({
              esp32Connected: true,
              oledStatus: true,
              ultrasonicEchoLatencyMs: Math.round(espJson.data.distance_cm * 0.583 * 2),
            });
            applyESP32Reading(espJson.data);
            startESP32Polling();
            return;
          }
        }
      } catch {
        // ESP32 offline, continue to Supabase / Mock
      }

      // 2. Try Supabase
      const [reading, device, alerts] = await Promise.all([
        fetchLatestReading(deviceId),
        fetchDevice(deviceId),
        fetchActiveAlerts(deviceId),
      ]);

      if (isCancelled) return;

      store.setDevice(device);
      store.setAlerts(alerts);

      if (reading) {
        store.setMockMode(false);
        store.setHardware({
          esp32Connected: device?.status === 'online',
          oledStatus: true,
          ultrasonicEchoLatencyMs: Math.round(reading.distance_cm * 0.583 * 2),
        });
        applyReading(reading.distance_cm, reading.flow_rate_lpm, reading.created_at);
      } else {
        // 3. Fallback: Start Simulation engine + background ESP32 detector
        store.setMockMode(true);
        startMock();
        startESP32Polling();
      }
    }

    checkHardwareAndInit();

    return () => {
      isCancelled = true;
      if (mockRef.current) clearInterval(mockRef.current);
      if (esp32PollRef.current) clearInterval(esp32PollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startESP32Polling() {
    if (esp32PollRef.current) return;
    esp32PollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/esp32/telemetry');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            // ESP32 is actively replying! Switch off mock mode
            if (mockRef.current) {
              clearInterval(mockRef.current);
              mockRef.current = null;
            }
            useTelemetryStore.getState().setMockMode(false);
            useTelemetryStore.getState().setHardware({
              esp32Connected: true,
              oledStatus: true,
              ultrasonicEchoLatencyMs: Math.round(json.data.distance_cm * 0.583 * 2),
            });
            applyESP32Reading(json.data);
          }
        }
      } catch {
        // Keep current state
      }
    }, POLL_ESP32_INTERVAL_MS);
  }

  function applyESP32Reading(data: any) {
    const tankHeightCm = 30; // Matches physical bottle height
    const liquidLevelCm = data.water_height_cm >= 0 ? data.water_height_cm : Math.max(0, tankHeightCm - data.distance_cm);
    const fillPercentage = data.water_level_percent >= 0 ? data.water_level_percent : (liquidLevelCm / tankHeightCm) * 100;
    const volumeLitres = data.total_liters ?? (fillPercentage / 100) * 1000;
    const timestamp = new Date().toISOString();

    useTelemetryStore.getState().setTelemetry({
      timestamp,
      tankHeightCm,
      distanceCm: Math.round(data.distance_cm * 10) / 10,
      liquidLevelCm: Math.round(liquidLevelCm * 10) / 10,
      volumeLitres: Math.round(volumeLitres * 10) / 10,
      fillPercentage: Math.round(fillPercentage * 10) / 10,
      flowRateLpm: Math.round(data.flow_rate_lpm * 10) / 10,
    });

    useTelemetryStore.getState().pushHistory({
      time: new Date(timestamp).toLocaleTimeString('en-IN', { hour12: false }),
      volume: Math.round(volumeLitres),
      flowRate: Math.round(data.flow_rate_lpm * 10) / 10,
      level: Math.round(fillPercentage * 10) / 10,
    });
  }

  // ── Simulation engine ─────────────────────────────────────────────────────
  function startMock() {
    if (mockRef.current) return;
    mockRef.current = setInterval(() => {
      const s = mockState.current;
      s.uptimeSeconds += MOCK_INTERVAL_MS / 1000;

      const noise = (Math.random() - 0.5) * 0.4;
      const storeState = useTelemetryStore.getState();
      if (storeState.pumpOverride) {
        s.distanceCm = Math.max(2, s.distanceCm - 0.3);
      } else {
        s.distanceCm = Math.min(98, s.distanceCm + 0.05);
      }

      s.flowBase += (Math.random() - 0.5) * 0.2;
      s.flowBase = Math.max(3, Math.min(18, s.flowBase));
      const flow = Math.max(0, s.flowBase + storeState.flowAdjustment);
      const latency = 12 + Math.random() * 33;

      storeState.setHardware({
        esp32Connected: true,
        ultrasonicEchoLatencyMs: Math.round(latency),
        uptimeSeconds: s.uptimeSeconds,
        oledStatus: true,
      });

      applyReading(s.distanceCm + noise, flow, new Date().toISOString());
    }, MOCK_INTERVAL_MS);
  }

  function applyReading(distanceCm: number, flowRateLpm: number, timestamp: string) {
    const tankHeightCm = 100;
    const liquidLevelCm = Math.max(0, Math.min(tankHeightCm, tankHeightCm - distanceCm));
    const volumeLitres = (liquidLevelCm / tankHeightCm) * 1000;
    const fillPercentage = (liquidLevelCm / tankHeightCm) * 100;

    useTelemetryStore.getState().setTelemetry({
      timestamp,
      tankHeightCm,
      distanceCm: Math.round(distanceCm * 10) / 10,
      liquidLevelCm: Math.round(liquidLevelCm * 10) / 10,
      volumeLitres: Math.round(volumeLitres * 10) / 10,
      fillPercentage: Math.round(fillPercentage * 10) / 10,
      flowRateLpm: Math.round(flowRateLpm * 10) / 10,
    });

    useTelemetryStore.getState().pushHistory({
      time: new Date(timestamp).toLocaleTimeString('en-IN', { hour12: false }),
      volume: Math.round(volumeLitres),
      flowRate: Math.round(flowRateLpm * 10) / 10,
      level: Math.round(fillPercentage * 10) / 10,
    });
  }
}
