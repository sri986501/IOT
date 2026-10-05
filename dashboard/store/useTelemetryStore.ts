import { create } from 'zustand';
import type { SensorReading, Alert, Device } from '@/types/water';

export interface TelemetryPacket {
  timestamp: string;
  tankHeightCm: number;
  distanceCm: number;
  liquidLevelCm: number;
  volumeLitres: number;
  fillPercentage: number;
  flowRateLpm: number;
  pumpActive: boolean;
  solenoidActive: boolean;
  systemHealth: 'optimal' | 'warning' | 'critical' | 'offline';
  warningState: 'none' | 'low' | 'critical' | 'overflow';
  waterStatus?: string;
  flowDetected?: boolean;
  leakAlarm?: boolean;
  highWaterAlarm?: boolean;
  systemAlarm?: boolean;
  totalLiters?: number;
}

export interface HardwareStatus {
  esp32Connected: boolean;
  oledStatus: boolean;
  ultrasonicEchoLatencyMs: number;
  rotaryState: number;
  uptimeSeconds: number;
}

export interface HistoricalDataPoint {
  time: string;
  volume: number;
  flowRate: number;
  level: number;
}

export interface ThresholdConfig {
  criticalLowPercent: number;
  warningLowPercent: number;
  overflowPercent: number;
  maxFlowLpm: number;
}

interface TelemetryStore {
  // Live telemetry
  telemetry: TelemetryPacket;
  hardware: HardwareStatus;
  history: HistoricalDataPoint[];
  alerts: Alert[];
  device: Device | null;

  // Controls
  pumpOverride: boolean;
  solenoidOverride: boolean;
  flowAdjustment: number;

  // Thresholds
  thresholds: ThresholdConfig;

  // UI state
  isMockMode: boolean;
  isPollingReading: boolean;
  emergencyShutdown: boolean;
  alertsAcknowledged: Set<string>;

  // Actions
  setTelemetry: (t: Partial<TelemetryPacket>) => void;
  setHardware: (h: Partial<HardwareStatus>) => void;
  pushHistory: (point: HistoricalDataPoint) => void;
  setAlerts: (alerts: Alert[]) => void;
  setDevice: (device: Device | null) => void;
  togglePump: () => void;
  toggleSolenoid: () => void;
  adjustFlow: (delta: number) => void;
  resetFlow: () => void;
  triggerEmergencyShutdown: () => void;
  clearEmergencyShutdown: () => void;
  acknowledgeAlert: (id: string) => void;
  setMockMode: (mock: boolean) => void;
  updateThresholds: (t: Partial<ThresholdConfig>) => void;
  pollReading: () => Promise<void>;
}

const defaultTelemetry: TelemetryPacket = {
  timestamp: new Date().toISOString(),
  tankHeightCm: 100,
  distanceCm: 25.4,
  liquidLevelCm: 74.6,
  volumeLitres: 746,
  fillPercentage: 74.6,
  flowRateLpm: 8.4,
  pumpActive: false,
  solenoidActive: true,
  systemHealth: 'optimal',
  warningState: 'none',
};

const defaultHardware: HardwareStatus = {
  esp32Connected: true,
  oledStatus: true,
  ultrasonicEchoLatencyMs: 18,
  rotaryState: 0,
  uptimeSeconds: 120,
};

export const useTelemetryStore = create<TelemetryStore>((set, get) => ({
  telemetry: defaultTelemetry,
  hardware: defaultHardware,
  history: [],
  alerts: [],
  device: null,
  pumpOverride: false,
  solenoidOverride: false,
  flowAdjustment: 0,
  thresholds: {
    criticalLowPercent: 10,
    warningLowPercent: 20,
    overflowPercent: 95,
    maxFlowLpm: 20,
  },
  isMockMode: false,
  isPollingReading: false,
  emergencyShutdown: false,
  alertsAcknowledged: new Set(),

  setTelemetry: (t) =>
    set((s) => {
      const merged = { ...s.telemetry, ...t };
      let warningState: TelemetryPacket['warningState'] = 'none';
      let systemHealth: TelemetryPacket['systemHealth'] = 'optimal';
      if (merged.fillPercentage <= s.thresholds.criticalLowPercent) {
        warningState = 'critical';
        systemHealth = 'critical';
      } else if (merged.fillPercentage <= s.thresholds.warningLowPercent) {
        warningState = 'low';
        systemHealth = 'warning';
      } else if (merged.fillPercentage >= s.thresholds.overflowPercent) {
        warningState = 'overflow';
        systemHealth = 'warning';
      }
      return { telemetry: { ...merged, warningState, systemHealth } };
    }),

  setHardware: (h) =>
    set((s) => ({ hardware: { ...s.hardware, ...h } })),

  pushHistory: (point) =>
    set((s) => ({
      history: [...s.history.slice(-199), point],
    })),

  setAlerts: (alerts) => set({ alerts }),
  setDevice: (device) => set({ device }),

  togglePump: () =>
    set((s) => ({ pumpOverride: !s.pumpOverride })),

  toggleSolenoid: () =>
    set((s) => ({ solenoidOverride: !s.solenoidOverride })),

  adjustFlow: (delta) =>
    set((s) => ({
      flowAdjustment: Math.max(-10, Math.min(10, s.flowAdjustment + delta)),
    })),

  resetFlow: () => set({ flowAdjustment: 0 }),

  triggerEmergencyShutdown: () =>
    set({ emergencyShutdown: true, pumpOverride: false, solenoidOverride: false, flowAdjustment: -99 }),

  clearEmergencyShutdown: () =>
    set({ emergencyShutdown: false, flowAdjustment: 0 }),

  acknowledgeAlert: (id) =>
    set((s) => {
      const next = new Set(s.alertsAcknowledged);
      next.add(id);
      return { alertsAcknowledged: next };
    }),

  setMockMode: (mock) => set({ isMockMode: mock }),

  updateThresholds: (t) =>
    set((s) => ({ thresholds: { ...s.thresholds, ...t } })),

  pollReading: async () => {
    set({ isPollingReading: true });
    try {
      // 1. Try primary /api/telemetry endpoint
      try {
        const telemRes = await fetch('/api/telemetry', { cache: 'no-store' });
        if (telemRes.ok) {
          const telemJson = await telemRes.json();
          if (telemJson.reading) {
            const r = telemJson.reading;
            const now = r.created_at || new Date().toISOString();
            const availableFluidL = Math.round((r.water_percentage / 100) * 1000);

            get().setMockMode(false);
            get().setHardware({
              esp32Connected: true,
              ultrasonicEchoLatencyMs: Math.max(1, Math.round(r.distance_cm * 0.583 * 2)),
            });
            get().setTelemetry({
              timestamp: now,
              tankHeightCm: 30,
              distanceCm: Math.round(r.distance_cm * 10) / 10,
              liquidLevelCm: Math.round(r.water_height_cm * 10) / 10,
              fillPercentage: Math.round(r.water_percentage * 10) / 10,
              volumeLitres: availableFluidL,
              flowRateLpm: Math.round(r.flow_rate_l_min * 10) / 10,
              waterStatus: r.water_status,
              flowDetected: r.flow_detected,
              leakAlarm: r.leak_alarm,
              highWaterAlarm: r.high_water_alarm,
              systemAlarm: r.system_alarm,
              totalLiters: r.total_liters,
            });
            get().pushHistory({
              time: new Date(now).toLocaleTimeString('en-IN', { hour12: false }),
              volume: availableFluidL,
              flowRate: Math.round(r.flow_rate_l_min * 10) / 10,
              level: Math.round(r.water_percentage * 10) / 10,
            });
            return;
          }
        }
      } catch {
        // Continue to secondary endpoints
      }

      // 2. Try direct ESP32 hardware endpoint
      try {
        const espRes = await fetch('/api/esp32/telemetry');
        if (espRes.ok) {
          const espJson = await espRes.json();
          if (espJson.success && espJson.data) {
            const d = espJson.data;
            const tankHeight = 30;
            const waterHeight = d.water_height_cm >= 0 ? d.water_height_cm : Math.max(0, tankHeight - d.distance_cm);
            const fillPct = d.water_level_percent >= 0 ? d.water_level_percent : (waterHeight / tankHeight) * 100;
            const vol = d.total_liters ?? (fillPct / 100) * 1000;
            const now = new Date().toISOString();

            get().setTelemetry({
              timestamp: now,
              tankHeightCm: tankHeight,
              distanceCm: Math.round(d.distance_cm * 10) / 10,
              liquidLevelCm: Math.round(waterHeight * 10) / 10,
              volumeLitres: Math.round(vol * 10) / 10,
              fillPercentage: Math.round(fillPct * 10) / 10,
              flowRateLpm: Math.round(d.flow_rate_lpm * 10) / 10,
            });
            get().pushHistory({
              time: new Date(now).toLocaleTimeString('en-IN', { hour12: false }),
              volume: Math.round(vol),
              flowRate: Math.round(d.flow_rate_lpm * 10) / 10,
              level: Math.round(fillPct * 10) / 10,
            });
            return;
          }
        }
      } catch {
        // Fall through to Supabase
      }

      // 2. Try Supabase readings API
      const res = await fetch('/api/readings?deviceId=ESP32-001');
      if (res.ok) {
        const json = await res.json();
        if (json.reading) {
          const r = json.reading;
          get().setTelemetry({
            timestamp: r.created_at,
            distanceCm: r.distance_cm,
            liquidLevelCm: Math.round((100 - r.distance_cm) * 10) / 10,
            volumeLitres: r.water_volume_liters,
            fillPercentage: r.water_level_percent,
            flowRateLpm: r.flow_rate_lpm,
          });
          get().pushHistory({
            time: new Date(r.created_at).toLocaleTimeString('en-IN', { hour12: false }),
            volume: Math.round(r.water_volume_liters),
            flowRate: Math.round(r.flow_rate_lpm * 10) / 10,
            level: Math.round(r.water_level_percent * 10) / 10,
          });
        }
      }
    } catch {
      // Fallback local fluctuation
      const s = get();
      const delta = (Math.random() - 0.48) * 2;
      const newPct = Math.max(10, Math.min(98, s.telemetry.fillPercentage + delta));
      const vol = (newPct / 100) * 1000;
      const dist = 100 - newPct;
      get().setTelemetry({
        timestamp: new Date().toISOString(),
        distanceCm: Math.round(dist * 10) / 10,
        liquidLevelCm: Math.round(newPct * 10) / 10,
        volumeLitres: Math.round(vol * 10) / 10,
        fillPercentage: Math.round(newPct * 10) / 10,
        flowRateLpm: Math.round((8.2 + Math.random() * 2) * 10) / 10,
      });
    } finally {
      setTimeout(() => set({ isPollingReading: false }), 400);
    }
  },
}));
