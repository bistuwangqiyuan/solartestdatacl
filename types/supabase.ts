// Generated Supabase types
// This file would normally be auto-generated from your Supabase schema
// For now, we'll manually define the types based on our database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'manager' | 'engineer' | 'viewer'
          department: string | null
          phone: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'admin' | 'manager' | 'engineer' | 'viewer'
          department?: string | null
          phone?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'manager' | 'engineer' | 'viewer'
          department?: string | null
          phone?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          device_name: string
          device_type: 'disconnect_switch' | 'fuse_combination' | 'switch_disconnector' | 'circuit_breaker' | 'load_break_switch'
          manufacturer: string
          model_number: string
          serial_number: string | null
          rated_voltage: number
          rated_current: number
          rated_power: number | null
          testing_standard: ('IEC_60947_3' | 'UL_98B' | 'IEC_62271_100' | 'ANSI_C37_06')[]
          specifications: Json | null
          barcode: string | null
          qr_code: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device_name: string
          device_type: 'disconnect_switch' | 'fuse_combination' | 'switch_disconnector' | 'circuit_breaker' | 'load_break_switch'
          manufacturer: string
          model_number: string
          serial_number?: string | null
          rated_voltage: number
          rated_current: number
          rated_power?: number | null
          testing_standard?: ('IEC_60947_3' | 'UL_98B' | 'IEC_62271_100' | 'ANSI_C37_06')[]
          specifications?: Json | null
          barcode?: string | null
          qr_code?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_name?: string
          device_type?: 'disconnect_switch' | 'fuse_combination' | 'switch_disconnector' | 'circuit_breaker' | 'load_break_switch'
          manufacturer?: string
          model_number?: string
          serial_number?: string | null
          rated_voltage?: number
          rated_current?: number
          rated_power?: number | null
          testing_standard?: ('IEC_60947_3' | 'UL_98B' | 'IEC_62271_100' | 'ANSI_C37_06')[]
          specifications?: Json | null
          barcode?: string | null
          qr_code?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      test_sessions: {
        Row: {
          id: string
          session_name: string
          device_id: string
          testing_standard: 'IEC_60947_3' | 'UL_98B' | 'IEC_62271_100' | 'ANSI_C37_06'
          session_status: 'draft' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
          test_engineer_id: string
          quality_reviewer_id: string | null
          test_conditions: Json | null
          test_parameters: Json | null
          started_at: string | null
          completed_at: string | null
          notes: string | null
          compliance_approved: boolean
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_name: string
          device_id: string
          testing_standard: 'IEC_60947_3' | 'UL_98B' | 'IEC_62271_100' | 'ANSI_C37_06'
          session_status?: 'draft' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
          test_engineer_id: string
          quality_reviewer_id?: string | null
          test_conditions?: Json | null
          test_parameters?: Json | null
          started_at?: string | null
          completed_at?: string | null
          notes?: string | null
          compliance_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_name?: string
          device_id?: string
          testing_standard?: 'IEC_60947_3' | 'UL_98B' | 'IEC_62271_100' | 'ANSI_C37_06'
          session_status?: 'draft' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
          test_engineer_id?: string
          quality_reviewer_id?: string | null
          test_conditions?: Json | null
          test_parameters?: Json | null
          started_at?: string | null
          completed_at?: string | null
          notes?: string | null
          compliance_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      test_measurements: {
        Row: {
          id: string
          test_session_id: string
          measurement_timestamp: string
          measurement_type: 'normal_operation' | 'fault_condition' | 'transient_response' | 'calibration' | 'verification'
          voltage: number | null
          current: number | null
          resistance: number | null
          power: number | null
          frequency: number | null
          phase_angle: number | null
          temperature: number | null
          humidity: number | null
          pass_fail: boolean | null
          deviation_percentage: number | null
          notes: string | null
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          test_session_id: string
          measurement_timestamp?: string
          measurement_type: 'normal_operation' | 'fault_condition' | 'transient_response' | 'calibration' | 'verification'
          voltage?: number | null
          current?: number | null
          resistance?: number | null
          power?: number | null
          frequency?: number | null
          phase_angle?: number | null
          temperature?: number | null
          humidity?: number | null
          pass_fail?: boolean | null
          deviation_percentage?: number | null
          notes?: string | null
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          test_session_id?: string
          measurement_timestamp?: string
          measurement_type?: 'normal_operation' | 'fault_condition' | 'transient_response' | 'calibration' | 'verification'
          voltage?: number | null
          current?: number | null
          resistance?: number | null
          power?: number | null
          frequency?: number | null
          phase_angle?: number | null
          temperature?: number | null
          humidity?: number | null
          pass_fail?: boolean | null
          deviation_percentage?: number | null
          notes?: string | null
          raw_data?: Json | null
          created_at?: string
        }
      }
      excel_imports: {
        Row: {
          id: string
          filename: string
          original_filename: string
          file_size: number
          uploaded_by: string
          test_session_id: string | null
          rows_imported: number
          rows_failed: number
          import_status: string
          error_details: string | null
          file_path: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          filename: string
          original_filename: string
          file_size: number
          uploaded_by: string
          test_session_id?: string | null
          rows_imported?: number
          rows_failed?: number
          import_status?: string
          error_details?: string | null
          file_path?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          filename?: string
          original_filename?: string
          file_size?: number
          uploaded_by?: string
          test_session_id?: string | null
          rows_imported?: number
          rows_failed?: number
          import_status?: string
          error_details?: string | null
          file_path?: string | null
          created_at?: string
          processed_at?: string | null
        }
      }
      compliance_reports: {
        Row: {
          id: string
          report_name: string
          test_session_id: string
          testing_standard: 'IEC_60947_3' | 'UL_98B' | 'IEC_62271_100' | 'ANSI_C37_06'
          report_type: string
          generated_by: string
          approved_by: string | null
          digital_signature: string | null
          report_data: Json
          file_path: string | null
          is_final: boolean
          created_at: string
          approved_at: string | null
        }
        Insert: {
          id?: string
          report_name: string
          test_session_id: string
          testing_standard: 'IEC_60947_3' | 'UL_98B' | 'IEC_62271_100' | 'ANSI_C37_06'
          report_type: string
          generated_by: string
          approved_by?: string | null
          digital_signature?: string | null
          report_data: Json
          file_path?: string | null
          is_final?: boolean
          created_at?: string
          approved_at?: string | null
        }
        Update: {
          id?: string
          report_name?: string
          test_session_id?: string
          testing_standard?: 'IEC_60947_3' | 'UL_98B' | 'IEC_62271_100' | 'ANSI_C37_06'
          report_type?: string
          generated_by?: string
          approved_by?: string | null
          digital_signature?: string | null
          report_data?: Json
          file_path?: string | null
          is_final?: boolean
          created_at?: string
          approved_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name?: string | null
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string | null
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          description: string | null
          is_encrypted: boolean
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          description?: string | null
          is_encrypted?: boolean
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          description?: string | null
          is_encrypted?: boolean
          updated_by?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      test_session_summary: {
        Row: {
          id: string
          session_name: string
          session_status: string
          testing_standard: string
          started_at: string | null
          completed_at: string | null
          device_name: string
          manufacturer: string
          model_number: string
          engineer_name: string
          reviewer_name: string | null
          measurement_count: number | null
          passed_count: number | null
          failed_count: number | null
        }
      }
      device_testing_history: {
        Row: {
          device_id: string
          device_name: string
          manufacturer: string
          model_number: string
          total_sessions: number | null
          completed_sessions: number | null
          failed_sessions: number | null
          last_test_date: string | null
          avg_test_duration_hours: number | null
        }
      }
      dashboard_stats: {
        Row: {
          total_devices: number | null
          total_sessions: number | null
          active_sessions: number | null
          sessions_last_24h: number | null
          total_measurements: number | null
          recent_imports: number | null
        }
      }
    }
    Functions: {
      get_test_session_stats: {
        Args: {
          session_id: string
        }
        Returns: {
          total_measurements: number
          passed_measurements: number
          failed_measurements: number
          avg_voltage: number
          avg_current: number
          min_voltage: number
          max_voltage: number
          min_current: number
          max_current: number
          test_duration: string
        }[]
      }
      validate_measurement: {
        Args: {
          voltage: number
          current: number
          device_id: string
        }
        Returns: boolean
      }
      refresh_dashboard_stats: {
        Args: {}
        Returns: void
      }
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'engineer' | 'viewer'
      device_type: 'disconnect_switch' | 'fuse_combination' | 'switch_disconnector' | 'circuit_breaker' | 'load_break_switch'
      test_session_status: 'draft' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
      measurement_type: 'normal_operation' | 'fault_condition' | 'transient_response' | 'calibration' | 'verification'
      testing_standard: 'IEC_60947_3' | 'UL_98B' | 'IEC_62271_100' | 'ANSI_C37_06'
    }
  }
}