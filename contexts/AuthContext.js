'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, USER_ROLES } from '../lib/supabase'

const AuthContext = createContext({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
  resetPassword: () => {},
  updateProfile: () => {},
  hasRole: () => false,
  hasPermission: () => false,
  isAdmin: () => false,
  isManager: () => false,
  isEngineer: () => false,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // Create profile if it doesn't exist
        await createUserProfile(userId)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createUserProfile = async (userId) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userData.user?.email,
          full_name: userData.user?.user_metadata?.full_name || '',
          role: USER_ROLES.VIEWER, // Default role
        })
        .select()
        .single()

      if (!error) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
    }
  }

  const signIn = async (email, password) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.user) {
        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id)
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email, password, fullName, role = USER_ROLES.VIEWER) => {
    try {
      setIsLoading(true)
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (authError) return { data: null, error: authError }

      if (authData.user) {
        // Create user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email,
            full_name: fullName,
            role,
            is_active: true,
          }])
          .select()
          .single()

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }
      }

      return { data: authData, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (!error) {
        setUser(null)
        setProfile(null)
      }
      return { error }
    } catch (error) {
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (!error) {
        setProfile(data)
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const hasRole = (requiredRole) => {
    if (!profile) return false
    
    const roleHierarchy = [USER_ROLES.VIEWER, USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN]
    const userLevel = roleHierarchy.indexOf(profile.role)
    const requiredLevel = roleHierarchy.indexOf(requiredRole)
    
    return userLevel >= requiredLevel
  }

  const hasPermission = (permission) => {
    if (!profile) return false
    
    const permissions = {
      // View permissions
      'view_dashboard': [USER_ROLES.VIEWER, USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      'view_devices': [USER_ROLES.VIEWER, USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      'view_test_sessions': [USER_ROLES.VIEWER, USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      'view_measurements': [USER_ROLES.VIEWER, USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      'view_reports': [USER_ROLES.VIEWER, USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      
      // Create permissions
      'create_devices': [USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      'create_test_sessions': [USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      'import_excel': [USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      
      // Update permissions
      'edit_devices': [USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      'edit_test_sessions': [USER_ROLES.ENGINEER, USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      'approve_sessions': [USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      
      // Delete permissions
      'delete_devices': [USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      'delete_test_sessions': [USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      
      // Admin permissions
      'manage_users': [USER_ROLES.ADMIN],
      'view_audit_logs': [USER_ROLES.MANAGER, USER_ROLES.ADMIN],
      'manage_system_settings': [USER_ROLES.ADMIN],
      'generate_compliance_reports': [USER_ROLES.MANAGER, USER_ROLES.ADMIN],
    }
    
    const allowedRoles = permissions[permission] || []
    return allowedRoles.includes(profile.role)
  }

  const isAdmin = () => profile?.role === USER_ROLES.ADMIN
  const isManager = () => hasRole(USER_ROLES.MANAGER)
  const isEngineer = () => hasRole(USER_ROLES.ENGINEER)

  const value = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    hasRole,
    hasPermission,
    isAdmin,
    isManager,
    isEngineer,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}