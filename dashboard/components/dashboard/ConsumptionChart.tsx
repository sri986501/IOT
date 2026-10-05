'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { Activity, TrendingUp } from 'lucide-react';
import { sound } from '@/lib/soundEffects';

type TimeRange = 'LIVE' | '1H' | '6H' | '24H';
type MetricFilter = 'ALL' | 'VOLUME' | 'FLOW';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      }}
    >
      <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px', fontFamily: 'JetBrains Mono' }}>
        Timestamp: {label}
      </p>
      {payload.map((entry: any) => (
        <div
          key={entry.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
            <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>{entry.name}:</span>
          </div>
          <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
            {entry.value} {entry.name.includes('Volume') ? 'L' : 'L/min'}
          </span>
        </div>
      ))}
    </div>
  );
};

export function ConsumptionChart() {
  const history = useTelemetryStore((s) => s.history);
  const [timeRange, setTimeRange] = useState<TimeRange>('LIVE');
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('ALL');

  const filteredData = useMemo(() => {
    if (!history || history.length === 0) return [];
    if (timeRange === 'LIVE') return history.slice(-25);
    if (timeRange === '1H') return history.slice(-60);
    if (timeRange === '6H') return history.slice(-120);
    return history;
  }, [history, timeRange]);

  const ranges: TimeRange[] = ['LIVE', '1H', '6H', '24H'];

  const peakFlow = useMemo(() => {
    if (!filteredData.length) return 8.5;
    return Math.max(...filteredData.map((d) => d.flowRate || 0));
  }, [filteredData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={17} style={{ color: '#0284C7' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
              Hydrodynamics Telemetry Curve
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '6px',
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono',
              color: '#0284C7',
              fontWeight: 700,
            }}
          >
            <TrendingUp size={12} />
            <span>Peak Flow: {peakFlow.toFixed(1)} L/m</span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Series filter */}
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
            }}
          >
            {(['ALL', 'VOLUME', 'FLOW'] as MetricFilter[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  sound.playClick(900);
                  setMetricFilter(m);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono',
                  border: 'none',
                  background: metricFilter === m ? '#FFFFFF' : 'transparent',
                  color: metricFilter === m ? '#0F172A' : '#64748B',
                  boxShadow: metricFilter === m ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Time range */}
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
            }}
          >
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => {
                  sound.playClick(800);
                  setTimeRange(r);
                }}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono',
                  border: 'none',
                  background: timeRange === r ? '#0284C7' : 'transparent',
                  color: timeRange === r ? '#FFFFFF' : '#64748B',
                  boxShadow: timeRange === r ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ flex: 1, minHeight: '270px', width: '100%' }}>
        {filteredData.length === 0 ? (
          <div
            style={{
              height: '270px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              border: '1px dashed #CBD5E1',
              borderRadius: '12px',
              fontFamily: 'JetBrains Mono',
            }}
          >
            Awaiting packet telemetry stream...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="vol-light-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="flow-light-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis
                yAxisId="vol"
                domain={[0, 1000]}
                tick={{ fill: '#0284C7', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}L`}
                hide={metricFilter === 'FLOW'}
              />
              <YAxis
                yAxisId="flow"
                orientation="right"
                domain={[0, 30]}
                tick={{ fill: '#059669', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}L/m`}
                hide={metricFilter === 'VOLUME'}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: '11px',
                  color: '#475569',
                  paddingTop: '8px',
                  fontFamily: 'JetBrains Mono',
                }}
              />
              {(metricFilter === 'ALL' || metricFilter === 'VOLUME') && (
                <Area
                  yAxisId="vol"
                  type="monotone"
                  dataKey="volume"
                  name="Water Volume"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#vol-light-grad)"
                />
              )}
              {(metricFilter === 'ALL' || metricFilter === 'FLOW') && (
                <Area
                  yAxisId="flow"
                  type="monotone"
                  dataKey="flowRate"
                  name="Fluid Flow Rate"
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  fillOpacity={1}
                  fill="url(#flow-light-grad)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
