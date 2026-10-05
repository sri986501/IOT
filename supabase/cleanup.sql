-- =============================================================================
-- WaterGuardian — Automatic 7-Day Rolling Cleanup
-- Run this AFTER schema.sql in your Supabase SQL Editor
-- Requires pg_cron extension — enable via Dashboard → Database → Extensions
-- =============================================================================

-- =============================================================================
-- FUNCTION: cleanup_old_data
-- Deletes sensor_readings and alerts older than 7 days
-- Devices table is NEVER touched (permanent config)
-- =============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_readings    INT;
    deleted_alerts      INT;
BEGIN
    -- Delete sensor readings older than 7 days
    DELETE FROM sensor_readings
    WHERE created_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS deleted_readings = ROW_COUNT;

    -- Delete alerts older than 7 days
    DELETE FROM alerts
    WHERE created_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS deleted_alerts = ROW_COUNT;

    -- Log cleanup result
    RAISE NOTICE 'WaterGuardian cleanup: removed % sensor readings and % alerts older than 7 days',
        deleted_readings, deleted_alerts;
END;
$$;

-- =============================================================================
-- CRON JOB: Run cleanup every day at 02:00 UTC
-- Uses pg_cron — must be enabled first
-- =============================================================================

-- Remove existing job if re-running this script
SELECT cron.unschedule('waterguardian-cleanup')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'waterguardian-cleanup'
);

SELECT cron.schedule(
    'waterguardian-cleanup',    -- job name
    '0 2 * * *',                -- every day at 02:00 UTC
    'SELECT cleanup_old_data();'
);

-- =============================================================================
-- MANUAL TEST: Run cleanup immediately to verify it works
-- Uncomment and run this to test:
-- SELECT cleanup_old_data();
-- =============================================================================

-- =============================================================================
-- UTILITY VIEW: See current data window
-- =============================================================================
CREATE OR REPLACE VIEW data_window_status AS
SELECT
    (SELECT COUNT(*) FROM sensor_readings) AS total_readings,
    (SELECT COUNT(*) FROM alerts) AS total_alerts,
    (SELECT MIN(created_at) FROM sensor_readings) AS oldest_reading,
    (SELECT MAX(created_at) FROM sensor_readings) AS newest_reading,
    (SELECT NOW() - INTERVAL '7 days') AS cutoff_date,
    (SELECT COUNT(*) FROM sensor_readings WHERE created_at >= NOW() - INTERVAL '24 hours') AS readings_last_24h,
    (SELECT COUNT(*) FROM sensor_readings WHERE created_at >= NOW() - INTERVAL '7 days') AS readings_last_7d;
