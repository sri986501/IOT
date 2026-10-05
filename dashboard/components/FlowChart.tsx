'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { SensorReading, TimeRange } from '@/types/water';

interface FlowChartProps {
  readings: SensorReading[];
  range: TimeRange;
  height?: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      }}
    >
      <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', fontFamily: 'JetBrains Mono' }}>{label}</p>
      <p style={{ fontSize: '14px', color: '#059669', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
        {payload[0]?.value?.toFixed(1)} L/min
      </p>
    </div>
  );
};

export function FlowChart({ readings, range, height = 190 }: FlowChartProps) {
  const data = useMemo(
    () =>
      readings.map((r) => ({
        time: formatTime(r.created_at),
        flow: Math.round(r.flow_rate_lpm * 10) / 10,
      })),
    [readings]
  );

  const avgFlow = data.length
    ? data.reduce((s, d) => s + d.flow, 0) / data.length
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Fluid Flow Rate Profile
        </span>
        <span style={{ fontSize: '12px', color: '#059669', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
          Average: {avgFlow.toFixed(1)} L/min
        </span>
      </div>

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
            borderRadius: '10px',
            background: '#F8FAFC',
          }}
        >
          No flow data recorded
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="flow-light-gradient" x1="0" y1="0" x2="0" y2="1">
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
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="flow"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#flow-light-gradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#059669' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
