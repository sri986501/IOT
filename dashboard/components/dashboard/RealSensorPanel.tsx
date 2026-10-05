'use client';

import { useTelemetryStore } from '@/store/useTelemetryStore';
import { ShieldAlert, CheckCircle2, Waves, BellRing, Activity, Radio, Droplets } from 'lucide-react';

export function RealSensorPanel() {
  const { telemetry, hardware } = useTelemetryStore();

  const isFlowing = telemetry.flowDetected || telemetry.flowRateLpm > 0.05;
  const isHighAlarm = telemetry.highWaterAlarm || telemetry.waterStatus === 'HIGH';
  const isLeakAlarm = telemetry.leakAlarm;
  const isSystemAlarm = telemetry.systemAlarm || isHighAlarm || isLeakAlarm;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: '#059669' }} />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
            Live Sensor Status
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'JetBrains Mono',
            padding: '2px 8px',
            borderRadius: '6px',
            background: hardware.esp32Connected ? '#ECFDF5' : '#FFF1F2',
            color: hardware.esp32Connected ? '#059669' : '#E11D48',
            fontWeight: 700,
          }}
        >
          {hardware.esp32Connected ? '● ESP32 ONLINE' : '○ CONNECTING'}
        </span>
      </div>

      {/* Grid of Direct Sensor Measurements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {/* Metric 1: Water Height */}
        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            Water Height
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
            {telemetry.liquidLevelCm.toFixed(2)} <span style={{ fontSize: '13px', color: '#0284C7' }}>cm</span>
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8' }}>Tank Height: {telemetry.tankHeightCm} cm</div>
        </div>

        {/* Metric 2: Air Gap */}
        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            HC-SR04 Distance
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
            {telemetry.distanceCm.toFixed(2)} <span style={{ fontSize: '13px', color: '#D97706' }}>cm</span>
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8' }}>Sensor to Water Surface</div>
        </div>

        {/* Metric 3: Total Litres */}
        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            Cumulative Water
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
            {(telemetry.totalLiters ?? 0).toFixed(2)} <span style={{ fontSize: '13px', color: '#059669' }}>L</span>
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8' }}>Total Metered Volume</div>
        </div>

        {/* Metric 4: Flow Status */}
        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            Flow State
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 900,
              color: isFlowing ? '#059669' : '#64748B',
              fontFamily: 'Outfit, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isFlowing ? '#10B981' : '#94A3B8',
              }}
            />
            {isFlowing ? 'FLOWING' : 'IDLE'}
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8' }}>JZ-S4-01 Hall Sensor</div>
        </div>
      </div>

      {/* Safety Alarm Indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
          Sensor Alarm Status
        </div>

        {/* High Water Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '8px',
            background: isHighAlarm ? '#FFF1F2' : '#F8FAFC',
            border: `1px solid ${isHighAlarm ? '#FECDD3' : '#E2E8F0'}`,
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: isHighAlarm ? '#E11D48' : '#334155' }}>
            High Water Alarm
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono',
              color: isHighAlarm ? '#E11D48' : '#64748B',
            }}
          >
            {isHighAlarm ? 'TRIGGERED (ON)' : 'OFF'}
          </span>
        </div>

        {/* Leak Alert Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '8px',
            background: isLeakAlarm ? '#FFFBEB' : '#F8FAFC',
            border: `1px solid ${isLeakAlarm ? '#FDE68A' : '#E2E8F0'}`,
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: isLeakAlarm ? '#D97706' : '#334155' }}>
            Leak / Continuous Flow Alert
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono',
              color: isLeakAlarm ? '#D97706' : '#64748B',
            }}
          >
            {isLeakAlarm ? 'TRIGGERED (ON)' : 'OFF'}
          </span>
        </div>

        {/* Master System Alarm Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '8px',
            background: isSystemAlarm ? '#FFF1F2' : '#ECFDF5',
            border: `1px solid ${isSystemAlarm ? '#FECDD3' : '#A7F3D0'}`,
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 800, color: isSystemAlarm ? '#E11D48' : '#059669' }}>
            System Master Alarm (Buzzer & LED)
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono',
              color: isSystemAlarm ? '#E11D48' : '#059669',
            }}
          >
            {isSystemAlarm ? 'ACTIVE' : 'NOMINAL'}
          </span>
        </div>
      </div>
    </div>
  );
}
