// Database type definitions for Solar PV Testing System

export type UserRole = 'admin' | 'manager' | 'engineer' | 'viewer';

export type DeviceType = 
  | 'disconnect_switch'
  | 'fuse_combination'
  | 'switch_disconnector'
  | 'circuit_breaker'
  | 'load_break_switch';

export type TestSessionStatus = 
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type MeasurementType = 
  | 'normal_operation'
  | 'fault_condition'
  | 'transient_response'
  | 'calibration'
  | 'verification';

export type TestingStandard = 
  | 'IEC_60947_3'
  | 'UL_98B'
  | 'IEC_62271_100'
  | 'ANSI_C37_06';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  device_name: string;
  device_type: DeviceType;
  manufacturer: string;
  model_number: string;
  serial_number?: string;
  rated_voltage: number;
  rated_current: number;
  rated_power?: number;
  testing_standard: TestingStandard[];
  specifications?: Record<string, any>;
  barcode?: string;
  qr_code?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TestSession {
  id: string;
  session_name: string;
  device_id: string;
  testing_standard: TestingStandard;
  session_status: TestSessionStatus;
  test_engineer_id: string;
  quality_reviewer_id?: string;
  test_conditions?: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    altitude?: number;
    [key: string]: any;
  };
  test_parameters?: {
    voltage_range?: [number, number];
    current_range?: [number, number];
    test_duration?: number;
    sampling_rate?: number;
    [key: string]: any;
  };
  started_at?: string;
  completed_at?: string;
  notes?: string;
  compliance_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TestMeasurement {
  id: string;
  test_session_id: string;
  measurement_timestamp: string;
  measurement_type: MeasurementType;
  voltage?: number;
  current?: number;
  resistance?: number;
  power?: number;
  frequency?: number;
  phase_angle?: number;
  temperature?: number;
  humidity?: number;
  pass_fail?: boolean;
  deviation_percentage?: number;
  notes?: string;
  raw_data?: Record<string, any>;
  created_at: string;
}

export interface ExcelImport {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  uploaded_by: string;
  test_session_id?: string;
  rows_imported: number;
  rows_failed: number;
  import_status: 'processing' | 'completed' | 'failed';
  error_details?: string;
  file_path?: string;
  created_at: string;
  processed_at?: string;
}

export interface ComplianceReport {
  id: string;
  report_name: string;
  test_session_id: string;
  testing_standard: TestingStandard;
  report_type: 'full_compliance' | 'summary' | 'certificate';
  generated_by: string;
  approved_by?: string;
  digital_signature?: string;
  report_data: Record<string, any>;
  file_path?: string;
  is_final: boolean;
  created_at: string;
  approved_at?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'export';
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  is_encrypted: boolean;
  updated_by?: string;
  updated_at: string;
}

// View types
export interface TestSessionSummary {
  id: string;
  session_name: string;
  session_status: TestSessionStatus;
  testing_standard: TestingStandard;
  started_at?: string;
  completed_at?: string;
  device_name: string;
  manufacturer: string;
  model_number: string;
  engineer_name: string;
  reviewer_name?: string;
  measurement_count: number;
  passed_count: number;
  failed_count: number;
}

export interface DeviceTestingHistory {
  device_id: string;
  device_name: string;
  manufacturer: string;
  model_number: string;
  total_sessions: number;
  completed_sessions: number;
  failed_sessions: number;
  last_test_date?: string;
  avg_test_duration_hours?: number;
}

// Form input types
export interface DeviceFormData {
  device_name: string;
  device_type: DeviceType;
  manufacturer: string;
  model_number: string;
  serial_number?: string;
  rated_voltage: number;
  rated_current: number;
  rated_power?: number;
  testing_standard: TestingStandard[];
  specifications?: Record<string, any>;
  barcode?: string;
  qr_code?: string;
}

export interface TestSessionFormData {
  session_name: string;
  device_id: string;
  testing_standard: TestingStandard;
  test_conditions?: Record<string, any>;
  test_parameters?: Record<string, any>;
  notes?: string;
}

export interface MeasurementFormData {
  measurement_type: MeasurementType;
  voltage?: number;
  current?: number;
  resistance?: number;
  power?: number;
  frequency?: number;
  phase_angle?: number;
  temperature?: number;
  humidity?: number;
  pass_fail?: boolean;
  notes?: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface DashboardStats {
  total_devices: number;
  total_sessions: number;
  active_sessions: number;
  sessions_last_24h: number;
  total_measurements: number;
  recent_imports: number;
}

export interface TestSessionStats {
  total_measurements: number;
  passed_measurements: number;
  failed_measurements: number;
  avg_voltage: number;
  avg_current: number;
  min_voltage: number;
  max_voltage: number;
  min_current: number;
  max_current: number;
  test_duration?: string;
}