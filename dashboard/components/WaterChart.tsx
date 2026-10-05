'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { SensorReading, TimeRange } from '@/types/water';

interface WaterChartProps {
  readings: SensorReading[];
  range: TimeRange;
  onRangeChange?: (r: TimeRange) => void;
  height?: number;
  showVolume?: boolean;
}

function formatTime(iso: string, range: TimeRange): string {
  const d = new Date(iso);
  if (range === '24h') {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      }}
    >
      <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px', fontFamily: 'JetBrains Mono' }}>
        {label}
      </p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700, margin: '2px 0' }}>
          <span style={{ color: entry.color, marginRight: '6px' }}>●</span>
          {entry.name}: <span style={{ fontFamily: 'JetBrains Mono' }}>{entry.value?.toFixed(1)}{entry.name === 'Level' ? '%' : ' L'}</span>
        </p>
      ))}
    </div>
  );
};

export function WaterChart({
  readings,
  range,
  onRangeChange,
  height = 260,
  showVolume = false,
}: WaterChartProps) {
  const data = useMemo(
    () =>
      readings.map((r) => ({
        time: formatTime(r.created_at, range),
        level: Math.round(r.water_level_percent * 10) / 10,
        volume: Math.round(r.water_volume_liters),
      })),
    [readings, range]
  );

  const ranges: TimeRange[] = ['24h', '3d', '7d'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Range selector */}
      {onRangeChange && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              style={{
                padding: '5px 14px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                border: `1px solid ${range === r ? '#0284C7' : '#E2E8F0'}`,
                background: range === r ? '#0284C7' : '#FFFFFF',
                color: range === r ? '#FFFFFF' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {r === '24h' ? 'Last 24 Hours' : r === '3d' ? 'Last 3 Days' : 'Last 7 Days'}
            </button>
          ))}
        </div>
      )}

      {readings.length === 0 ? (
        <div
          style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
            border: '1px dashed #CBD5E1',
            borderRadius: '12px',
            background: '#F8FAFC',
          }}
        >
          No telemetry recorded for this timeframe
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 6, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="level"
              domain={[0, 100]}
              tick={{ fill: '#0284C7', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            {showVolume && (
              <YAxis
                yAxisId="volume"
                orientation="right"
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}L`}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine yAxisId="level" y={20} stroke="#FDA4AF" strokeDasharray="4 4" label={{ value: 'Low Threshold', fill: '#E11D48', fontSize: 10 }} />
            <ReferenceLine yAxisId="level" y={80} stroke="#A7F3D0" strokeDasharray="4 4" />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#475569', paddingTop: '8px', fontFamily: 'JetBrains Mono' }}
            />
            <Line
              yAxisId="level"
              type="monotone"
              dataKey="level"
              name="Level (%)"
              stroke="#0284C7"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#0284C7' }}
            />
            {showVolume && (
              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="volume"
                name="Volume (L)"
                stroke="#0EA5E9"
                strokeWidth={1.8}
                dot={false}
                strokeDasharray="4 2"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
