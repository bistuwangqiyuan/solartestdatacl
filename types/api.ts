// API request/response type definitions

import { 
  Device, 
  TestSession, 
  TestMeasurement, 
  User, 
  ComplianceReport,
  ExcelImport,
  DashboardStats,
  TestSessionStats
} from './database';

// Generic API response wrapper
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
  requestId?: string;
}

export interface ApiMeta {
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

// Standard error codes
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_DATA_FORMAT: 'INVALID_DATA_FORMAT',
  
  // Business logic errors
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_IN_PROGRESS: 'SESSION_IN_PROGRESS',
  MEASUREMENTS_INVALID: 'MEASUREMENTS_INVALID',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  department?: string;
  phone?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UserProfileUpdate {
  full_name?: string;
  department?: string;
  phone?: string;
}

// Device API types
export interface DeviceListRequest {
  manufacturer?: string;
  device_type?: string;
  testing_standard?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'device_name' | 'manufacturer' | 'model_number';
  sort_order?: 'asc' | 'desc';
}

export interface DeviceCreateRequest {
  device_name: string;
  device_type: string;
  manufacturer: string;
  model_number: string;
  serial_number?: string;
  rated_voltage: number;
  rated_current: number;
  rated_power?: number;
  testing_standard: string[];
  specifications?: Record<string, any>;
  barcode?: string;
  qr_code?: string;
}

export interface DeviceUpdateRequest extends Partial<DeviceCreateRequest> {
  is_active?: boolean;
}

// Test Session API types
export interface TestSessionListRequest {
  device_id?: string;
  test_engineer_id?: string;
  session_status?: string;
  testing_standard?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'started_at' | 'session_name';
  sort_order?: 'asc' | 'desc';
}

export interface TestSessionCreateRequest {
  session_name: string;
  device_id: string;
  testing_standard: string;
  test_conditions?: Record<string, any>;
  test_parameters?: Record<string, any>;
  notes?: string;
}

export interface TestSessionUpdateRequest extends Partial<TestSessionCreateRequest> {
  session_status?: string;
  quality_reviewer_id?: string;
  started_at?: string;
  completed_at?: string;
  compliance_approved?: boolean;
}

// Measurement API types
export interface MeasurementListRequest {
  test_session_id: string;
  measurement_type?: string;
  pass_fail?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface MeasurementCreateRequest {
  measurement_type: string;
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

export interface MeasurementBulkCreateRequest {
  test_session_id: string;
  measurements: MeasurementCreateRequest[];
}

// Excel Import API types
export interface ExcelUploadRequest {
  file: File;
  test_session_id?: string;
}

export interface ExcelUploadResponse {
  import_id: string;
  status: 'processing' | 'completed' | 'failed';
  rows_imported?: number;
  rows_failed?: number;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface ExcelValidateResponse {
  is_valid: boolean;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  errors: Array<{
    row: number;
    field: string;
    value: any;
    message: string;
  }>;
  preview_data: TestMeasurement[];
}

// Report API types
export interface ReportGenerateRequest {
  test_session_ids: string[];
  report_type: 'full_compliance' | 'summary' | 'certificate';
  testing_standard: string;
  template_id?: string;
  include_charts?: boolean;
  include_raw_data?: boolean;
}

export interface ReportGenerateResponse {
  report_id: string;
  report_url: string;
  download_token: string;
  expires_at: string;
}

export interface ReportListRequest {
  test_session_id?: string;
  report_type?: string;
  is_final?: boolean;
  generated_by?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

// Dashboard API types
export interface DashboardDataRequest {
  date_range?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  include_charts?: boolean;
}

export interface DashboardDataResponse {
  stats: DashboardStats;
  recent_sessions: TestSession[];
  recent_activity: Array<{
    type: 'session_created' | 'device_added' | 'report_generated' | 'data_imported';
    description: string;
    timestamp: string;
    user_name: string;
  }>;
  chart_data?: {
    measurements_over_time: Array<{
      date: string;
      count: number;
    }>;
    pass_fail_ratio: {
      passed: number;
      failed: number;
    };
    device_usage: Array<{
      device_name: string;
      test_count: number;
    }>;
  };
}

// Export types
export interface DataExportRequest {
  export_type: 'excel' | 'csv' | 'json' | 'pdf';
  data_type: 'devices' | 'sessions' | 'measurements' | 'reports';
  filters?: Record<string, any>;
  include_fields?: string[];
  exclude_fields?: string[];
}

export interface DataExportResponse {
  export_id: string;
  file_url: string;
  file_size: number;
  expires_at: string;
}

// Websocket event types
export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
  timestamp: string;
}

export interface NotificationEvent {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action_url?: string;
}

// Pagination helpers
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_more: boolean;
  };
}

// Sort helpers
export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Filter helpers
export interface FilterParams {
  [key: string]: any;
}

// Search helpers
export interface SearchParams {
  query?: string;
  fields?: string[];
}