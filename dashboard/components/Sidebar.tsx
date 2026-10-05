'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  History,
  Bell,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Droplets,
  RotateCw,
  Radio,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { sound } from '@/lib/soundEffects';

interface NavItemConfig {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string | number;
  badgeColor?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const store = useTelemetryStore();
  const activeAlertCount = store.alerts.filter((a) => !a.resolved_at).length;
  const isOnline = store.hardware.esp32Connected;

  const NAV_PRIMARY: NavItemConfig[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/live-monitor', icon: Activity, label: 'Live Telemetry' },
    { href: '/analytics', icon: BarChart3, label: 'Hydro Analytics' },
    { href: '/history', icon: History, label: 'Sensor Archive' },
    {
      href: '/alerts',
      icon: Bell,
      label: 'Safety Alerts',
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
      badgeColor: '#E11D48',
    },
  ];

  const NAV_SYSTEM: NavItemConfig[] = [
    { href: '/devices', icon: Cpu, label: 'Node Topology' },
    { href: '/settings', icon: Settings, label: 'Perimeter Safety' },
  ];

  const handleNavClick = () => {
    sound.playClick(900);
  };

  const renderNavGroup = (items: NavItemConfig[], title?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {title && !collapsed && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.8px',
            padding: '8px 12px 4px',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
      )}
      {items.map(({ href, icon: Icon, label, badge, badgeColor }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={handleNavClick}
            style={{ textDecoration: 'none' }}
          >
            <motion.div
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '11px 0' : '10px 14px',
                borderRadius: '12px',
                background: active
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.1), rgba(14, 165, 233, 0.05))'
                  : 'transparent',
                border: `1px solid ${active ? 'rgba(2, 132, 199, 0.25)' : 'transparent'}`,
                color: active ? '#0284C7' : 'var(--text-secondary)',
                boxShadow: active ? '0 2px 8px rgba(2, 132, 199, 0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              title={collapsed ? label : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon
                  size={19}
                  style={{
                    color: active ? '#0284C7' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />
                {!collapsed && (
                  <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500 }}>
                    {label}
                  </span>
                )}
              </div>

              {!collapsed && badge !== undefined && (
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    background: badgeColor || '#0284C7',
                    color: '#fff',
                  }}
                >
                  {badge}
                </span>
              )}
            </motion.div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside
      style={{
        width: collapsed ? '74px' : '244px',
        minHeight: '100vh',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        gap: '20px',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        flexShrink: 0,
        zIndex: 40,
        position: 'relative',
        boxShadow: '2px 0 12px rgba(15, 23, 42, 0.02)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          paddingBottom: '16px',
          borderBottom: '1px solid #F1F5F9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
              flexShrink: 0,
            }}
          >
            <Droplets size={22} style={{ color: '#FFFFFF' }} />
          </div>
          {!collapsed && (
            <div>
              <div
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.2,
                }}
              >
                AquaSense
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.4px' }}>
                SCADA TELEMETRY
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => {
            sound.playClick(600);
            setCollapsed(!collapsed);
          }}
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '6px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.18s ease',
          }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {renderNavGroup(NAV_PRIMARY, 'Operations')}
        {renderNavGroup(NAV_SYSTEM, 'System Nodes')}
      </div>

      {/* Mini Pump Quick Card in Sidebar */}
      {!collapsed && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: store.pumpOverride ? '#F0F9FF' : '#F8FAFC',
            border: `1px solid ${store.pumpOverride ? '#BAE6FD' : '#E2E8F0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: store.pumpOverride ? '#059669' : '#94A3B8',
              }}
            />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>
                Main Pump
              </div>
              <div style={{ fontSize: '10px', color: store.pumpOverride ? '#0284C7' : 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                {store.pumpOverride ? 'RUNNING (48W)' : 'STANDBY'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playRelay(!store.pumpOverride);
              store.togglePump();
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'JetBrains Mono',
              border: `1px solid ${store.pumpOverride ? '#0284C7' : '#CBD5E1'}`,
              background: store.pumpOverride ? '#0284C7' : '#FFFFFF',
              color: store.pumpOverride ? '#FFFFFF' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            {store.pumpOverride ? 'STOP' : 'START'}
          </button>
        </div>
      )}

      {/* Node Connection Footer */}
      <div
        style={{
          padding: collapsed ? '8px 0' : '10px 12px',
          borderRadius: '10px',
          background: isOnline ? '#ECFDF5' : '#FFF1F2',
          border: `1px solid ${isOnline ? '#A7F3D0' : '#FECDD3'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '8px',
        }}
        title={`ESP32 DevKit-C: ${isOnline ? 'Online' : 'Offline'}`}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isOnline ? '#059669' : '#E11D48',
            display: 'inline-block',
          }}
        />
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: isOnline ? '#065F46' : '#9F1239' }}>
              {isOnline ? 'ESP32 CONNECTED' : 'ESP32 OFFLINE'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              Node: ESP32-001
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
