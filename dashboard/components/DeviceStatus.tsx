'use client';

import { Cpu, MapPin, Database, Clock } from 'lucide-react';
import type { Device } from '@/types/water';

interface DeviceStatusProps {
  device: Device | null;
  loading?: boolean;
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function DeviceStatus({ device, loading = false }: DeviceStatusProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: '18px', width: `${60 + i * 10}%` }} />
        ))}
      </div>
    );
  }

  if (!device) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        No device registered
      </div>
    );
  }

  const isOnline = device.status === 'online';
  const isWarning = device.status === 'warning';
  const statusColor = isOnline ? '#059669' : isWarning ? '#D97706' : '#E11D48';
  const statusBg = isOnline ? '#ECFDF5' : isWarning ? '#FFFBEB' : '#FFF1F2';
  const statusBorder = isOnline ? '#A7F3D0' : isWarning ? '#FDE68A' : '#FECDD3';
  const statusLabel = device.status.toUpperCase();

  const rows = [
    { icon: Cpu, label: 'Device ID', value: device.device_id },
    { icon: MapPin, label: 'Location', value: device.location },
    { icon: Database, label: 'Capacity', value: `${device.tank_capacity.toLocaleString()} L` },
    { icon: Clock, label: 'Last seen', value: timeAgo(device.last_seen) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Status header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: '16px', color: '#0F172A' }}>
          {device.device_name}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 800,
            background: statusBg,
            color: statusColor,
            border: `1px solid ${statusBorder}`,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: statusColor,
              display: 'inline-block',
            }}
          />
          {statusLabel}
        </span>
      </div>

      {/* Info rows */}
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '75px', flexShrink: 0 }}>
            {label}
          </span>
          <span
            style={{
              fontSize: '13px',
              color: '#1E293B',
              fontWeight: 600,
              fontFamily: label === 'Device ID' ? 'JetBrains Mono' : 'inherit',
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
