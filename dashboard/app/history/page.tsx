'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { fetchReadingsPaginated } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import type { SensorReading } from '@/types/water';
import { sound } from '@/lib/soundEffects';

const PAGE_SIZE = 50;

export default function HistoryPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const { readings: r, total: t } = await fetchReadingsPaginated('ESP32-001', p, PAGE_SIZE);
    setReadings(r);
    setTotal(t);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportCsv = () => {
    sound.playPing();
    const headers = ['Timestamp', 'Level %', 'Volume (L)', 'Flow (L/min)', 'Distance (cm)'];
    const rows = readings.map((r) => [
      new Date(r.created_at).toISOString(),
      r.water_level_percent.toFixed(2),
      r.water_volume_liters.toFixed(2),
      r.flow_rate_lpm.toFixed(2),
      r.distance_cm.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquasense-history-p${page + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} style={{ color: '#0284C7' }} />
              <h1 style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
                Historical Telemetry Archive
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {total.toLocaleString()} total sensor packets recorded in the rolling storage buffer
            </p>
          </div>

          <button
            onClick={exportCsv}
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
            <Download size={14} /> EXPORT CSV DATA
          </button>
        </div>

        {/* Data Table Card */}
        <GlassCard padding="0" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['#', 'ISO Timestamp', 'Fill Level %', 'Net Volume (L)', 'Flow Velocity (L/min)', 'Distance (cm)'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '14px 20px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontWeight: 800,
                        borderBottom: '1px solid #E2E8F0',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} style={{ padding: '14px 20px' }}>
                          <div className="skeleton" style={{ height: '14px', width: '70%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : readings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                      No records found in current archive segment
                    </td>
                  </tr>
                ) : (
                  readings.map((r, i) => (
                    <tr
                      key={r.id || i}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                      }}
                    >
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>
                        {page * PAGE_SIZE + i + 1}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#475569', fontFamily: 'JetBrains Mono', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(r.created_at).toLocaleString('en-IN', { hour12: false })}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#0284C7', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>
                        {r.water_level_percent.toFixed(1)}%
                      </td>
                      <td style={{ padding: '12px 20px', color: '#0F172A', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                        {Math.round(r.water_volume_liters).toLocaleString()} L
                      </td>
                      <td style={{ padding: '12px 20px', color: '#059669', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                        {r.flow_rate_lpm.toFixed(1)}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#D97706', fontFamily: 'JetBrains Mono' }}>
                        {r.distance_cm.toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 22px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                Page {page + 1} of {totalPages} · {total.toLocaleString()} total entries
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    sound.playClick(750);
                    setPage((p) => Math.max(0, p - 1));
                  }}
                  disabled={page === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: page === 0 ? 'var(--text-muted)' : '#0284C7',
                    cursor: page === 0 ? 'default' : 'pointer',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                    fontWeight: 700,
                    opacity: page === 0 ? 0.4 : 1,
                  }}
                >
                  <ChevronLeft size={14} /> PREV
                </button>
                <button
                  onClick={() => {
                    sound.playClick(850);
                    setPage((p) => Math.min(totalPages - 1, p + 1));
                  }}
                  disabled={page >= totalPages - 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: page >= totalPages - 1 ? 'var(--text-muted)' : '#0284C7',
                    cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                    fontWeight: 700,
                    opacity: page >= totalPages - 1 ? 0.4 : 1,
                  }}
                >
                  NEXT <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </GlassCard>

      </div>
    </AppShell>
  );
}
