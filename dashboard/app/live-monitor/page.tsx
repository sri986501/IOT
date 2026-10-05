'use client';

import { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff, Pause, Play, Search, RefreshCw } from 'lucide-react';
import { WaterChart } from '@/components/WaterChart';
import { FlowChart } from '@/components/FlowChart';
import { fetchLatestReading, fetchReadings } from '@/lib/api';
import { useRealtimeReadings, useOfflineDetection } from '@/lib/realtime';
import { AppShell } from '@/components/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import type { SensorReading } from '@/types/water';
import { sound } from '@/lib/soundEffects';
import { useTelemetryStore } from '@/store/useTelemetryStore';

const MAX_LIVE_POINTS = 120;

export default function LiveMonitorPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isPollingReading, pollReading } = useTelemetryStore();

  useEffect(() => {
    (async () => {
      const [lat, reads] = await Promise.all([
        fetchLatestReading(),
        fetchReadings('ESP32-001', '24h', MAX_LIVE_POINTS),
      ]);
      setLatest(lat);
      setReadings(reads);
      setLoading(false);
    })();
  }, []);

  useRealtimeReadings('ESP32-001', (r) => {
    if (!isPaused) {
      setLatest(r);
      setIsOnline(true);
      setReadings((prev) => [...prev.slice(-(MAX_LIVE_POINTS - 1)), r]);
    }
  });

  useOfflineDetection(latest?.created_at ?? null, 30000, () => {
    setIsOnline(false);
  });

  const pct = latest?.water_level_percent ?? 74.6;
  const vol = latest?.water_volume_liters ?? 746;
  const flow = latest?.flow_rate_lpm ?? 8.4;
  const dist = latest?.distance_cm ?? 25.4;

  const handleManualFetch = async () => {
    sound.playPing();
    await pollReading();
    const [lat, reads] = await Promise.all([
      fetchLatestReading(),
      fetchReadings('ESP32-001', '24h', 30),
    ]);
    if (lat) setLatest(lat);
    if (reads.length) setReadings(reads);
  };

  const filteredPackets = readings.filter((r) =>
    searchTerm ? new Date(r.created_at).toLocaleTimeString().includes(searchTerm) : true
  );

  return (
    <AppShell>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} style={{ color: '#0284C7' }} />
              <h1 style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
                Live Sensor Telemetry Stream
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time ESP32 ultrasonic and rotary flow packet broadcast
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleManualFetch}
              disabled={isPollingReading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'JetBrains Mono',
                background: '#0284C7',
                border: 'none',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                cursor: isPollingReading ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={13} className={isPollingReading ? 'animate-spin' : ''} />
              <span>{isPollingReading ? 'FETCHING...' : 'GET READING NOW'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick(isPaused ? 900 : 600);
                setIsPaused(!isPaused);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'JetBrains Mono',
                background: isPaused ? '#FFFBEB' : '#F8FAFC',
                border: `1px solid ${isPaused ? '#FCD34D' : '#E2E8F0'}`,
                color: isPaused ? '#D97706' : '#334155',
                cursor: 'pointer',
              }}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
              {isPaused ? 'RESUME STREAM' : 'PAUSE STREAM'}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: isOnline ? '#ECFDF5' : '#FFF1F2',
                border: `1px solid ${isOnline ? '#A7F3D0' : '#FECDD3'}`,
                fontSize: '12px',
                fontWeight: 700,
                color: isOnline ? '#065F46' : '#9F1239',
              }}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOnline ? 'STREAMING ACTIVE' : 'OFFLINE TIMEOUT'}
            </div>
          </div>
        </div>

        {/* Live Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Current Level', value: `${pct.toFixed(1)}%`, color: '#0284C7' },
            { label: 'Available Fluid', value: `${Math.round(vol).toLocaleString()} L`, color: '#0EA5E9' },
            { label: 'Flow Velocity', value: `${flow.toFixed(1)} L/m`, color: '#059669' },
            { label: 'Sonar Air Gap', value: `${dist.toFixed(1)} cm`, color: '#D97706' },
          ].map((item) => (
            <GlassCard key={item.label} padding="20px" accentColor={item.color}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 800 }}>
                {item.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A', margin: '4px 0 0' }}>
                {loading ? '—' : item.value}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Level and Depth Chart */}
        <GlassCard padding="24px">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Activity size={16} style={{ color: '#0284C7' }} />
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
              Real-Time Liquid Depth & Volume Ingestion Wave
            </h2>
          </div>
          <WaterChart readings={readings} range="24h" height={280} showVolume />
        </GlassCard>

        {/* Flow Rate Chart */}
        <GlassCard padding="24px">
          <FlowChart readings={readings} range="24h" height={190} />
        </GlassCard>

        {/* Live Packet Table */}
        <GlassCard padding="0" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 22px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
              Packet Telemetry Buffer ({filteredPackets.length} Ingested)
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter timestamp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  color: '#0F172A',
                  fontFamily: 'JetBrains Mono',
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '380px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 5 }}>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  {['Packet Timestamp', 'Fill Level', 'Net Volume', 'Flow Velocity', 'Air Gap Distance', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 20px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontWeight: 800,
                        fontSize: '11px',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filteredPackets].reverse().slice(0, 25).map((r, i) => (
                  <tr
                    key={r.id || i}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                    }}
                  >
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
                      {new Date(r.created_at).toLocaleTimeString('en-IN', { hour12: false })}
                    </td>
                    <td style={{ padding: '12px 20px', color: '#0284C7', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>
                      {r.water_level_percent.toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px 20px', color: '#334155', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                      {Math.round(r.water_volume_liters).toLocaleString()} L
                    </td>
                    <td style={{ padding: '12px 20px', color: '#059669', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                      {r.flow_rate_lpm.toFixed(1)} L/m
                    </td>
                    <td style={{ padding: '12px 20px', color: '#D97706', fontFamily: 'JetBrains Mono' }}>
                      {r.distance_cm.toFixed(1)} cm
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: '#ECFDF5',
                          color: '#065F46',
                          fontFamily: 'JetBrains Mono',
                        }}
                      >
                        INGESTED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

      </div>
    </AppShell>
  );
}
