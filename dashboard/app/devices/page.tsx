'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Cpu } from 'lucide-react';
import { DeviceStatus } from '@/components/DeviceStatus';
import { fetchAllDevices, updateDevice } from '@/lib/api';
import { useRealtimeDeviceStatus } from '@/lib/realtime';
import { AppShell } from '@/components/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Device } from '@/types/water';
import { sound } from '@/lib/soundEffects';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Device>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    sound.playClick(900);
    setLoading(true);
    const data = await fetchAllDevices();
    setDevices(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useRealtimeDeviceStatus('ESP32-001', (updated) => {
    setDevices((prev) => prev.map((d) => (d.device_id === updated.device_id ? updated : d)));
  });

  const startEdit = (device: Device) => {
    sound.playClick(800);
    setEditing(device.device_id);
    setEditForm({
      device_name: device.device_name,
      location: device.location,
      tank_capacity: device.tank_capacity,
      tank_height: device.tank_height,
    });
  };

  const saveEdit = async (deviceId: string) => {
    setSaving(true);
    const ok = await updateDevice(deviceId, editForm);
    if (ok) {
      sound.playPing();
      setDevices((prev) => prev.map((d) => (d.device_id === deviceId ? ({ ...d, ...editForm } as Device) : d)));
      setEditing(null);
    }
    setSaving(false);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={20} style={{ color: '#0284C7' }} />
              <h1 style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
                Hardware Topology & Node Registry
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {devices.length} registered ESP32 telemetry nodes in network
            </p>
          </div>

          <button
            onClick={load}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '10px',
              background: '#0284C7',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
            }}
          >
            <RefreshCw size={14} /> REFRESH NODES
          </button>
        </div>

        {/* Node Cards */}
        {loading ? (
          <GlassCard padding="20px">
            <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />
          </GlassCard>
        ) : devices.length === 0 ? (
          <GlassCard style={{ padding: '60px', textAlign: 'center' }}>
            <Cpu size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: 'JetBrains Mono', lineHeight: 1.6 }}>
              No active nodes detected in hardware registry.<br />
              Node ESP32-001 is ready for automatic handshake on first telemetry packet.
            </p>
          </GlassCard>
        ) : (
          devices.map((device) => (
            <GlassCard key={device.id} padding="24px" accentColor="#0284C7">
              {editing === device.device_id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                    Configure Node Parameters — {device.device_id}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[
                      { label: 'Device Identifier Tag', key: 'device_name', type: 'text' },
                      { label: 'Physical Deployment Location', key: 'location', type: 'text' },
                      { label: 'Rated Tank Capacity (L)', key: 'tank_capacity', type: 'number' },
                      { label: 'Effective Tank Height (cm)', key: 'tank_height', type: 'number' },
                    ].map(({ label, key, type }) => (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          {label}
                        </label>
                        <input
                          type={type}
                          value={String((editForm as any)[key] ?? '')}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value,
                            }))
                          }
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            color: '#0F172A',
                            fontSize: '13px',
                            fontFamily: 'JetBrains Mono',
                            outline: 'none',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button
                      onClick={() => saveEdit(device.device_id)}
                      disabled={saving}
                      style={{
                        padding: '9px 22px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 800,
                        fontFamily: 'JetBrains Mono',
                        background: '#0284C7',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: saving ? 'wait' : 'pointer',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                      }}
                    >
                      {saving ? 'COMMITTING CONFIG...' : 'SAVE NODE CONFIG'}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'JetBrains Mono',
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                  <DeviceStatus device={device} />
                  <button
                    onClick={() => startEdit(device)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      fontFamily: 'JetBrains Mono',
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      color: '#0284C7',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    CONFIGURE NODE
                  </button>
                </div>
              )}
            </GlassCard>
          ))
        )}

      </div>
    </AppShell>
  );
}
