-- Solar PV Disconnect Device Testing System Database Schema
-- Industrial-grade PostgreSQL schema for Supabase

-- =====================================================
-- EXTENSIONS AND FUNCTIONS
-- =====================================================

-- Enable RLS and UUID generation
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-key';

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

-- User role enumeration
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'engineer', 'viewer');

-- Device type enumeration
CREATE TYPE device_type AS ENUM (
    'disconnect_switch', 
    'fuse_combination', 
    'switch_disconnector',
    'circuit_breaker',
    'load_break_switch'
);

-- Test session status enumeration
CREATE TYPE test_session_status AS ENUM (
    'draft', 
    'in_progress', 
    'completed', 
    'failed', 
    'cancelled'
);

-- Measurement type enumeration
CREATE TYPE measurement_type AS ENUM (
    'normal_operation',
    'fault_condition', 
    'transient_response',
    'calibration',
    'verification'
);

-- Testing standard enumeration
CREATE TYPE testing_standard AS ENUM (
    'IEC_60947_3',
    'UL_98B',
    'IEC_62271_100',
    'ANSI_C37_06'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'viewer'::user_role,
    department TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices table - PV disconnect devices under test
CREATE TABLE public.devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_name TEXT NOT NULL,
    device_type device_type NOT NULL,
    manufacturer TEXT NOT NULL,
    model_number TEXT NOT NULL,
    serial_number TEXT UNIQUE,
    rated_voltage DECIMAL(8,2) NOT NULL, -- Volts
    rated_current DECIMAL(8,2) NOT NULL, -- Amperes
    rated_power DECIMAL(10,2), -- Watts
    testing_standard testing_standard[] DEFAULT '{IEC_60947_3}',
    specifications JSONB, -- Additional technical specifications
    barcode TEXT UNIQUE, -- For mobile scanning
    qr_code TEXT UNIQUE, -- For mobile scanning
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test sessions - Individual testing campaigns
CREATE TABLE public.test_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_name TEXT NOT NULL,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE RESTRICT,
    testing_standard testing_standard NOT NULL,
    session_status test_session_status DEFAULT 'draft'::test_session_status,
    test_engineer_id UUID NOT NULL REFERENCES public.users(id),
    quality_reviewer_id UUID REFERENCES public.users(id),
    test_conditions JSONB, -- Temperature, humidity, etc.
    test_parameters JSONB, -- Voltage ranges, current limits, etc.
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    compliance_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test measurements - Individual data points
CREATE TABLE public.test_measurements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    measurement_timestamp TIMESTAMPTZ DEFAULT NOW(),
    measurement_type measurement_type NOT NULL,
    voltage DECIMAL(10,4), -- Volts with high precision
    current DECIMAL(10,4), -- Amperes with high precision
    resistance DECIMAL(12,6), -- Ohms with high precision
    power DECIMAL(12,4), -- Watts
    frequency DECIMAL(8,4), -- Hertz
    phase_angle DECIMAL(6,2), -- Degrees
    temperature DECIMAL(5,2), -- Celsius
    humidity DECIMAL(5,2), -- Percentage
    pass_fail BOOLEAN,
    deviation_percentage DECIMAL(8,4), -- Percentage from expected value
    notes TEXT,
    raw_data JSONB, -- Original measurement data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Excel import logs - Track data import operations
CREATE TABLE public.excel_imports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    test_session_id UUID REFERENCES public.test_sessions(id),
    rows_imported INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,
    import_status TEXT DEFAULT 'processing', -- processing, completed, failed
    error_details TEXT,
    file_path TEXT, -- Supabase storage path
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Compliance reports - Generated compliance documentation
CREATE TABLE public.compliance_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_name TEXT NOT NULL,
    test_session_id UUID NOT NULL REFERENCES public.test_sessions(id),
    testing_standard testing_standard NOT NULL,
    report_type TEXT NOT NULL, -- 'full_compliance', 'summary', 'certificate'
    generated_by UUID NOT NULL REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    digital_signature TEXT, -- Cryptographic signature
    report_data JSONB NOT NULL, -- Report content and metadata
    file_path TEXT, -- Generated PDF path
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- Audit logs - System activity tracking
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'export'
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System settings - Application configuration
CREATE TABLE public.system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_is_active ON public.users(is_active);

-- Devices table indexes
CREATE INDEX idx_devices_type ON public.devices(device_type);
CREATE INDEX idx_devices_manufacturer ON public.devices(manufacturer);
CREATE INDEX idx_devices_barcode ON public.devices(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_devices_active ON public.devices(is_active);
CREATE INDEX idx_devices_created_by ON public.devices(created_by);

-- Test sessions table indexes
CREATE INDEX idx_test_sessions_device ON public.test_sessions(device_id);
CREATE INDEX idx_test_sessions_status ON public.test_sessions(session_status);
CREATE INDEX idx_test_sessions_engineer ON public.test_sessions(test_engineer_id);
CREATE INDEX idx_test_sessions_standard ON public.test_sessions(testing_standard);
CREATE INDEX idx_test_sessions_dates ON public.test_sessions(started_at, completed_at);

-- Test measurements table indexes
CREATE INDEX idx_test_measurements_session ON public.test_measurements(test_session_id);
CREATE INDEX idx_test_measurements_timestamp ON public.test_measurements(measurement_timestamp);
CREATE INDEX idx_test_measurements_type ON public.test_measurements(measurement_type);
CREATE INDEX idx_test_measurements_pass_fail ON public.test_measurements(pass_fail);

-- Excel imports table indexes
CREATE INDEX idx_excel_imports_user ON public.excel_imports(uploaded_by);
CREATE INDEX idx_excel_imports_session ON public.excel_imports(test_session_id);
CREATE INDEX idx_excel_imports_status ON public.excel_imports(import_status);
CREATE INDEX idx_excel_imports_created ON public.excel_imports(created_at);

-- Audit logs table indexes
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excel_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile and active colleagues" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        (is_active = true AND auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager', 'engineer')))
    );

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    );

-- Devices table policies
CREATE POLICY "All authenticated users can view devices" ON public.devices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Engineers and above can create devices" ON public.devices
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager', 'engineer'))
    );

CREATE POLICY "Engineers and above can update devices" ON public.devices
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager', 'engineer'))
    );

-- Test sessions table policies
CREATE POLICY "Users can view test sessions they have access to" ON public.test_sessions
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager')) OR
        test_engineer_id = auth.uid() OR
        quality_reviewer_id = auth.uid()
    );

CREATE POLICY "Engineers can create test sessions" ON public.test_sessions
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager', 'engineer')) AND
        test_engineer_id = auth.uid()
    );

CREATE POLICY "Test engineers can update their own sessions" ON public.test_sessions
    FOR UPDATE USING (
        test_engineer_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager'))
    );

-- Test measurements table policies
CREATE POLICY "Users can view measurements from accessible test sessions" ON public.test_measurements
    FOR SELECT USING (
        test_session_id IN (
            SELECT id FROM public.test_sessions 
            WHERE test_engineer_id = auth.uid() 
               OR quality_reviewer_id = auth.uid()
               OR auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager'))
        )
    );

CREATE POLICY "Engineers can add measurements to their test sessions" ON public.test_measurements
    FOR INSERT WITH CHECK (
        test_session_id IN (
            SELECT id FROM public.test_sessions 
            WHERE test_engineer_id = auth.uid() 
               OR auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager'))
        )
    );

-- Excel imports table policies
CREATE POLICY "Users can view their own imports" ON public.excel_imports
    FOR SELECT USING (
        uploaded_by = auth.uid() OR
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager'))
    );

CREATE POLICY "Engineers can create imports" ON public.excel_imports
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() AND
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager', 'engineer'))
    );

-- Compliance reports table policies
CREATE POLICY "Users can view reports for accessible test sessions" ON public.compliance_reports
    FOR SELECT USING (
        test_session_id IN (
            SELECT id FROM public.test_sessions 
            WHERE test_engineer_id = auth.uid() 
               OR quality_reviewer_id = auth.uid()
               OR auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager'))
        )
    );

-- Audit logs policies (read-only for admins and managers)
CREATE POLICY "Admins and managers can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager'))
    );

-- System settings policies (admin only)
CREATE POLICY "Only admins can access system settings" ON public.system_settings
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    );

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_sessions_updated_at BEFORE UPDATE ON public.test_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
BEGIN
    -- Get the current user ID
    user_id_val := auth.uid();
    
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
        VALUES (user_id_val, 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (user_id_val, 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
        VALUES (user_id_val, 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_devices_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.devices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_test_sessions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.test_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('app_version', '"1.0.0"', 'Application version'),
('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)'),
('allowed_file_types', '["xlsx", "xls", "csv"]', 'Allowed file types for upload'),
('session_timeout', '86400', 'Session timeout in seconds (24 hours)'),
('compliance_standards', '["IEC_60947_3", "UL_98B"]', 'Supported compliance standards'),
('notification_settings', '{"email_enabled": true, "in_app_enabled": true}', 'Notification preferences');

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for test session summary with device and engineer info
CREATE VIEW public.test_session_summary AS
SELECT 
    ts.id,
    ts.session_name,
    ts.session_status,
    ts.testing_standard,
    ts.started_at,
    ts.completed_at,
    d.device_name,
    d.manufacturer,
    d.model_number,
    u.full_name as engineer_name,
    ur.full_name as reviewer_name,
    (SELECT COUNT(*) FROM public.test_measurements WHERE test_session_id = ts.id) as measurement_count,
    (SELECT COUNT(*) FROM public.test_measurements WHERE test_session_id = ts.id AND pass_fail = true) as passed_count,
    (SELECT COUNT(*) FROM public.test_measurements WHERE test_session_id = ts.id AND pass_fail = false) as failed_count
FROM public.test_sessions ts
JOIN public.devices d ON ts.device_id = d.id
JOIN public.users u ON ts.test_engineer_id = u.id
LEFT JOIN public.users ur ON ts.quality_reviewer_id = ur.id;

-- View for device testing history
CREATE VIEW public.device_testing_history AS
SELECT 
    d.id as device_id,
    d.device_name,
    d.manufacturer,
    d.model_number,
    COUNT(ts.id) as total_sessions,
    COUNT(CASE WHEN ts.session_status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN ts.session_status = 'failed' THEN 1 END) as failed_sessions,
    MAX(ts.completed_at) as last_test_date,
    AVG(CASE WHEN ts.session_status = 'completed' THEN 
        EXTRACT(epoch FROM (ts.completed_at - ts.started_at))/3600 
    END) as avg_test_duration_hours
FROM public.devices d
LEFT JOIN public.test_sessions ts ON d.id = ts.device_id
GROUP BY d.id, d.device_name, d.manufacturer, d.model_number;

-- =====================================================
-- SECURITY AND PERMISSIONS
-- =====================================================

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions for service role (for API functions)
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Revoke public access
REVOKE ALL ON SCHEMA public FROM public;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.users IS 'System users with role-based access control';
COMMENT ON TABLE public.devices IS 'PV disconnect devices under testing';
COMMENT ON TABLE public.test_sessions IS 'Individual testing campaigns for compliance verification';
COMMENT ON TABLE public.test_measurements IS 'Individual measurement data points from testing';
COMMENT ON TABLE public.excel_imports IS 'Tracking of Excel file import operations';
COMMENT ON TABLE public.compliance_reports IS 'Generated compliance reports for regulatory submission';
COMMENT ON TABLE public.audit_logs IS 'System activity audit trail for regulatory compliance';
COMMENT ON TABLE public.system_settings IS 'Application configuration and settings';

COMMENT ON COLUMN public.devices.specifications IS 'Additional technical specifications as JSON';
COMMENT ON COLUMN public.test_sessions.test_conditions IS 'Environmental conditions during testing (temperature, humidity, etc.)';
COMMENT ON COLUMN public.test_sessions.test_parameters IS 'Test parameters and limits (voltage ranges, current limits, etc.)';
COMMENT ON COLUMN public.test_measurements.raw_data IS 'Original measurement data from testing equipment';