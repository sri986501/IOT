'use client';

import { Info, AlertTriangle, Database, Wifi, Settings } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';

export default function SettingsPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} style={{ color: '#0284C7' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
              SCADA Parameters & Safety Policies
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Telemetry cutoff limits, automated safety thresholds, and 7-day rolling data retention
          </p>
        </div>

        {/* Safety & Emergency Threshold Triggers */}
        <GlassCard padding="24px" accentColor="#D97706">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} style={{ color: '#D97706' }} />
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
              Perimeter Safety & Cutoff Thresholds
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'CRITICAL LOW TANK CUTOFF', threshold: 'Reservoir Fill < 10.0%', color: '#E11D48', desc: 'Auto-shuts primary pump to prevent dry-run cavitation' },
              { label: 'WARNING LOW WATER ALERT', threshold: 'Reservoir Fill < 20.0%', color: '#D97706', desc: 'Emits visual alert in dashboard and sounds warning chime' },
              { label: 'HIGH OVERFLOW PROTECTION', threshold: 'Reservoir Fill > 95.0%', color: '#F59E0B', desc: 'Closes inlet solenoid valve to prevent basin breach' },
              { label: 'HIGH VELOCITY SURGE ALERT', threshold: 'Flow Rate > 20.0 L/min', color: '#D97706', desc: 'Flags pipe burst or abnormal line pressure loss' },
              { label: 'NODE OFFLINE HEARTBEAT TIMEOUT', threshold: 'No sensor ping > 30 sec', color: '#0284C7', desc: 'Flags hardware bus loss / network disconnection' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: '12px', color: item.color, fontFamily: 'JetBrains Mono', fontWeight: 800 }}>
                  {item.threshold}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Data Retention */}
        <GlassCard padding="24px" accentColor="#0284C7">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Database size={18} style={{ color: '#0284C7' }} />
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
              Data Storage Retention Schedule
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Sensor Ingestion Table', retention: '7-Day Rolling Buffer', action: 'Daily cron prune at 02:00 UTC' },
              { label: 'Incident & Alert Archive', retention: '7-Day Rolling Buffer', action: 'Daily cron prune at 02:00 UTC' },
              { label: 'Device & Topology Registry', retention: 'Permanent Storage', action: 'Never auto-deleted' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr 1fr',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>{item.label}</span>
                <span style={{ fontSize: '12px', color: '#0284C7', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>{item.retention}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.action}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Hardware Protocol & Architecture */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          <GlassCard padding="20px" accentColor="#059669">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Wifi size={16} style={{ color: '#059669' }} />
              <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                Hardware Bus Protocol
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {[
                { label: 'Endpoint', value: 'POST /rest/v1/sensor_readings' },
                { label: 'Direct Polling API', value: 'GET /api/readings' },
                { label: 'Telemetry Broadcast', value: '10s Periodic (10,000ms)' },
                { label: 'Heartbeat Ping', value: '60s Frequency' },
                { label: 'Encryption', value: 'TLS 1.3 / Bearer JWT' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ color: '#059669', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard padding="20px" accentColor="#0EA5E9">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Info size={16} style={{ color: '#0EA5E9' }} />
              <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                Platform Stack & Engine
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {[
                { label: 'UI Architecture', value: 'Next.js 16 + React 19' },
                { label: 'Design Theme', value: 'Clean Modern Aqua Light' },
                { label: 'State & Realtime', value: 'Zustand 5.0 + WebSockets' },
                { label: 'Microcontroller', value: 'ESP32 DevKit-C + HC-SR04' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ color: '#0284C7', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

      </div>
    </AppShell>
  );
}
