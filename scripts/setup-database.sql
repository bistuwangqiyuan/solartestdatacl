-- Solar Disconnect Testing Data Management System
-- Database Schema Setup Script

-- Enable RLS and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'engineer', 'viewer')),
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Devices table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_number TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    voltage_rating DECIMAL(10,2) NOT NULL,
    current_rating DECIMAL(10,2) NOT NULL,
    resistance_rating DECIMAL(10,2),
    standards_compliance TEXT[] DEFAULT '{}',
    device_type TEXT NOT NULL CHECK (device_type IN ('disconnect_switch', 'fuse_combination', 'switch_disconnector')),
    specifications JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test sessions table
CREATE TABLE IF NOT EXISTS public.test_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    test_conditions JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    excel_file_path TEXT,
    summary_stats JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test measurements table
CREATE TABLE IF NOT EXISTS public.test_measurements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    voltage DECIMAL(12,4) NOT NULL,
    current DECIMAL(12,4) NOT NULL,
    resistance DECIMAL(12,4),
    temperature DECIMAL(8,2),
    measurement_type TEXT DEFAULT 'normal' CHECK (measurement_type IN ('normal', 'fault', 'transient')),
    sequence_number INTEGER NOT NULL,
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'export', 'login', 'logout', 'import')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('device', 'test_session', 'measurement', 'user', 'report')),
    entity_id UUID NOT NULL,
    changes JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Report templates table
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('iec_60947_3', 'ul_98b', 'custom')),
    template_content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_manufacturer ON devices(manufacturer);
CREATE INDEX IF NOT EXISTS idx_devices_model_number ON devices(model_number);
CREATE INDEX IF NOT EXISTS idx_devices_standards ON devices USING GIN(standards_compliance);

CREATE INDEX IF NOT EXISTS idx_test_sessions_device_id ON test_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_status ON test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_test_sessions_started_at ON test_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_measurements_session_id ON test_measurements(session_id);
CREATE INDEX IF NOT EXISTS idx_test_measurements_timestamp ON test_measurements(timestamp);
CREATE INDEX IF NOT EXISTS idx_test_measurements_sequence ON test_measurements(session_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Devices are readable by all authenticated users, writable by engineers and above
CREATE POLICY "Authenticated users can view devices" ON devices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Engineers can manage devices" ON devices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('engineer', 'manager', 'admin')
        )
    );

-- Test sessions and measurements follow similar pattern
CREATE POLICY "Users can view own test sessions" ON test_sessions
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Engineers can create test sessions" ON test_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('engineer', 'manager', 'admin')
        )
    );

-- Test measurements inherit session permissions
CREATE POLICY "Users can view measurements for own sessions" ON test_measurements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM test_sessions 
            WHERE id = test_measurements.session_id 
            AND (
                user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() AND role IN ('manager', 'admin')
                )
            )
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_test_sessions_updated_at ON test_sessions;
CREATE TRIGGER update_test_sessions_updated_at BEFORE UPDATE ON test_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development
INSERT INTO public.devices (model_number, manufacturer, voltage_rating, current_rating, device_type, standards_compliance) 
VALUES 
    ('PV-DISC-600-100', 'Solar Corp', 600.00, 100.00, 'disconnect_switch', '{"IEC 60947-3", "UL 98B"}'),
    ('PV-DISC-1000-200', 'Power Systems Inc', 1000.00, 200.00, 'disconnect_switch', '{"IEC 60947-3", "UL 98B"}'),
    ('PV-FUSE-600-63', 'FuseTech Ltd', 600.00, 63.00, 'fuse_combination', '{"IEC 60947-3"}')
ON CONFLICT DO NOTHING;

-- Insert demo user (this will need to be done manually via Supabase Auth)
-- The user profile will be created automatically via the AuthContext