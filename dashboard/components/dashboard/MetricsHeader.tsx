'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  Server,
  RefreshCw,
} from 'lucide-react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { sound } from '@/lib/soundEffects';

export function MetricsHeader() {
  const store = useTelemetryStore();
  const { hardware, telemetry, isMockMode, emergencyShutdown, isPollingReading } = store;
  const [time, setTime] = useState('');
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isOnline = hardware.esp32Connected;

  const toggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
    if (!next) sound.playClick(900);
  };

  const handleGetReading = async () => {
    sound.playPing();
    await store.pollReading();
  };

  const handleEstop = () => {
    if (emergencyShutdown) {
      sound.playPing();
      store.clearEmergencyShutdown();
    } else {
      sound.playAlert();
      store.triggerEmergencyShutdown();
    }
  };

  const healthScore = isOnline
    ? telemetry.systemHealth === 'optimal'
      ? 98.6
      : telemetry.systemHealth === 'warning'
      ? 74.2
      : 32.0
    : 0;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 28px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Left: Active Telemetry Node & Health Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Node chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
          }}
        >
          <Server size={14} style={{ color: '#0284C7' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            NODE:
          </span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', fontFamily: 'JetBrains Mono' }}>
            ESP32-001 (Basin Alpha)
          </span>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isOnline ? '#059669' : '#E11D48',
            }}
          />
        </div>

        {/* Health Score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '10px',
            background: healthScore > 80 ? '#ECFDF5' : '#FFF1F2',
            border: `1px solid ${healthScore > 80 ? '#A7F3D0' : '#FECDD3'}`,
          }}
        >
          <Activity size={14} style={{ color: healthScore > 80 ? '#059669' : '#E11D48' }} />
          <span style={{ fontSize: '11px', color: healthScore > 80 ? '#065F46' : '#9F1239', fontWeight: 700 }}>
            HEALTH:
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono',
              color: healthScore > 80 ? '#059669' : '#E11D48',
            }}
          >
            {healthScore.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Center: Emergency Banner */}
      <AnimatePresence>
        {emergencyShutdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 18px',
              borderRadius: '20px',
              background: '#FFF1F2',
              border: '1px solid #FDA4AF',
              color: '#E11D48',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            <AlertTriangle size={15} />
            <span>EMERGENCY SHUTDOWN TRIPPED</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Controls: Get Reading Button, Ping, Sound, E-Stop, Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        
        {/* Instant GET READING Action Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleGetReading}
          disabled={isPollingReading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono',
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.28)',
            cursor: isPollingReading ? 'wait' : 'pointer',
          }}
          title="Instantly poll sensor reading from ESP32 & Supabase"
        >
          <RefreshCw size={13} className={isPollingReading ? 'animate-spin' : ''} />
          <span>{isPollingReading ? 'POLLING...' : 'GET READING'}</span>
        </motion.button>

        {/* Bus Ping Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ color: '#059669', fontWeight: 800 }}>
            {hardware.ultrasonicEchoLatencyMs}ms
          </span>
          <span>ping</span>
        </div>

        {/* Audio Mute */}
        <button
          onClick={toggleSound}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            color: isMuted ? 'var(--text-muted)' : '#0284C7',
            cursor: 'pointer',
          }}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* E-Stop Emergency Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEstop}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono',
            background: emergencyShutdown ? '#ECFDF5' : '#FFF1F2',
            border: `1px solid ${emergencyShutdown ? '#A7F3D0' : '#FECDD3'}`,
            color: emergencyShutdown ? '#059669' : '#E11D48',
            cursor: 'pointer',
          }}
        >
          <Zap size={14} />
          {emergencyShutdown ? 'RESET E-STOP' : 'E-STOP'}
        </motion.button>

        {/* Digital Clock with Hydration Safety */}
        <div
          suppressHydrationWarning
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            padding: '6px 10px',
            borderRadius: '8px',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
          }}
        >
          {mounted ? time : '--:--:--'}
        </div>
      </div>
    </header>
  );
}
