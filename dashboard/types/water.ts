// =============================================================================
// WaterGuardian TypeScript Types
// =============================================================================

export interface Device {
  id: string;
  device_id: string;
  device_name: string;
  location: string;
  tank_capacity: number;   // litres
  tank_height: number;     // cm
  status: 'online' | 'offline' | 'warning';
  last_seen: string | null;
  created_at: string;
}

export interface SensorReading {
  id: string;
  device_id: string;
  water_level_percent: number;
  water_volume_liters: number;
  flow_rate_lpm: number;
  distance_cm: number;
  created_at: string;
}

export type AlertType =
  | 'LOW_WATER'
  | 'HIGH_WATER'
  | 'HIGH_FLOW'
  | 'SENSOR_FAILURE'
  | 'DEVICE_OFFLINE';

export type AlertSeverity = 'critical' | 'warning' | 'notice' | 'info';

export interface Alert {
  id: string;
  device_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  value: number | null;
  created_at: string;
  resolved_at: string | null;
}

// ---- Derived / computed types -----------------------------------------------

export interface DashboardStats {
  latestReading: SensorReading | null;
  device: Device | null;
  activeAlertsCount: number;
  isOnline: boolean;
}

export type TimeRange = '24h' | '3d' | '7d';

export interface ChartDataPoint {
  time: string;
  level: number;
  volume: number;
  flow: number;
}

export interface AnalyticsSummary {
  avgLevel: number;
  maxLevel: number;
  minLevel: number;
  estimatedUsageLiters: number;
}
