'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { AlertPanel } from '@/components/AlertPanel';
import { fetchAllAlerts } from '@/lib/api';
import { useRealtimeAlerts } from '@/lib/realtime';
import { AppShell } from '@/components/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Alert, AlertSeverity, TimeRange } from '@/types/water';
import { sound } from '@/lib/soundEffects';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<AlertSeverity | 'all' | 'active'>('all');
  const [range, setRange] = useState<TimeRange>('7d');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllAlerts('ESP32-001', range);
    setAlerts(data);
    setLoading(false);
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeAlerts('ESP32-001', (a) => {
    sound.playAlert();
    setAlerts((prev) => [a, ...prev]);
  });

  const handleResolved = (id: string) => {
    sound.playPing();
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved_at: new Date().toISOString() } : a))
    );
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'active') return !a.resolved_at;
    if (filter === 'all') return true;
    return a.severity === filter;
  });

  const counts = {
    all: alerts.length,
    active: alerts.filter((a) => !a.resolved_at).length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    notice: alerts.filter((a) => a.severity === 'notice').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  };

  const filterColors: Record<string, string> = {
    all: '#0284C7',
    active: '#E11D48',
    critical: '#E11D48',
    warning: '#D97706',
    notice: '#F59E0B',
    info: '#0EA5E9',
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} style={{ color: '#E11D48' }} />
              <h1 style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
                Safety & Alarm Log
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {counts.active > 0
                ? `${counts.active} active hardware anomaly / safety threshold notification(s)`
                : 'All reservoir perimeter telemetry operational within safety boundaries'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['24h', '3d', '7d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  sound.playClick(800);
                  setRange(r);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: 'JetBrains Mono',
                  border: `1px solid ${range === r ? '#0284C7' : '#E2E8F0'}`,
                  background: range === r ? '#0284C7' : '#FFFFFF',
                  color: range === r ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  boxShadow: range === r ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                }}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['all', 'active', 'critical', 'warning', 'notice', 'info'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                sound.playClick(750);
                setFilter(f);
              }}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 800,
                fontFamily: 'JetBrains Mono',
                border: `1px solid ${filter === f ? filterColors[f] : '#E2E8F0'}`,
                background: filter === f ? filterColors[f] : '#FFFFFF',
                color: filter === f ? '#FFFFFF' : '#64748B',
                cursor: 'pointer',
                boxShadow: filter === f ? `0 2px 8px ${filterColors[f]}35` : 'none',
              }}
            >
              {f.toUpperCase()}
              <span style={{ marginLeft: '6px', opacity: 0.9 }}>({counts[f] ?? 0})</span>
            </button>
          ))}
        </div>

        {/* Alert List Card */}
        <GlassCard padding="24px">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '10px' }} />
              ))}
            </div>
          ) : (
            <AlertPanel alerts={filtered} onResolved={handleResolved} maxVisible={filtered.length} />
          )}
        </GlassCard>

      </div>
    </AppShell>
  );
}
