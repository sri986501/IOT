-- =============================================================================
-- WaterGuardian Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- Enable pg_cron extension (needed for scheduled cleanup)
-- Note: May need to be enabled via Supabase Dashboard → Database → Extensions
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =============================================================================
-- TABLE: devices
-- Permanent device configuration — never auto-deleted
-- =============================================================================
CREATE TABLE IF NOT EXISTS devices (
    id              UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id       TEXT            NOT NULL UNIQUE,
    device_name     TEXT            NOT NULL DEFAULT 'Unknown Device',
    location        TEXT            NOT NULL DEFAULT 'Unknown Location',
    tank_capacity   FLOAT           NOT NULL DEFAULT 1000,   -- litres
    tank_height     FLOAT           NOT NULL DEFAULT 100,    -- cm
    status          TEXT            NOT NULL DEFAULT 'offline' CHECK (status IN ('online','offline','warning')),
    last_seen       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: sensor_readings
-- Rolling 7-day window — auto-cleaned daily
-- =============================================================================
CREATE TABLE IF NOT EXISTS sensor_readings (
    id                      UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id               TEXT        NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    water_level_percent     FLOAT       NOT NULL CHECK (water_level_percent >= 0 AND water_level_percent <= 100),
    water_volume_liters     FLOAT       NOT NULL CHECK (water_volume_liters >= 0),
    flow_rate_lpm           FLOAT       NOT NULL DEFAULT 0 CHECK (flow_rate_lpm >= 0),
    distance_cm             FLOAT       NOT NULL CHECK (distance_cm >= 0),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_time
    ON sensor_readings (device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at
    ON sensor_readings (created_at DESC);

-- =============================================================================
-- TABLE: alerts
-- Rolling 7-day window — auto-cleaned daily
-- =============================================================================
CREATE TABLE IF NOT EXISTS alerts (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id       TEXT        NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    alert_type      TEXT        NOT NULL CHECK (alert_type IN (
                        'LOW_WATER', 'HIGH_WATER', 'HIGH_FLOW', 'SENSOR_FAILURE', 'DEVICE_OFFLINE'
                    )),
    severity        TEXT        NOT NULL CHECK (severity IN ('critical','warning','notice','info')),
    message         TEXT        NOT NULL,
    value           FLOAT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_device_time
    ON alerts (device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_severity
    ON alerts (severity, resolved_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- Anonymous reads allowed; writes require service_role key (used by ESP32)
-- =============================================================================

ALTER TABLE devices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts          ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (dashboard uses anon key)
CREATE POLICY "Allow public read on devices"
    ON devices FOR SELECT USING (true);

CREATE POLICY "Allow public read on sensor_readings"
    ON sensor_readings FOR SELECT USING (true);

CREATE POLICY "Allow public read on alerts"
    ON alerts FOR SELECT USING (true);

-- Allow service_role (ESP32) to insert/update/delete
CREATE POLICY "Allow service insert on devices"
    ON devices FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update on devices"
    ON devices FOR UPDATE USING (true);

CREATE POLICY "Allow service insert on sensor_readings"
    ON sensor_readings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service insert on alerts"
    ON alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update on alerts"
    ON alerts FOR UPDATE USING (true);

-- =============================================================================
-- SEED: Default device (matches ESP32 sketch)
-- =============================================================================
INSERT INTO devices (device_id, device_name, location, tank_capacity, tank_height, status)
VALUES ('ESP32-001', 'Main Hostel Tank', 'Hostel A', 1000, 100, 'offline')
ON CONFLICT (device_id) DO NOTHING;
