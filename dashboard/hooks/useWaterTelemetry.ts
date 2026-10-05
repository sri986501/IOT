import { useEffect, useState } from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';

export type Reading = {
  distance_cm: number;
  water_height_cm: number;
  water_percentage: number;
  water_status: string;
  flow_rate_l_min: number;
  total_liters: number;
  flow_detected: boolean;
  high_water_alarm: boolean;
  leak_alarm: boolean;
  system_alarm: boolean;
  created_at?: string;
};

export function useWaterTelemetry() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const store = useTelemetryStore();

  useEffect(() => {
    let active = true;

    async function fetchTelemetry() {
      try {
        const response = await fetch('/api/telemetry', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!active) return;

        const currentReading: Reading | null = data.reading ?? null;
        const isConn = Boolean(data.connected && currentReading);

        setReading(currentReading);
        setConnected(isConn);
        setError('');

        if (currentReading) {
          const now = currentReading.created_at || new Date().toISOString();
          // Tank capacity is 1,000 Litres: Available Fluid calculated from water_percentage
          const tankCapacityL = 1000;
          const availableFluidL = Math.round((currentReading.water_percentage / 100) * tankCapacityL);

          store.setMockMode(false);
          store.setHardware({
            esp32Connected: true,
            oledStatus: true,
            ultrasonicEchoLatencyMs: Math.max(1, Math.round(currentReading.distance_cm * 0.583 * 2)),
          });

          store.setTelemetry({
            timestamp: now,
            tankHeightCm: 30,
            distanceCm: Math.round(currentReading.distance_cm * 10) / 10,
            liquidLevelCm: Math.round(currentReading.water_height_cm * 10) / 10,
            fillPercentage: Math.round(currentReading.water_percentage * 10) / 10,
            volumeLitres: availableFluidL,
            flowRateLpm: Math.round(currentReading.flow_rate_l_min * 10) / 10,
            waterStatus: currentReading.water_status,
            flowDetected: currentReading.flow_detected,
            leakAlarm: currentReading.leak_alarm,
            highWaterAlarm: currentReading.high_water_alarm,
            systemAlarm: currentReading.system_alarm,
            totalLiters: currentReading.total_liters,
          });

          // Push into chart history so "Awaiting packet telemetry stream..." clears
          store.pushHistory({
            time: new Date(now).toLocaleTimeString('en-IN', { hour12: false }),
            volume: availableFluidL,
            flowRate: Math.round(currentReading.flow_rate_l_min * 10) / 10,
            level: Math.round(currentReading.water_percentage * 10) / 10,
          });

          // If alarms are triggered, register alerts in store
          if (currentReading.system_alarm || currentReading.leak_alarm || currentReading.high_water_alarm) {
            const activeAlarms: any[] = [];
            if (currentReading.leak_alarm) {
              activeAlarms.push({
                id: 'leak-' + Date.now(),
                device_id: 'ESP32-001',
                alert_type: 'HIGH_FLOW',
                severity: 'critical',
                message: 'Continuous Water Flow / Leak Detected (>10s continuous flow)',
                value: currentReading.flow_rate_l_min,
                created_at: now,
                resolved_at: null,
              });
            }
            if (currentReading.high_water_alarm || currentReading.water_status === 'HIGH') {
              activeAlarms.push({
                id: 'high-' + Date.now(),
                device_id: 'ESP32-001',
                alert_type: 'HIGH_WATER',
                severity: 'warning',
                message: 'High Water Level Exceeded Safety Threshold',
                value: currentReading.water_percentage,
                created_at: now,
                resolved_at: null,
              });
            }
            if (currentReading.water_status === 'LOW') {
              activeAlarms.push({
                id: 'low-' + Date.now(),
                device_id: 'ESP32-001',
                alert_type: 'LOW_WATER',
                severity: 'warning',
                message: 'Low Water Level Detected in Reservoir',
                value: currentReading.water_percentage,
                created_at: now,
                resolved_at: null,
              });
            }
            if (activeAlarms.length > 0) {
              store.setAlerts(activeAlarms);
            }
          }
        } else {
          // If no reading yet
          store.setHardware({ esp32Connected: false });
        }
      } catch (err: any) {
        if (!active) return;
        setConnected(false);
        setError('Unable to fetch live sensor data');
        store.setHardware({ esp32Connected: false });
      }
    }

    // Initial fetch
    fetchTelemetry();

    // 7-second polling interval matching ESP32 7-second upload cadence
    const timer = setInterval(fetchTelemetry, 7000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return { reading, connected, error };
}
