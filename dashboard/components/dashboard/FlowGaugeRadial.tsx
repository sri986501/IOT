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

      {/* Step adjustments */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 10px',
          borderRadius: '10px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
        }}
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAdjust(-1.0)}
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            color: '#0284C7',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono',
          }}
          title="-1.0 L/min"
        >
          -1.0
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAdjust(-0.5)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            color: '#0284C7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="-0.5 L/min"
        >
          <Minus size={13} />
        </motion.button>

        <span
          style={{
            fontSize: '11px',
            color: store.flowAdjustment !== 0 ? '#0284C7' : 'var(--text-muted)',
            width: '68px',
            textAlign: 'center',
            fontFamily: 'JetBrains Mono',
            fontWeight: 800,
          }}
        >
          {store.flowAdjustment > 0 ? '+' : ''}
          {store.flowAdjustment.toFixed(1)} L/m
        </span>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAdjust(0.5)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            color: '#0284C7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="+0.5 L/min"
        >
          <Plus size={13} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAdjust(1.0)}
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            color: '#0284C7',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono',
          }}
          title="+1.0 L/min"
        >
          +1.0
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleReset}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#FFF1F2',
            border: '1px solid #FECDD3',
            color: '#E11D48',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Reset Flow Trim"
        >
          <RotateCcw size={12} />
        </motion.button>
      </div>
    </div>
  );
}
