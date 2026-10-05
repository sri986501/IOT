'use client';

import { useState } from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { TactileToggle } from '@/components/ui/TactileToggle';
import { motion } from 'framer-motion';
import {
  Sliders,
  ShieldAlert,
  RotateCw,
  Waves,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '@/lib/soundEffects';

export function ValveControlGrid() {
  const store = useTelemetryStore();
  const { pumpOverride, solenoidOverride, emergencyShutdown } = store;
  const [uvActive, setUvActive] = useState(true);
  const [purging, setPurging] = useState(false);

  const handlePumpToggle = () => {
    sound.playRelay(!pumpOverride);
    store.togglePump();
  };

  const handleSolenoidToggle = () => {
    sound.playRelay(!solenoidOverride);
    store.toggleSolenoid();
  };

  const handlePurge = () => {
    sound.playAlert();
    setPurging(true);
    store.resetFlow();
    setTimeout(() => {
      setPurging(false);
      sound.playPing();
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'space-between' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={16} style={{ color: '#0284C7' }} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
            }}
          >
            Actuator & Relay Controls
          </span>
        </div>
        {emergencyShutdown ? (
          <span
            style={{
              fontSize: '10px',
              color: '#E11D48',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono',
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
            }}
          >
            LOCKED (E-STOP)
          </span>
        ) : (
          <span
            style={{
              fontSize: '11px',
              color: '#059669',
              fontWeight: 700,
              fontFamily: 'JetBrains Mono',
            }}
          >
            ● RELAY BUS READY
          </span>
        )}
      </div>

      {/* Grid of 4 Actuator Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Card 1: Submersible Pump */}
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: pumpOverride ? '#F0F9FF' : '#F8FAFC',
            border: `1px solid ${pumpOverride ? '#BAE6FD' : '#E2E8F0'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: pumpOverride ? '#0284C7' : '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: pumpOverride ? '#FFFFFF' : '#64748B',
                }}
              >
                <motion.div
                  animate={{ rotate: pumpOverride ? 360 : 0 }}
                  transition={{ duration: 1.5, repeat: pumpOverride ? Infinity : 0, ease: 'linear' }}
                >
                  <RotateCw size={16} />
                </motion.div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  Main Pump
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Submersible 24V DC
                </div>
              </div>
            </div>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: pumpOverride ? '#059669' : '#94A3B8',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: pumpOverride ? '#0284C7' : 'var(--text-muted)', fontWeight: 700 }}>
              {pumpOverride ? '48.2 W ACTIVE' : '0 W STANDBY'}
            </span>
            <TactileToggle
              checked={pumpOverride}
              onChange={handlePumpToggle}
              disabled={emergencyShutdown}
              size="md"
              color="#0284C7"
            />
          </div>
        </div>

        {/* Card 2: Inlet Solenoid */}
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: solenoidOverride ? '#F0F9FF' : '#F8FAFC',
            border: `1px solid ${solenoidOverride ? '#BAE6FD' : '#E2E8F0'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: solenoidOverride ? '#0EA5E9' : '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: solenoidOverride ? '#FFFFFF' : '#64748B',
                }}
              >
                <Waves size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  Inlet Valve
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Pneumatic NC Valve
                </div>
              </div>
            </div>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: solenoidOverride ? '#059669' : '#94A3B8',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: solenoidOverride ? '#0284C7' : 'var(--text-muted)', fontWeight: 700 }}>
              {solenoidOverride ? 'OPEN (FLOW)' : 'CLOSED (SEAL)'}
            </span>
            <TactileToggle
              checked={solenoidOverride}
              onChange={handleSolenoidToggle}
              disabled={emergencyShutdown}
              size="md"
              color="#0EA5E9"
            />
          </div>
        </div>

        {/* Card 3: UV Purifier */}
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: uvActive ? '#FAF5FF' : '#F8FAFC',
            border: `1px solid ${uvActive ? '#E9D5FF' : '#E2E8F0'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: uvActive ? '#9333EA' : '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: uvActive ? '#FFFFFF' : '#64748B',
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  UV Purifier
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  254nm LED Chamber
                </div>
              </div>
            </div>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: uvActive ? '#9333EA' : '#94A3B8',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: uvActive ? '#9333EA' : 'var(--text-muted)', fontWeight: 700 }}>
              {uvActive ? 'STERILIZING' : 'BYPASS OFF'}
            </span>
            <TactileToggle
              checked={uvActive}
              onChange={() => {
                sound.playRelay(!uvActive);
                setUvActive(!uvActive);
              }}
              disabled={emergencyShutdown}
              size="md"
              color="#9333EA"
            />
          </div>
        </div>

        {/* Card 4: Auto PID Balancing */}
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  Auto Loop
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  PID Closed-Loop
                </div>
              </div>
            </div>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#059669',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#065F46', fontWeight: 700 }}>
              TARGET: 75%
            </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#D1FAE5',
                fontSize: '10px',
                fontWeight: 800,
                color: '#065F46',
                fontFamily: 'JetBrains Mono',
              }}
            >
              ENGAGED
            </span>
          </div>
        </div>
      </div>

      {/* Safety Purge Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: '12px',
          background: '#FFF1F2',
          border: '1px solid #FECDD3',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={18} style={{ color: '#E11D48' }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#9F1239' }}>
              Safety Purge & Rapid Flush
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Emergency bypass pressure discharge valve
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePurge}
          disabled={purging}
          style={{
            padding: '7px 16px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono',
            background: '#E11D48',
            border: 'none',
            color: '#FFFFFF',
            cursor: purging ? 'wait' : 'pointer',
            boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)',
          }}
        >
          {purging ? 'PURGING...' : 'PURGE FLOW'}
        </motion.button>
      </div>
    </div>
  );
}
