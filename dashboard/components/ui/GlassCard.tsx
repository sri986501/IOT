'use client';

import { HTMLAttributes, ReactNode } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  accentColor?: string;
  glow?: boolean;
  padding?: string;
}

export function GlassCard({
  children,
  accentColor,
  glow = false,
  padding = '22px',
  className = '',
  style,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`glass-card ${glow ? 'glass-card--glow' : ''} ${className}`}
      style={{
        padding,
        ...(accentColor
          ? {
              borderTop: `2px solid ${accentColor}`,
            }
          : {}),
        ...style,
      }}
      {...props}
    >
      {accentColor && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '12%',
            right: '12%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            borderRadius: '0 0 8px 8px',
          }}
        />
      )}
      {children}
    </div>
  );
}
