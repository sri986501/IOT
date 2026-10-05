'use client';

import { motion } from 'framer-motion';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { sound } from '@/lib/soundEffects';

interface FlowGaugeRadialProps {
  flowLpm: number;
  maxLpm?: number;
}

export function FlowGaugeRadial({ flowLpm, maxLpm = 30 }: FlowGaugeRadialProps) {
  const store = useTelemetryStore();
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;

  const startAngle = -220;
  const sweepAngle = 240;
  const clampedFlow = Math.min(maxLpm, Math.max(0, flowLpm));
  const fillAngle = (clampedFlow / maxLpm) * sweepAngle;

  function polarToXY(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeArc(startDeg: number, endDeg: number, radius: number) {
    const s = polarToXY(startDeg, radius);
    const e = polarToXY(endDeg, radius);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const trackPath = describeArc(startAngle, startAngle + sweepAngle, r);
  const fillPath = describeArc(startAngle, startAngle + Math.max(0.1, fillAngle), r);
  const needleEnd = polarToXY(startAngle + fillAngle, r - 8);

  const flowColor =
    clampedFlow > 22
      ? '#E11D48'
      : clampedFlow > 14
      ? '#D97706'
      : '#0284C7';

  const ticks = [0, 5, 10, 15, 20, 25, 30];

  const handleAdjust = (delta: number) => {
    sound.playClick(delta > 0 ? 1100 : 700);
    store.adjustFlow(delta);
  };

  const handleReset = () => {
    sound.playPing();
    store.resetFlow();
  };

  const velocityMs = ((clampedFlow / 60) * 0.001) / (Math.PI * Math.pow(0.00635, 2));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
      {/* SVG Radial Speedometer */}
      <div style={{ position: 'relative' }}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id="light-flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#0284C7" />
              <stop offset="100%" stopColor={flowColor} />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <path
            d={trackPath}
            stroke="#E2E8F0"
            strokeWidth="11"
            fill="none"
            strokeLinecap="round"
          />

          {/* Surge Warning Track (>20 L/min) */}
          <path
            d={describeArc(startAngle + (20 / maxLpm) * sweepAngle, startAngle + sweepAngle, r)}
            stroke="#FFE4E6"
            strokeWidth="11"
            fill="none"
            strokeLinecap="round"
          />

          {/* Velocity Fill Arc */}
          <motion.path
            d={fillPath}
            stroke="url(#light-flow-grad)"
            strokeWidth="11"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />

          {/* Tick Markers */}
          {ticks.map((tick) => {
            const angle = startAngle + (tick / maxLpm) * sweepAngle;
            const outer = polarToXY(angle, r + 13);
            const inner = polarToXY(angle, r + 7);
            const label = polarToXY(angle, r + 24);
            return (
              <g key={tick}>
                <line
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={tick > 20 ? '#FDA4AF' : '#CBD5E1'}
                  strokeWidth="1.5"
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="#64748B"
                  fontFamily="JetBrains Mono"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Dynamic Needle */}
          <motion.line
            x1={cx}
            y1={cy}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={flowColor}
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ x2: needleEnd.x, y2: needleEnd.y }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          />

          {/* Center Hub */}
          <circle cx={cx} cy={cy} r="6" fill={flowColor} />
          <circle cx={cx} cy={cy} r="2.5" fill="#FFFFFF" />

          {/* Readout */}
          <text
            x={cx}
            y={cy + 24}
            textAnchor="middle"
            fontSize="24"
            fontWeight="900"
            fontFamily="Outfit, sans-serif"
            fill="#0F172A"
          >
            {clampedFlow.toFixed(1)}
          </text>
          <text
            x={cx}
            y={cy + 38}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#64748B"
            fontFamily="JetBrains Mono"
          >
            L / MIN
          </text>
        </svg>
      </div>

      {/* Pipe velocity readout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pipe Velocity:</span>
        <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#0F172A' }}>
          {velocityMs.toFixed(2)} m/s
        </span>
      </div>

      {/* Pure sensor rate info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 12px',
          borderRadius: '10px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
        }}
      >
        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
          Flow Calibration
        </span>
        <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#059669' }}>
          450 Pulses / L
        </span>
      </div>
    </div>
  );
}
