'use client';

import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { resolveAlert } from '@/lib/api';
import type { Alert, AlertSeverity } from '@/types/water';

interface AlertPanelProps {
  alerts: Alert[];
  onResolved?: (id: string) => void;
  maxVisible?: number;
}

const SEV_CONFIG: Record<AlertSeverity, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  critical: { icon: AlertCircle, color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3', label: 'CRITICAL' },
  warning: { icon: AlertTriangle, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'WARNING' },
  notice: { icon: Info, color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', label: 'NOTICE' },
  info: { icon: Info, color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD', label: 'INFO' },
};

function AlertItem({ alert, onResolved }: { alert: Alert; onResolved?: (id: string) => void }) {
  const [resolving, setResolving] = useState(false);
  const config = SEV_CONFIG[alert.severity] || SEV_CONFIG.info;
  const Icon = config.icon;
  const isResolved = !!alert.resolved_at;

  const handleResolve = async () => {
    if (resolving || isResolved) return;
    setResolving(true);
    const ok = await resolveAlert(alert.id);
    if (ok && onResolved) onResolved(alert.id);
    setResolving(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '10px',
        background: isResolved ? '#F8FAFC' : config.bg,
        border: `1px solid ${isResolved ? '#E2E8F0' : config.border}`,
        opacity: isResolved ? 0.6 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ paddingTop: '2px', flexShrink: 0 }}>
        {isResolved ? (
          <CheckCircle2 size={16} color="#059669" />
        ) : (
          <Icon size={16} color={config.color} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: isResolved ? '#059669' : config.color,
              letterSpacing: '0.6px',
            }}
          >
            {isResolved ? '✓ RESOLVED' : config.label}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'JetBrains Mono' }}>
            {new Date(alert.created_at).toLocaleString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#0F172A', lineHeight: 1.4, fontWeight: 500 }}>
          {alert.message}
        </p>
      </div>

      {!isResolved && onResolved && (
        <button
          onClick={handleResolve}
          disabled={resolving}
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            border: `1px solid ${config.color}40`,
            background: '#FFFFFF',
            color: config.color,
            cursor: resolving ? 'wait' : 'pointer',
            flexShrink: 0,
          }}
          title="Mark as resolved"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export function AlertPanel({ alerts, onResolved, maxVisible = 5 }: AlertPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? alerts : alerts.slice(0, maxVisible);
  const activeCount = alerts.filter((a) => !a.resolved_at).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Recent Notifications
        </span>
        {activeCount > 0 && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 800,
              background: '#FFF1F2',
              color: '#E11D48',
              border: '1px solid #FECDD3',
            }}
          >
            {activeCount} active
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
            border: '1px dashed #CBD5E1',
            borderRadius: '10px',
            background: '#F8FAFC',
          }}
        >
          <CheckCircle2 size={22} style={{ margin: '0 auto 8px', color: '#059669' }} />
          All systems operating within nominal safety thresholds
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visible.map((a) => (
              <AlertItem key={a.id} alert={a} onResolved={onResolved} />
            ))}
          </div>

          {alerts.length > maxVisible && (
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Show less' : `Show ${alerts.length - maxVisible} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
