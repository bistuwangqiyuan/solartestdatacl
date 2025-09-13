// Authentication helper functions

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { User } from '@/types/database'

// Create a Supabase client for server-side operations
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// Create a Supabase client with service role for admin operations
export function createServiceSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// Authentication error class
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// Authorization error class
export class AuthorizationError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

// Get the current user from Supabase auth
export async function getCurrentUser() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

// Get the current user's profile
export async function getCurrentUserProfile(): Promise<User | null> {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }
  
  const supabase = createServerSupabaseClient()
  
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error || !profile) {
    return null
  }
  
  return profile as User
}

// Check if user has a specific role
export async function hasRole(requiredRole: string): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  
  if (!profile) {
    return false
  }
  
  const roleHierarchy = ['viewer', 'engineer', 'manager', 'admin']
  const userLevel = roleHierarchy.indexOf(profile.role)
  const requiredLevel = roleHierarchy.indexOf(requiredRole)
  
  return userLevel >= requiredLevel
}

// Check if user has a specific permission
export async function hasPermission(permission: string): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  
  if (!profile) {
    return false
  }
  
  const permissions: Record<string, string[]> = {
    // View permissions
    'view_dashboard': ['viewer', 'engineer', 'manager', 'admin'],
    'view_devices': ['viewer', 'engineer', 'manager', 'admin'],
    'view_test_sessions': ['viewer', 'engineer', 'manager', 'admin'],
    'view_measurements': ['viewer', 'engineer', 'manager', 'admin'],
    'view_reports': ['viewer', 'engineer', 'manager', 'admin'],
    
    // Create permissions
    'create_devices': ['engineer', 'manager', 'admin'],
    'create_test_sessions': ['engineer', 'manager', 'admin'],
    'import_excel': ['engineer', 'manager', 'admin'],
    
    // Update permissions
    'edit_devices': ['engineer', 'manager', 'admin'],
    'edit_test_sessions': ['engineer', 'manager', 'admin'],
    'approve_sessions': ['manager', 'admin'],
    
    // Delete permissions
    'delete_devices': ['manager', 'admin'],
    'delete_test_sessions': ['manager', 'admin'],
    
    // Admin permissions
    'manage_users': ['admin'],
    'view_audit_logs': ['manager', 'admin'],
    'manage_system_settings': ['admin'],
    'generate_compliance_reports': ['manager', 'admin'],
  }
  
  const allowedRoles = permissions[permission] || []
  return allowedRoles.includes(profile.role)
}

// Require authentication middleware
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new AuthError('Authentication required', 'UNAUTHORIZED')
  }
  
  const profile = await getCurrentUserProfile()
  
  if (!profile) {
    throw new AuthError('User profile not found', 'PROFILE_NOT_FOUND')
  }
  
  if (!profile.is_active) {
    throw new AuthError('Account is disabled', 'ACCOUNT_DISABLED')
  }
  
  return { user, profile }
}

// Require specific role middleware
export async function requireRole(requiredRole: string) {
  const { user, profile } = await requireAuth()
  
  const hasRequiredRole = await hasRole(requiredRole)
  
  if (!hasRequiredRole) {
    throw new AuthorizationError(
      `Insufficient permissions: ${requiredRole} role required`,
      'INSUFFICIENT_PERMISSIONS'
    )
  }
  
  return { user, profile }
}

// Require specific permission middleware
export async function requirePermission(permission: string) {
  const { user, profile } = await requireAuth()
  
  const hasRequiredPermission = await hasPermission(permission)
  
  if (!hasRequiredPermission) {
    throw new AuthorizationError(
      `Permission denied: ${permission}`,
      'PERMISSION_DENIED'
    )
  }
  
  return { user, profile }
}

// Create session cookie
export function createSessionCookie(token: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    name: 'sb-auth-token',
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  }
}

// Clear session cookie
export function clearSessionCookie() {
  return {
    name: 'sb-auth-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  }
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Generate a secure random password
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*(),.?":{}|<>'
  
  const allChars = uppercase + lowercase + numbers + special
  
  let password = ''
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Create audit log entry
export async function createAuditLog(
  action: string,
  tableName?: string,
  recordId?: string,
  oldValues?: any,
  newValues?: any
) {
  const user = await getCurrentUser()
  const supabase = createServerSupabaseClient()
  
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: user?.id,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: null, // Would need to get from request
      user_agent: null, // Would need to get from request
    })
  
  if (error) {
    console.error('Failed to create audit log:', error)
  }
}