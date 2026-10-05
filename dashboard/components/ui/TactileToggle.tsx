'use client';
import { motion } from 'framer-motion';

interface TactileToggleProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  disabled?: boolean;
}

export function TactileToggle({
  checked,
  onChange,
  label,
  size = 'md',
  color = '#0284C7',
  disabled = false,
}: TactileToggleProps) {
  const dims = {
    sm: { w: 36, h: 20, knob: 14, pad: 3 },
    md: { w: 48, h: 26, knob: 18, pad: 4 },
    lg: { w: 60, h: 32, knob: 24, pad: 4 },
  }[size];

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: disabled ? 'not-allowed' : 'pointer' }}
      onClick={disabled ? undefined : onChange}
    >
      <div style={{ position: 'relative', width: dims.w, height: dims.h, flexShrink: 0 }}>
        {/* Track */}
        <motion.div
          animate={{
            background: checked
              ? color
              : '#E2E8F0',
            boxShadow: checked
              ? `0 2px 8px ${color}40`
              : 'none',
          }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '999px',
            border: `1px solid ${checked ? color : '#CBD5E1'}`,
            opacity: disabled ? 0.4 : 1,
          }}
        />
        {/* Knob */}
        <motion.div
          animate={{ x: checked ? dims.w - dims.knob - dims.pad * 2 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'absolute',
            top: dims.pad,
            left: dims.pad,
            width: dims.knob,
            height: dims.knob,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.06)',
          }}
        />
      </div>
      {label && (
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: checked ? color : 'var(--text-secondary)',
            transition: 'color 0.2s',
            userSelect: 'none',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
