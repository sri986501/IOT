'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { sound } from '@/lib/soundEffects';
import { useTelemetryStore } from '@/store/useTelemetryStore';

interface AnimatedLiquidTankProps {
  fillPercent: number; // 0–100
  volumeLitres: number;
  capacity?: number;
  width?: number;
  height?: number;
}

function getLevelColor(pct: number) {
  if (pct > 30) {
    return {
      main: '#0284C7',
      secondary: '#38BDF8',
      surface: '#0EA5E9',
      glow: 'rgba(14, 165, 233, 0.25)',
      status: 'NOMINAL',
    };
  }
  if (pct > 15) {
    return {
      main: '#D97706',
      secondary: '#FBBF24',
      surface: '#F59E0B',
      glow: 'rgba(217, 119, 6, 0.25)',
      status: 'LOW LEVEL',
    };
  }
  return {
    main: '#E11D48',
    secondary: '#FB7185',
    surface: '#F43F5E',
    glow: 'rgba(225, 29, 72, 0.25)',
    status: 'CRITICAL',
  };
}

export function AnimatedLiquidTank({
  fillPercent,
  volumeLitres,
  capacity = 1000,
  width = 240,
  height = 360,
}: AnimatedLiquidTankProps) {
  const store = useTelemetryStore();
  const clamped = Math.min(100, Math.max(0, fillPercent));
  const colors = getLevelColor(clamped);

  const pad = 24;
  const tw = width - pad * 2;
  const th = height - pad * 2 - 50;
  const tankX = pad;
  const tankY = pad + 10;

  const fillH = (clamped / 100) * th;
  const fillY = tankY + th - fillH;

  const waveW = tw * 2;
  const waveAmp = Math.max(2.5, Math.min(6, fillH * 0.05));
  const freq = tw / 1.6;

  function makeWave(phase: number) {
    const points: string[] = [];
    for (let x = 0; x <= waveW + 4; x += 4) {
      const y = waveAmp * Math.sin((x / freq) * Math.PI * 2 + phase);
      points.push(`${x},${y}`);
    }
    return `M 0,${waveAmp} L ${points.join(' L ')} L ${waveW},${th} L 0,${th} Z`;
  }

  const bubbles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * (tw - 20),
        delay: i * 0.6,
        size: 3 + Math.random() * 4,
        duration: 2.2 + Math.random() * 1.8,
      })),
    [tw]
  );

  const markers = [250, 500, 750, 1000];

  const handleSimulateFill = (targetDelta: number) => {
    sound.playClick(850);
    const newVol = Math.min(capacity, Math.max(0, volumeLitres + targetDelta));
    const newPct = (newVol / capacity) * 100;
    store.setTelemetry({
      volumeLitres: Math.round(newVol),
      fillPercentage: Math.round(newPct * 10) / 10,
      liquidLevelCm: Math.round((newPct / 100) * store.telemetry.tankHeightCm * 10) / 10,
      distanceCm: Math.round((1 - newPct / 100) * store.telemetry.tankHeightCm * 10) / 10,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
      {/* SVG Cylinder Tank */}
      <div style={{ position: 'relative' }}>
        <svg width={width} height={height - 50} viewBox={`0 0 ${width} ${height - 50}`}>
          <defs>
            <linearGradient id="light-tank-glass" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#F8FAFC" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#F0F9FF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="light-liquid-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.surface} stopOpacity="0.95" />
              <stop offset="50%" stopColor={colors.main} stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0.95" />
            </linearGradient>

            <clipPath id="light-tank-clip">
              <rect x={tankX} y={tankY} width={tw} height={th} rx="12" />
            </clipPath>
          </defs>

          {/* Top Inlet Cap */}
          <rect
            x={tankX + tw / 2 - 16}
            y={tankY - 10}
            width={32}
            height={12}
            rx="4"
            fill="#E2E8F0"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* Main Vessel Hull */}
          <rect
            x={tankX}
            y={tankY}
            width={tw}
            height={th}
            rx="12"
            fill="url(#light-tank-glass)"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* Level Markers */}
          {markers.map((vol) => {
            const my = tankY + th - (vol / capacity) * th;
            return (
              <g key={vol}>
                <line
                  x1={tankX + 2}
                  y1={my}
                  x2={tankX + 10}
                  y2={my}
                  stroke="#94A3B8"
                  strokeWidth="1"
                />
                <line
                  x1={tankX + tw - 10}
                  y1={my}
                  x2={tankX + tw - 2}
                  y2={my}
                  stroke="#94A3B8"
                  strokeWidth="1"
                />
                <text
                  x={tankX + tw + 6}
                  y={my + 3}
                  fontSize="8.5"
                  fontWeight="700"
                  fill="#64748B"
                  fontFamily="JetBrains Mono"
                >
                  {vol}L
                </text>
              </g>
            );
          })}

          {/* Liquid Fill */}
          <g clipPath="url(#light-tank-clip)">
            <motion.rect
              x={tankX}
              width={tw}
              animate={{ y: fillY + waveAmp, height: Math.max(0, fillH - waveAmp) }}
              transition={{ type: 'spring', stiffness: 70, damping: 18 }}
              fill="url(#light-liquid-grad)"
            />

            {/* Inflow stream */}
            {store.pumpOverride && (
              <motion.rect
                x={tankX + tw / 2 - 3}
                width={6}
                animate={{ y: [tankY, fillY], opacity: [0.9, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                fill="#38BDF8"
              />
            )}

            {/* Wave 1 */}
            {clamped > 1 && (
              <motion.g
                animate={{ y: fillY }}
                transition={{ type: 'spring', stiffness: 70, damping: 18 }}
              >
                <g className="wave-animate" style={{ transformOrigin: `${tankX}px 0px` }}>
                  <path
                    d={makeWave(0)}
                    fill={colors.surface}
                    opacity="0.9"
                    transform={`translate(${tankX}, 0)`}
                  />
                </g>
              </motion.g>
            )}

            {/* Wave 2 */}
            {clamped > 1 && (
              <motion.g
                animate={{ y: fillY }}
                transition={{ type: 'spring', stiffness: 70, damping: 18 }}
              >
                <g className="wave-animate-slow" style={{ transformOrigin: `${tankX}px 0px` }}>
                  <path
                    d={makeWave(Math.PI)}
                    fill={colors.secondary}
                    opacity="0.5"
                    transform={`translate(${tankX}, 3)`}
                  />
                </g>
              </motion.g>
            )}

            {/* Bubbles */}
            {clamped > 5 &&
              bubbles.map((b) => (
                <motion.circle
                  key={b.id}
                  cx={tankX + b.x}
                  r={b.size / 2}
                  fill="#FFFFFF"
                  opacity="0.6"
                  animate={{ cy: [fillY + fillH - 8, fillY + 6], opacity: [0.7, 0] }}
                  transition={{
                    duration: b.duration,
                    delay: b.delay,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              ))}
          </g>

          {/* Level Percentage Inside Tank */}
          <motion.text
            x={tankX + tw / 2}
            y={clamped > 30 ? fillY + fillH / 2 + 8 : fillY - 14}
            textAnchor="middle"
            fontSize="26"
            fontWeight="900"
            fontFamily="Outfit, sans-serif"
            fill={clamped > 30 ? '#FFFFFF' : '#0F172A'}
            animate={{ y: clamped > 30 ? fillY + fillH / 2 + 8 : fillY - 14 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          >
            {clamped.toFixed(0)}%
          </motion.text>
        </svg>
      </div>

      {/* Numerical Volume Readout */}
      <div style={{ textAlign: 'center' }}>
        <motion.div
          key={Math.round(volumeLitres)}
          initial={{ opacity: 0.7, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            fontSize: '34px',
            fontWeight: 900,
            fontFamily: 'Outfit, sans-serif',
            color: '#0F172A',
            lineHeight: 1,
          }}
        >
          {Math.round(volumeLitres).toLocaleString()}
          <span style={{ fontSize: '15px', fontWeight: 700, marginLeft: '6px', color: '#0284C7' }}>
            LITERS
          </span>
        </motion.div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>
          Calibrated Capacity: {capacity.toLocaleString()} L
        </div>
      </div>

      {/* Preset simulation buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
        <button
          onClick={() => handleSimulateFill(100)}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            color: '#0284C7',
            cursor: 'pointer',
          }}
          title="Simulate +100L Inflow"
        >
          +100L
        </button>
        <button
          onClick={() => handleSimulateFill(-100)}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono',
            background: '#FFF1F2',
            border: '1px solid #FECDD3',
            color: '#E11D48',
            cursor: 'pointer',
          }}
          title="Simulate -100L Outflow"
        >
          -100L
        </button>
        <button
          onClick={() => {
            sound.playClick(700);
            store.setTelemetry({
              volumeLitres: 500,
              fillPercentage: 50,
              liquidLevelCm: 50,
              distanceCm: 50,
            });
          }}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
          title="Set to 50% Baseline"
        >
          50% SET
        </button>
      </div>
    </div>
  );
}
