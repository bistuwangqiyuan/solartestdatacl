// Application constants

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ENGINEER: 'engineer',
  VIEWER: 'viewer',
} as const

// Device types
export const DEVICE_TYPES = {
  DISCONNECT_SWITCH: 'disconnect_switch',
  FUSE_COMBINATION: 'fuse_combination',
  SWITCH_DISCONNECTOR: 'switch_disconnector',
  CIRCUIT_BREAKER: 'circuit_breaker',
  LOAD_BREAK_SWITCH: 'load_break_switch',
} as const

// Test session status
export const TEST_SESSION_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

// Measurement types
export const MEASUREMENT_TYPES = {
  NORMAL_OPERATION: 'normal_operation',
  FAULT_CONDITION: 'fault_condition',
  TRANSIENT_RESPONSE: 'transient_response',
  CALIBRATION: 'calibration',
  VERIFICATION: 'verification',
} as const

// Testing standards
export const TESTING_STANDARDS = {
  IEC_60947_3: 'IEC_60947_3',
  UL_98B: 'UL_98B',
  IEC_62271_100: 'IEC_62271_100',
  ANSI_C37_06: 'ANSI_C37_06',
} as const

// File upload constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['xlsx', 'xls', 'csv'],
  ALLOWED_MIME_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ],
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  INPUT_WITH_TIME: 'yyyy-MM-dd\'T\'HH:mm',
  API: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'',
  FILE_NAME: 'yyyy-MM-dd_HH-mm-ss',
} as const

// Chart colors
export const CHART_COLORS = {
  PRIMARY: '#3B82F6', // Blue
  SECONDARY: '#10B981', // Green
  DANGER: '#EF4444', // Red
  WARNING: '#F59E0B', // Yellow
  INFO: '#6366F1', // Indigo
  SUCCESS: '#10B981', // Green
  GRAY: '#6B7280',
  SERIES: [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
  ],
} as const

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REGISTER: '/api/auth/register',
  PROFILE: '/api/auth/profile',
  
  // Devices
  DEVICES: '/api/devices',
  DEVICE_BY_ID: (id: string) => `/api/devices/${id}`,
  
  // Test Sessions
  TEST_SESSIONS: '/api/test-sessions',
  TEST_SESSION_BY_ID: (id: string) => `/api/test-sessions/${id}`,
  TEST_SESSION_MEASUREMENTS: (id: string) => `/api/test-sessions/${id}/measurements`,
  
  // Measurements
  MEASUREMENTS: '/api/measurements',
  MEASUREMENT_BY_ID: (id: string) => `/api/measurements/${id}`,
  
  // Excel
  EXCEL_UPLOAD: '/api/excel/upload',
  EXCEL_VALIDATE: '/api/excel/validate',
  EXCEL_EXPORT: '/api/excel/export',
  
  // Reports
  REPORTS: '/api/reports',
  REPORT_GENERATE: '/api/reports/generate',
  REPORT_BY_ID: (id: string) => `/api/reports/${id}`,
  REPORT_DOWNLOAD: (id: string) => `/api/reports/download/${id}`,
  
  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
  DASHBOARD_ACTIVITY: '/api/dashboard/activity',
  
  // Admin
  USERS: '/api/admin/users',
  USER_BY_ID: (id: string) => `/api/admin/users/${id}`,
  AUDIT_LOGS: '/api/admin/audit-logs',
  SYSTEM_SETTINGS: '/api/admin/settings',
} as const

// Routes
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Devices
  DEVICES: '/devices',
  DEVICE_NEW: '/devices/new',
  DEVICE_BY_ID: (id: string) => `/devices/${id}`,
  DEVICE_EDIT: (id: string) => `/devices/${id}/edit`,
  
  // Test Sessions
  TEST_SESSIONS: '/test-sessions',
  TEST_SESSION_NEW: '/test-sessions/new',
  TEST_SESSION_BY_ID: (id: string) => `/test-sessions/${id}`,
  TEST_SESSION_EDIT: (id: string) => `/test-sessions/${id}/edit`,
  TEST_SESSION_MEASUREMENTS: (id: string) => `/test-sessions/${id}/measurements`,
  
  // Reports
  REPORTS: '/reports',
  REPORT_GENERATE: '/reports/generate',
  REPORT_BY_ID: (id: string) => `/reports/${id}`,
  
  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_BY_ID: (id: string) => `/admin/users/${id}`,
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_SETTINGS: '/admin/settings',
  
  // Profile
  PROFILE: '/profile',
  PROFILE_SETTINGS: '/profile/settings',
} as const

// Error messages
export const ERROR_MESSAGES = {
  // Generic
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  NOT_FOUND: 'The requested resource was not found.',
  
  // Auth
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_DISABLED: 'Your account has been disabled.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  
  // Validation
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_NUMBER: 'Please enter a valid number.',
  INVALID_DATE: 'Please enter a valid date.',
  
  // File upload
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size.',
  INVALID_FILE_TYPE: 'Invalid file type. Only Excel files are allowed.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  
  // Data
  SAVE_FAILED: 'Failed to save data. Please try again.',
  DELETE_FAILED: 'Failed to delete. Please try again.',
  LOAD_FAILED: 'Failed to load data. Please try again.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN: 'Welcome back!',
  LOGOUT: 'You have been logged out successfully.',
  REGISTER: 'Account created successfully. Please log in.',
  PASSWORD_RESET: 'Password reset email sent. Please check your inbox.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  
  // Data
  SAVED: 'Data saved successfully.',
  DELETED: 'Deleted successfully.',
  UPLOADED: 'File uploaded successfully.',
  EXPORTED: 'Data exported successfully.',
  
  // Sessions
  SESSION_CREATED: 'Test session created successfully.',
  SESSION_STARTED: 'Test session started.',
  SESSION_COMPLETED: 'Test session completed successfully.',
  
  // Reports
  REPORT_GENERATED: 'Report generated successfully.',
  REPORT_APPROVED: 'Report approved successfully.',
} as const

// Validation rules
export const VALIDATION_RULES = {
  // Text
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  NOTES_MAX_LENGTH: 5000,
  
  // Numbers
  VOLTAGE_MIN: 0,
  VOLTAGE_MAX: 10000,
  CURRENT_MIN: 0,
  CURRENT_MAX: 5000,
  TEMPERATURE_MIN: -50,
  TEMPERATURE_MAX: 200,
  HUMIDITY_MIN: 0,
  HUMIDITY_MAX: 100,
  
  // Password
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
} as const

// Display labels
export const DISPLAY_LABELS = {
  // User roles
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.ENGINEER]: 'Engineer',
  [USER_ROLES.VIEWER]: 'Viewer',
  
  // Device types
  [DEVICE_TYPES.DISCONNECT_SWITCH]: 'Disconnect Switch',
  [DEVICE_TYPES.FUSE_COMBINATION]: 'Fuse Combination Unit',
  [DEVICE_TYPES.SWITCH_DISCONNECTOR]: 'Switch Disconnector',
  [DEVICE_TYPES.CIRCUIT_BREAKER]: 'Circuit Breaker',
  [DEVICE_TYPES.LOAD_BREAK_SWITCH]: 'Load Break Switch',
  
  // Test session status
  [TEST_SESSION_STATUS.DRAFT]: 'Draft',
  [TEST_SESSION_STATUS.IN_PROGRESS]: 'In Progress',
  [TEST_SESSION_STATUS.COMPLETED]: 'Completed',
  [TEST_SESSION_STATUS.FAILED]: 'Failed',
  [TEST_SESSION_STATUS.CANCELLED]: 'Cancelled',
  
  // Measurement types
  [MEASUREMENT_TYPES.NORMAL_OPERATION]: 'Normal Operation',
  [MEASUREMENT_TYPES.FAULT_CONDITION]: 'Fault Condition',
  [MEASUREMENT_TYPES.TRANSIENT_RESPONSE]: 'Transient Response',
  [MEASUREMENT_TYPES.CALIBRATION]: 'Calibration',
  [MEASUREMENT_TYPES.VERIFICATION]: 'Verification',
  
  // Testing standards
  [TESTING_STANDARDS.IEC_60947_3]: 'IEC 60947-3',
  [TESTING_STANDARDS.UL_98B]: 'UL 98B',
  [TESTING_STANDARDS.IEC_62271_100]: 'IEC 62271-100',
  [TESTING_STANDARDS.ANSI_C37_06]: 'ANSI C37.06',
} as const