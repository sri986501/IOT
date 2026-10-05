'use client';

import { useState } from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { motion } from 'framer-motion';
import { Cpu, Radio, Monitor, ChevronRight } from 'lucide-react';
import { sound } from '@/lib/soundEffects';

const GPIO_PINS = [
  { pin: 5, label: 'TRIG', role: 'HC-SR04 Trigger Out', color: '#0284C7' },
  { pin: 18, label: 'ECHO', role: 'HC-SR04 Echo In (30ms limit)', color: '#0EA5E9' },
  { pin: 34, label: 'FLOW', role: 'JZ-S4-01 Flow Pulse (RISING)', color: '#10B981' },
  { pin: 27, label: 'LED', role: 'Alarm Warning Indicator', color: '#F59E0B' },
  { pin: 26, label: 'BUZZ', role: 'Siren Buzzer Annunciator', color: '#EF4444' },
];

export function HardwareDiagnostics() {
  const { hardware, telemetry } = useTelemetryStore();
  const [oledPage, setOledPage] = useState<0 | 1 | 2>(0);

  const echoFlightMicroseconds = Math.round((telemetry.distanceCm * 2) / 0.0343);

  const oledPages = [
    [
      `AquaSense SCADA`,
      `────────────────`,
      `LVL: ${telemetry.fillPercentage.toFixed(1)}%`,
      `VOL: ${Math.round(telemetry.volumeLitres)} L`,
      `FLW: ${telemetry.flowRateLpm.toFixed(1)} L/m`,
      `DST: ${telemetry.distanceCm.toFixed(1)} cm`,
      `────────────────`,
      `${hardware.esp32Connected ? '● ONLINE 2.4GHz' : '○ OFFLINE'}`,
    ],
    [
      `HC-SR04 SONAR`,
      `────────────────`,
      `PULSE: 10 µs TRIG`,
      `ECHO : ${echoFlightMicroseconds} µs`,
      `C_AIR: 343.2 m/s`,
      `RTT  : ${hardware.ultrasonicEchoLatencyMs} ms`,
      `────────────────`,
      `GAP  : ${telemetry.distanceCm.toFixed(1)} cm AIR`,
    ],
    [
      `ESP32 DevKit-C`,
      `────────────────`,
      `FREE : 246 KB`,
      `FLASH: 4MB QIO`,
      `UP   : ${Math.floor(hardware.uptimeSeconds / 60)}m ${Math.round(hardware.uptimeSeconds % 60)}s`,
      `RSSI : -54 dBm`,
      `────────────────`,
      `I2C  : 400 kHz OK`,
    ],
  ];

  const handleNextOled = () => {
    sound.playClick(1000);
    setOledPage(((oledPage + 1) % 3) as 0 | 1 | 2);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} style={{ color: '#0284C7' }} />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            ESP32 Microcontroller Diagnostics & Bus
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
          FIRMWARE v2.4.1 · DUAL-CORE XTENSA
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
        {/* Left: GPIO Signals (5 cols) */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
            Active Pin Matrix
          </div>
          {GPIO_PINS.map(({ pin, label, role, color }) => (
            <div
              key={pin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '7px 12px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: color,
                  width: '24px',
                  textAlign: 'center',
                  background: `${color}15`,
                  padding: '2px 4px',
                  borderRadius: '4px',
                }}
              >
                P{pin}
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0F172A',
                  width: '42px',
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}>
                {role}
              </span>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: pin === 18 ? 0.3 : 0 }}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: color,
                }}
              />
            </div>
          ))}
        </div>

        {/* Center: Sensor Bus Metrics (3 cols) */}
        <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
            Ultrasonic Telemetry Bus
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {[
              { label: 'Echo Flight (2x)', value: `${echoFlightMicroseconds} µs`, color: '#0284C7' },
              { label: 'Ping RTT Latency', value: `${hardware.ultrasonicEchoLatencyMs} ms`, color: '#059669' },
              { label: 'Sensor Air Gap', value: `${telemetry.distanceCm.toFixed(1)} cm`, color: '#0EA5E9' },
              {
                label: 'Hardware Uptime',
                value: `${Math.floor(hardware.uptimeSeconds / 60)}m ${Math.round(hardware.uptimeSeconds % 60)}s`,
                color: '#0F172A',
              },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', color: row.color, fontWeight: 700 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Radio size={18} style={{ color: '#059669' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#065F46' }}>
                WiFi RSSI: -54 dBm
              </div>
              <div style={{ fontSize: '10px', color: '#047857' }}>
                Signal: 96% Excellent
              </div>
            </div>
          </div>
        </div>

        {/* Right: OLED Screen Mirror (4 cols) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              SSD1306 OLED Mirror (128×64)
            </div>
            <button
              onClick={handleNextOled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                color: '#0284C7',
                fontSize: '10px',
                fontFamily: 'JetBrains Mono',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              PAGE {oledPage + 1}/3 <ChevronRight size={11} />
            </button>
          </div>

          <div
            onClick={handleNextOled}
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#0F172A',
              border: '2px solid #334155',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              lineHeight: '1.6',
              color: '#38BDF8',
              letterSpacing: '0.3px',
              cursor: 'pointer',
              minHeight: '160px',
            }}
            title="Click to cycle OLED page"
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
                paddingBottom: '4px',
                borderBottom: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Monitor size={10} style={{ color: '#94A3B8' }} />
                <span style={{ fontSize: '8px', color: '#94A3B8' }}>I2C 0x3C</span>
              </div>
              <span style={{ fontSize: '8px', color: '#94A3B8' }}>SSD1306</span>
            </div>

            {oledPages[oledPage].map((line, i) => (
              <div
                key={i}
                style={{
                  color:
                    i === 0
                      ? '#FFFFFF'
                      : i === 7
                      ? hardware.esp32Connected
                        ? '#34D399'
                        : '#F87171'
                      : '#38BDF8',
                  fontWeight: i === 0 ? 800 : 500,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
