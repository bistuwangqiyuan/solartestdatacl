// Supabase client configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database type definitions (to be expanded)
export const DEVICE_TYPES = {
  DISCONNECT_SWITCH: 'disconnect_switch',
  FUSE_COMBINATION: 'fuse_combination',
  SWITCH_DISCONNECTOR: 'switch_disconnector'
}

export const TEST_SESSION_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ENGINEER: 'engineer',
  VIEWER: 'viewer'
}

export const MEASUREMENT_TYPES = {
  NORMAL: 'normal',
  FAULT: 'fault',
  TRANSIENT: 'transient'
}