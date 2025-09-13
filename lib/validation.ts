// Data validation schemas using Zod

import { z } from 'zod'
import { 
  UserRole, 
  DeviceType, 
  TestSessionStatus, 
  MeasurementType, 
  TestingStandard 
} from '@/types/database'

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'manager', 'engineer', 'viewer'] as const),
  department: z.string().optional().nullable(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number').optional().nullable(),
  is_active: z.boolean().default(true),
  last_login: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const userCreateSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_login: true,
}).extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
})

export const userUpdateSchema = userSchema.partial().omit({
  id: true,
  email: true,
  created_at: true,
})

// Device validation schemas
export const deviceSchema = z.object({
  id: z.string().uuid(),
  device_name: z.string().min(3, 'Device name must be at least 3 characters'),
  device_type: z.enum(['disconnect_switch', 'fuse_combination', 'switch_disconnector', 'circuit_breaker', 'load_break_switch'] as const),
  manufacturer: z.string().min(2, 'Manufacturer name required'),
  model_number: z.string().min(1, 'Model number required'),
  serial_number: z.string().optional().nullable(),
  rated_voltage: z.number().positive('Voltage must be positive').max(10000, 'Voltage exceeds maximum'),
  rated_current: z.number().positive('Current must be positive').max(5000, 'Current exceeds maximum'),
  rated_power: z.number().positive('Power must be positive').optional().nullable(),
  testing_standard: z.array(z.enum(['IEC_60947_3', 'UL_98B', 'IEC_62271_100', 'ANSI_C37_06'] as const))
    .min(1, 'At least one testing standard required'),
  specifications: z.record(z.any()).optional().nullable(),
  barcode: z.string().optional().nullable(),
  qr_code: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const deviceCreateSchema = deviceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const deviceUpdateSchema = deviceSchema.partial().omit({
  id: true,
  created_at: true,
  created_by: true,
})

// Test Session validation schemas
export const testSessionSchema = z.object({
  id: z.string().uuid(),
  session_name: z.string().min(3, 'Session name must be at least 3 characters'),
  device_id: z.string().uuid('Invalid device ID'),
  testing_standard: z.enum(['IEC_60947_3', 'UL_98B', 'IEC_62271_100', 'ANSI_C37_06'] as const),
  session_status: z.enum(['draft', 'in_progress', 'completed', 'failed', 'cancelled'] as const),
  test_engineer_id: z.string().uuid('Invalid engineer ID'),
  quality_reviewer_id: z.string().uuid().optional().nullable(),
  test_conditions: z.object({
    temperature: z.number().min(-50).max(200).optional(),
    humidity: z.number().min(0).max(100).optional(),
    pressure: z.number().positive().optional(),
    altitude: z.number().optional(),
  }).passthrough().optional().nullable(),
  test_parameters: z.object({
    voltage_range: z.tuple([z.number(), z.number()]).optional(),
    current_range: z.tuple([z.number(), z.number()]).optional(),
    test_duration: z.number().positive().optional(),
    sampling_rate: z.number().positive().optional(),
  }).passthrough().optional().nullable(),
  started_at: z.string().datetime().optional().nullable(),
  completed_at: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000, 'Notes too long').optional().nullable(),
  compliance_approved: z.boolean().default(false),
  approved_by: z.string().uuid().optional().nullable(),
  approved_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const testSessionCreateSchema = testSessionSchema.omit({
  id: true,
  session_status: true,
  test_engineer_id: true,
  started_at: true,
  completed_at: true,
  compliance_approved: true,
  approved_by: true,
  approved_at: true,
  created_at: true,
  updated_at: true,
})

export const testSessionUpdateSchema = testSessionSchema.partial().omit({
  id: true,
  device_id: true,
  test_engineer_id: true,
  created_at: true,
})

// Measurement validation schemas
export const measurementSchema = z.object({
  id: z.string().uuid(),
  test_session_id: z.string().uuid('Invalid session ID'),
  measurement_timestamp: z.string().datetime(),
  measurement_type: z.enum(['normal_operation', 'fault_condition', 'transient_response', 'calibration', 'verification'] as const),
  voltage: z.number().min(0).max(10000).optional().nullable(),
  current: z.number().min(0).max(5000).optional().nullable(),
  resistance: z.number().min(0).optional().nullable(),
  power: z.number().min(0).optional().nullable(),
  frequency: z.number().min(0).max(1000).optional().nullable(),
  phase_angle: z.number().min(-360).max(360).optional().nullable(),
  temperature: z.number().min(-273.15).max(1000).optional().nullable(),
  humidity: z.number().min(0).max(100).optional().nullable(),
  pass_fail: z.boolean().optional().nullable(),
  deviation_percentage: z.number().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  raw_data: z.record(z.any()).optional().nullable(),
  created_at: z.string().datetime(),
})

export const measurementCreateSchema = measurementSchema.omit({
  id: true,
  test_session_id: true,
  measurement_timestamp: true,
  created_at: true,
}).refine(
  (data) => data.voltage !== null || data.current !== null,
  'At least voltage or current must be provided'
)

export const measurementBulkCreateSchema = z.object({
  test_session_id: z.string().uuid(),
  measurements: z.array(measurementCreateSchema).min(1, 'At least one measurement required'),
})

// Excel import validation schemas
export const excelImportSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  original_filename: z.string(),
  file_size: z.number().positive().max(10485760, 'File size exceeds 10MB limit'),
  uploaded_by: z.string().uuid(),
  test_session_id: z.string().uuid().optional().nullable(),
  rows_imported: z.number().int().min(0),
  rows_failed: z.number().int().min(0),
  import_status: z.enum(['processing', 'completed', 'failed'] as const),
  error_details: z.string().optional().nullable(),
  file_path: z.string().optional().nullable(),
  created_at: z.string().datetime(),
  processed_at: z.string().datetime().optional().nullable(),
})

// Report validation schemas
export const reportGenerateSchema = z.object({
  test_session_ids: z.array(z.string().uuid()).min(1, 'At least one session required'),
  report_type: z.enum(['full_compliance', 'summary', 'certificate'] as const),
  testing_standard: z.enum(['IEC_60947_3', 'UL_98B', 'IEC_62271_100', 'ANSI_C37_06'] as const),
  template_id: z.string().uuid().optional(),
  include_charts: z.boolean().default(true),
  include_raw_data: z.boolean().default(false),
})

// Authentication validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number').optional(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const updatePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

// Helper functions for validation
export function validateEmail(email: string): boolean {
  try {
    z.string().email().parse(email)
    return true
  } catch {
    return false
  }
}

export function validateUUID(uuid: string): boolean {
  try {
    z.string().uuid().parse(uuid)
    return true
  } catch {
    return false
  }
}

export function validateNumber(value: any, min?: number, max?: number): boolean {
  try {
    let schema = z.number()
    if (min !== undefined) schema = schema.min(min)
    if (max !== undefined) schema = schema.max(max)
    schema.parse(value)
    return true
  } catch {
    return false
  }
}

// Custom error formatter
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return errors
}

// Validation middleware for API routes
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: formatZodErrors(error),
        }
      }
      throw error
    }
  }
}