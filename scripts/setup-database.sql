-- Setup script for Supabase database
-- Run this script in your Supabase SQL editor to initialize the database

-- First, ensure the database is clean
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Now run the main database schema
-- Copy and paste the contents from database-schema.sql here or run:
-- \i /path/to/database-schema.sql

-- Additional setup for development/testing

-- Create a test admin user (you'll need to create this user through Supabase Auth first)
-- Then run this to set their role:
/*
INSERT INTO public.users (id, email, full_name, role, department, is_active)
VALUES (
    'YOUR_USER_ID_FROM_SUPABASE_AUTH',
    'admin@example.com',
    'Admin User',
    'admin',
    'IT Department',
    true
) ON CONFLICT (id) DO UPDATE
SET role = 'admin';
*/

-- Create sample test data for development
-- Sample devices
INSERT INTO public.devices (device_name, device_type, manufacturer, model_number, serial_number, rated_voltage, rated_current, rated_power, testing_standard)
VALUES 
    ('PV Disconnect Switch 1000V', 'disconnect_switch', 'SolarTech Industries', 'ST-DS-1000', 'SN-2024-001', 1000, 100, 100000, '{IEC_60947_3,UL_98B}'),
    ('Solar Circuit Breaker 600V', 'circuit_breaker', 'PowerGuard Systems', 'PG-CB-600', 'SN-2024-002', 600, 200, 120000, '{IEC_60947_3}'),
    ('PV Load Break Switch 1500V', 'load_break_switch', 'GreenEnergy Corp', 'GE-LBS-1500', 'SN-2024-003', 1500, 150, 225000, '{UL_98B}'),
    ('Fuse Combination Unit 800V', 'fuse_combination', 'SafeSolar Inc', 'SS-FCU-800', 'SN-2024-004', 800, 125, 100000, '{IEC_60947_3,UL_98B}'),
    ('Switch Disconnector 1200V', 'switch_disconnector', 'ElectroSafe Ltd', 'ES-SD-1200', 'SN-2024-005', 1200, 175, 210000, '{IEC_60947_3}');

-- Set up realtime subscriptions for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_measurements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.excel_imports;

-- Create helper functions for common operations

-- Function to get test session statistics
CREATE OR REPLACE FUNCTION public.get_test_session_stats(session_id UUID)
RETURNS TABLE (
    total_measurements INTEGER,
    passed_measurements INTEGER,
    failed_measurements INTEGER,
    avg_voltage DECIMAL,
    avg_current DECIMAL,
    min_voltage DECIMAL,
    max_voltage DECIMAL,
    min_current DECIMAL,
    max_current DECIMAL,
    test_duration INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_measurements,
        COUNT(CASE WHEN tm.pass_fail = true THEN 1 END)::INTEGER as passed_measurements,
        COUNT(CASE WHEN tm.pass_fail = false THEN 1 END)::INTEGER as failed_measurements,
        ROUND(AVG(tm.voltage), 2) as avg_voltage,
        ROUND(AVG(tm.current), 2) as avg_current,
        MIN(tm.voltage) as min_voltage,
        MAX(tm.voltage) as max_voltage,
        MIN(tm.current) as min_current,
        MAX(tm.current) as max_current,
        ts.completed_at - ts.started_at as test_duration
    FROM public.test_measurements tm
    JOIN public.test_sessions ts ON tm.test_session_id = ts.id
    WHERE tm.test_session_id = session_id
    GROUP BY ts.started_at, ts.completed_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate measurement data
CREATE OR REPLACE FUNCTION public.validate_measurement(
    voltage DECIMAL,
    current DECIMAL,
    device_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    device_record RECORD;
BEGIN
    -- Get device specifications
    SELECT rated_voltage, rated_current INTO device_record
    FROM public.devices
    WHERE id = device_id;
    
    -- Check if measurements are within acceptable range (typically +10% tolerance)
    IF voltage > device_record.rated_voltage * 1.1 OR 
       current > device_record.rated_current * 1.1 THEN
        RETURN FALSE;
    END IF;
    
    -- Additional validation logic can be added here
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create database indexes for better performance
CREATE INDEX IF NOT EXISTS idx_measurements_voltage_current ON public.test_measurements(voltage, current);
CREATE INDEX IF NOT EXISTS idx_measurements_timestamp_session ON public.test_measurements(measurement_timestamp, test_session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date_range ON public.test_sessions(started_at, completed_at);
CREATE INDEX IF NOT EXISTS idx_devices_search ON public.devices USING gin(to_tsvector('english', device_name || ' ' || manufacturer || ' ' || model_number));

-- Create materialized view for dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_stats AS
SELECT 
    COUNT(DISTINCT d.id) as total_devices,
    COUNT(DISTINCT ts.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN ts.session_status = 'in_progress' THEN ts.id END) as active_sessions,
    COUNT(DISTINCT CASE WHEN ts.created_at > NOW() - INTERVAL '24 hours' THEN ts.id END) as sessions_last_24h,
    COUNT(DISTINCT tm.id) as total_measurements,
    COUNT(DISTINCT CASE WHEN ei.created_at > NOW() - INTERVAL '7 days' THEN ei.id END) as recent_imports
FROM public.devices d
CROSS JOIN public.test_sessions ts
CROSS JOIN public.test_measurements tm
CROSS JOIN public.excel_imports ei;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_dashboard_stats ON public.dashboard_stats (total_devices);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule periodic refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-dashboard-stats', '*/5 * * * *', 'SELECT public.refresh_dashboard_stats();');

COMMENT ON FUNCTION public.get_test_session_stats IS 'Get comprehensive statistics for a test session';
COMMENT ON FUNCTION public.validate_measurement IS 'Validate measurement data against device specifications';
COMMENT ON MATERIALIZED VIEW public.dashboard_stats IS 'Pre-aggregated statistics for dashboard performance';