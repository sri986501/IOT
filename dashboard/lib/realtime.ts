'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import type { SensorReading, Alert, Device } from '@/types/water';

// ============================================================================
// useRealtimeReadings — subscribes to new sensor_readings rows
// ============================================================================
export function useRealtimeReadings(
  deviceId: string,
  onNewReading: (reading: SensorReading) => void
) {
  const callbackRef = useRef(onNewReading);
  callbackRef.current = onNewReading;

  useEffect(() => {
    const channel = supabase
      .channel(`readings:${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          callbackRef.current(payload.new as SensorReading);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);
}

// ============================================================================
// useRealtimeAlerts — subscribes to new alert rows
// ============================================================================
export function useRealtimeAlerts(
  deviceId: string,
  onNewAlert: (alert: Alert) => void
) {
  const callbackRef = useRef(onNewAlert);
  callbackRef.current = onNewAlert;

  useEffect(() => {
    const channel = supabase
      .channel(`alerts:${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          callbackRef.current(payload.new as Alert);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);
}

// ============================================================================
// useRealtimeDeviceStatus — subscribes to device updates
// ============================================================================
export function useRealtimeDeviceStatus(
  deviceId: string,
  onUpdate: (device: Device) => void
) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    const channel = supabase
      .channel(`device:${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          callbackRef.current(payload.new as Device);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);
}

// ============================================================================
// useOfflineDetection — fires callback when no reading received for `threshold`ms
// ============================================================================
export function useOfflineDetection(
  lastReadingTime: string | null,
  thresholdMs = 30000,
  onOffline: () => void
) {
  const callbackRef = useRef(onOffline);
  callbackRef.current = onOffline;

  useEffect(() => {
    if (!lastReadingTime) return;

    const check = () => {
      const elapsed = Date.now() - new Date(lastReadingTime).getTime();
      if (elapsed > thresholdMs) {
        callbackRef.current();
      }
    };

    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [lastReadingTime, thresholdMs]);
}
