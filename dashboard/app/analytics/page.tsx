'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { WaterChart } from '@/components/WaterChart';
import { FlowChart } from '@/components/FlowChart';
import { fetchReadings, computeAnalytics } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import type { SensorReading, TimeRange } from '@/types/water';
import { sound } from '@/lib/soundEffects';

export default function AnalyticsPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [range, setRange] = useState<TimeRange>('24h');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: TimeRange) => {
    setLoading(true);
    const data = await fetchReadings('ESP32-001', r, 1000);
    setReadings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const stats = computeAnalytics(readings);

  const todayReadings = readings.filter((r) => {
    const h = (Date.now() - new Date(r.created_at).getTime()) / 3600000;
    return h <= 24;
  });
  const yesterdayReadings = readings.filter((r) => {
    const h = (Date.now() - new Date(r.created_at).getTime()) / 3600000;
    return h > 24 && h <= 48;
  });

  const todayStats = computeAnalytics(todayReadings);
  const yesterdayStats = computeAnalytics(yesterdayReadings);
  const allStats = computeAnalytics(readings);

  const summaryRows = [
    { label: 'Current 24h Window', value: `${todayStats.avgLevel.toFixed(1)}%`, usage: `${todayStats.estimatedUsageLiters.toLocaleString()} L` },
    { label: 'Previous 24h Period', value: `${yesterdayStats.avgLevel.toFixed(1)}%`, usage: `${yesterdayStats.estimatedUsageLiters.toLocaleString()} L` },
    { label: '7-Day Rolling Baseline', value: `${allStats.avgLevel.toFixed(1)}%`, usage: `${Math.round(allStats.estimatedUsageLiters / 7).toLocaleString()} L/day` },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} style={{ color: '#0284C7' }} />
              <h1 style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
                Consumption & Trend Analytics
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Statistical metrics, historical usage aggregates, and hydraulic profile
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '4px',
              borderRadius: '8px',
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
            }}
          >
            {(['24h', '3d', '7d', 'all'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  sound.playClick(850);
                  setRange(r);
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: 'JetBrains Mono',
                  border: 'none',
                  background: range === r ? '#0284C7' : 'transparent',
                  color: range === r ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  boxShadow: range === r ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none',
                }}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
          {[
            { title: 'Rolling Average Capacity', value: `${stats.avgLevel.toFixed(1)}%`, color: '#0284C7', sub: 'Baseline Tank Retention' },
            { title: 'Peak Hydraulic Capacity', value: `${stats.maxLevel.toFixed(1)}%`, color: '#059669', sub: 'Highest Inflow Crest' },
            { title: 'Lowest Drawdown Level', value: `${stats.minLevel.toFixed(1)}%`, color: stats.minLevel < 20 ? '#E11D48' : '#D97706', sub: 'Minimum Basin Volume' },
          ].map((s) => (
            <GlassCard key={s.title} accentColor={s.color} padding="24px" glow>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                {s.title}
              </div>
              <div style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
                {loading ? '—' : s.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>
                {s.sub}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Main Chart */}
        <GlassCard padding="24px">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} style={{ color: '#0284C7' }} />
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
              Multi-Day Reservoir Volume Profile
            </h2>
          </div>
          <WaterChart readings={readings} range={range} onRangeChange={(r) => setRange(r)} height={290} showVolume />
        </GlassCard>

        {/* Flow Profile */}
        <GlassCard padding="24px">
          <FlowChart readings={readings} range={range} height={200} />
        </GlassCard>

        {/* Comparative Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          <GlassCard padding="24px">
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: '16px' }}>
              Average Retention Balance
            </h3>
            {summaryRows.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: i < summaryRows.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}
              >
                <span style={{ fontSize: '13px', color: '#334155' }}>{row.label}</span>
                <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#0284C7' }}>
                  {loading ? '—' : row.value}
                </span>
              </div>
            ))}
          </GlassCard>

          <GlassCard padding="24px">
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: '16px' }}>
              Integrated Volumetric Usage
            </h3>
            {summaryRows.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: i < summaryRows.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}
              >
                <span style={{ fontSize: '13px', color: '#334155' }}>{row.label}</span>
                <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#059669' }}>
                  {loading ? '—' : row.usage}
                </span>
              </div>
            ))}
          </GlassCard>
        </div>

      </div>
    </AppShell>
  );
}
