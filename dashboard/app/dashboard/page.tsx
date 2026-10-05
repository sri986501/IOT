'use client';

import { useWaterTelemetry } from '@/hooks/useWaterTelemetry';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { AppShell } from '@/components/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedLiquidTank } from '@/components/ui/AnimatedLiquidTank';
import { FlowGaugeRadial } from '@/components/dashboard/FlowGaugeRadial';
import { ConsumptionChart } from '@/components/dashboard/ConsumptionChart';
import { ValveControlGrid } from '@/components/dashboard/ValveControlGrid';
import { HardwareDiagnostics } from '@/components/dashboard/HardwareDiagnostics';
import {
  Droplets,
  Gauge,
  Radio,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  useWaterTelemetry();

  const { telemetry, hardware, alerts, isPollingReading, pollReading } = useTelemetryStore();
  const activeAlerts = alerts.filter((a) => !a.resolved_at);

  return (
    <AppShell>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Critical Alert Bar if threshold breached */}
        <AnimatePresence>
          {activeAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderRadius: '12px',
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert size={20} style={{ color: '#E11D48' }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#9F1239' }}>
                    SAFETY ANOMALY: {activeAlerts[0].message}
                  </span>
                  <div style={{ fontSize: '11px', color: '#BE123C' }}>
                    Threshold exceeded · Automated safety interlocks ready
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', color: '#E11D48', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>
                {activeAlerts.length} Active Notice(s)
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4 Clean Modern Light KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
          
          {/* Card 1: Reservoir Fill Level */}
          <GlassCard padding="20px" accentColor="#0284C7" glow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Reservoir Level
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A', margin: '4px 0 2px' }}>
                  {telemetry.fillPercentage.toFixed(1)}%
                </div>
              </div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#F0F9FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284C7',
                }}
              >
                <Droplets size={20} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <ArrowUpRight size={14} style={{ color: '#059669' }} />
              <span style={{ color: '#059669', fontWeight: 700 }}>Nominal Band (25–90%)</span>
            </div>
          </GlassCard>

          {/* Card 2: Volume */}
          <GlassCard padding="20px" accentColor="#0EA5E9">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Available Fluid
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A', margin: '4px 0 2px' }}>
                  {Math.round(telemetry.volumeLitres).toLocaleString()}
                  <span style={{ fontSize: '15px', marginLeft: '4px', color: '#0284C7', fontWeight: 700 }}>L</span>
                </div>
              </div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#F0F9FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0EA5E9',
                }}
              >
                <Layers size={20} />
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              1,000 L Maximum Rated Capacity
            </div>
          </GlassCard>

          {/* Card 3: Flow Velocity */}
          <GlassCard padding="20px" accentColor="#059669">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Fluid Flow Rate
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A', margin: '4px 0 2px' }}>
                  {telemetry.flowRateLpm.toFixed(1)}
                  <span style={{ fontSize: '15px', marginLeft: '4px', color: '#059669', fontWeight: 700 }}>L/m</span>
                </div>
              </div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                }}
              >
                <Activity size={20} />
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
              KY-040 Pulse Synchronized
            </div>
          </GlassCard>

          {/* Card 4: Sensor Air Gap */}
          <GlassCard padding="20px" accentColor="#D97706">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  HC-SR04 Air Gap
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A', margin: '4px 0 2px' }}>
                  {telemetry.distanceCm.toFixed(1)}
                  <span style={{ fontSize: '15px', marginLeft: '4px', color: '#D97706', fontWeight: 700 }}>cm</span>
                </div>
              </div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#FFFBEB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                }}
              >
                <Radio size={20} />
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              Ping: {hardware.ultrasonicEchoLatencyMs}ms · Echo Pin: P18
            </div>
          </GlassCard>
        </div>

        {/* Row 1: Hero Stage (Tank 4 cols, Tachometer 4 cols, Actuators 4 cols) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '18px' }}>
          
          {/* Reservoir Vessel */}
          <div style={{ gridColumn: 'span 4' }}>
            <GlassCard accentColor="#0284C7" glow style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Droplets size={16} style={{ color: '#0284C7' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                    Reservoir Vessel
                  </span>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    background: telemetry.fillPercentage > 25 ? '#ECFDF5' : '#FFF1F2',
                    color: telemetry.fillPercentage > 25 ? '#059669' : '#E11D48',
                    border: `1px solid ${telemetry.fillPercentage > 25 ? '#A7F3D0' : '#FECDD3'}`,
                  }}
                >
                  {telemetry.fillPercentage > 25 ? 'OPTIMAL' : 'LOW LEVEL'}
                </span>
              </div>

              <AnimatedLiquidTank
                fillPercent={telemetry.fillPercentage}
                volumeLitres={telemetry.volumeLitres}
                capacity={1000}
                width={230}
                height={350}
              />
            </GlassCard>
          </div>

          {/* Radial Velocity Tachometer */}
          <div style={{ gridColumn: 'span 4' }}>
            <GlassCard accentColor="#0EA5E9" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gauge size={16} style={{ color: '#0EA5E9' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                    Flow Velocity Meter
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                  ROTARY
                </span>
              </div>

              <FlowGaugeRadial flowLpm={telemetry.flowRateLpm} maxLpm={30} />
            </GlassCard>
          </div>

          {/* Actuator & Valve Controls */}
          <div style={{ gridColumn: 'span 4' }}>
            <GlassCard accentColor="#059669" style={{ height: '100%' }}>
              <ValveControlGrid />
            </GlassCard>
          </div>
        </div>

        {/* Row 2: Hydrodynamics Chart */}
        <div>
          <GlassCard padding="24px">
            <ConsumptionChart />
          </GlassCard>
        </div>

        {/* Row 3: ESP32 Diagnostics & OLED Mirror */}
        <div>
          <GlassCard padding="24px">
            <HardwareDiagnostics />
          </GlassCard>
        </div>

      </div>
    </AppShell>
  );
}
