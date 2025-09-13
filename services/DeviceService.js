import { supabase } from '@/lib/supabase'

export class DeviceService {
    static async getAllDevices(filters = {}) {
        let query = supabase
            .from('devices')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        // Apply filters
        if (filters.manufacturer) {
            query = query.eq('manufacturer', filters.manufacturer)
        }

        if (filters.device_type) {
            query = query.eq('device_type', filters.device_type)
        }

        if (filters.standards) {
            query = query.overlaps('testing_standard', filters.standards)
        }

        if (filters.search) {
            query = query.or(
                `device_name.ilike.%${filters.search}%,model_number.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`
            )
        }

        // Pagination
        if (filters.page && filters.limit) {
            const from = (filters.page - 1) * filters.limit
            const to = from + filters.limit - 1
            query = query.range(from, to)
        }

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Failed to fetch devices: ${error.message}`)
        }

        return { data: data || [], count: count || 0 }
    }

    static async getDeviceById(id) {
        const { data, error } = await supabase
            .from('devices')
            .select(`
                *,
                created_by_user:users!created_by(full_name, email),
                test_sessions(
                    id,
                    session_name,
                    session_status,
                    testing_standard,
                    started_at,
                    completed_at,
                    test_engineer:users!test_engineer_id(full_name)
                )
            `)
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Device not found')
            }
            throw new Error(`Failed to fetch device: ${error.message}`)
        }

        return data
    }

    static async createDevice(deviceData) {
        // Check for duplicate serial number
        if (deviceData.serial_number) {
            const { data: existing } = await supabase
                .from('devices')
                .select('id')
                .eq('serial_number', deviceData.serial_number)
                .single()

            if (existing) {
                throw new Error('Serial number already exists')
            }
        }

        const { data, error } = await supabase
            .from('devices')
            .insert(deviceData)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create device: ${error.message}`)
        }

        return data
    }

    static async updateDevice(id, updates) {
        // Get existing device
        const existing = await this.getDeviceById(id)

        // Check for duplicate serial number if changed
        if (updates.serial_number && updates.serial_number !== existing.serial_number) {
            const { data: duplicate } = await supabase
                .from('devices')
                .select('id')
                .eq('serial_number', updates.serial_number)
                .neq('id', id)
                .single()

            if (duplicate) {
                throw new Error('Serial number already exists')
            }
        }

        const { data, error } = await supabase
            .from('devices')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update device: ${error.message}`)
        }

        return data
    }

    static async deleteDevice(id) {
        // Check if device has test sessions
        const { count } = await supabase
            .from('test_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('device_id', id)

        if (count > 0) {
            // Soft delete - just mark as inactive
            const { data, error } = await supabase
                .from('devices')
                .update({ is_active: false })
                .eq('id', id)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to deactivate device: ${error.message}`)
            }

            return { ...data, deleted: false, message: 'Device deactivated (has test sessions)' }
        } else {
            // Hard delete - no test sessions
            const { error } = await supabase
                .from('devices')
                .delete()
                .eq('id', id)

            if (error) {
                throw new Error(`Failed to delete device: ${error.message}`)
            }

            return { deleted: true, message: 'Device deleted successfully' }
        }
    }

    static async getDeviceStatistics(deviceId) {
        // Get test session statistics
        const { data: sessions, error: sessionsError } = await supabase
            .from('test_sessions')
            .select('id, session_status, started_at, completed_at')
            .eq('device_id', deviceId)

        if (sessionsError) {
            throw new Error(`Failed to fetch device statistics: ${sessionsError.message}`)
        }

        // Calculate statistics
        const totalSessions = sessions.length
        const completedSessions = sessions.filter(s => s.session_status === 'completed').length
        const failedSessions = sessions.filter(s => s.session_status === 'failed').length
        const inProgressSessions = sessions.filter(s => s.session_status === 'in_progress').length

        // Get measurement statistics
        const sessionIds = sessions.map(s => s.id)
        const { data: measurements, error: measurementsError } = await supabase
            .from('test_measurements')
            .select('pass_fail')
            .in('test_session_id', sessionIds)

        if (measurementsError) {
            throw new Error(`Failed to fetch measurement statistics: ${measurementsError.message}`)
        }

        const totalMeasurements = measurements.length
        const passedMeasurements = measurements.filter(m => m.pass_fail === true).length
        const failedMeasurements = measurements.filter(m => m.pass_fail === false).length

        return {
            totalSessions,
            completedSessions,
            failedSessions,
            inProgressSessions,
            totalMeasurements,
            passedMeasurements,
            failedMeasurements,
            passRate: totalMeasurements > 0 ? (passedMeasurements / totalMeasurements * 100).toFixed(1) : 0,
            completionRate: totalSessions > 0 ? (completedSessions / totalSessions * 100).toFixed(1) : 0
        }
    }

    static async searchDevices(searchTerm) {
        const { data, error } = await supabase
            .from('devices')
            .select('id, device_name, manufacturer, model_number, serial_number')
            .eq('is_active', true)
            .or(
                `device_name.ilike.%${searchTerm}%,model_number.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`
            )
            .limit(10)

        if (error) {
            throw new Error(`Failed to search devices: ${error.message}`)
        }

        return data || []
    }

    static async getDevicesByManufacturer() {
        const { data, error } = await supabase
            .from('devices')
            .select('manufacturer')
            .eq('is_active', true)

        if (error) {
            throw new Error(`Failed to fetch manufacturers: ${error.message}`)
        }

        // Get unique manufacturers and count
        const manufacturerCount = {}
        data?.forEach(device => {
            manufacturerCount[device.manufacturer] = (manufacturerCount[device.manufacturer] || 0) + 1
        })

        return Object.entries(manufacturerCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
    }
}