import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create Supabase client for server-side
function createServerSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: false
            }
        }
    )
}

export async function GET(request, { params }) {
    try {
        const supabase = createServerSupabaseClient()
        const { id } = params
        
        const { data, error } = await supabase
            .from('devices')
            .select(`
                *,
                created_by_user:users!created_by(full_name, email),
                test_sessions(
                    id,
                    session_name,
                    session_status,
                    started_at,
                    completed_at
                )
            `)
            .eq('id', id)
            .single()
        
        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: { code: 'DEVICE_NOT_FOUND', message: 'Device not found' } },
                    { status: 404 }
                )
            }
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: error.message } },
                { status: 500 }
            )
        }
        
        return NextResponse.json({ data })
    } catch (error) {
        console.error('Error fetching device:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch device' } },
            { status: 500 }
        )
    }
}

export async function PUT(request, { params }) {
    try {
        const supabase = createServerSupabaseClient()
        const { id } = params
        
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            )
        }
        
        // Check permission
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
        
        if (!profile || !['admin', 'manager', 'engineer'].includes(profile.role)) {
            return NextResponse.json(
                { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            )
        }
        
        // Get existing device
        const { data: existing } = await supabase
            .from('devices')
            .select('*')
            .eq('id', id)
            .single()
        
        if (!existing) {
            return NextResponse.json(
                { error: { code: 'DEVICE_NOT_FOUND', message: 'Device not found' } },
                { status: 404 }
            )
        }
        
        // Parse request body
        const body = await request.json()
        const validatedData = body
        
        // Check for duplicate serial number if changed
        if (validatedData.serial_number && validatedData.serial_number !== existing.serial_number) {
            const { data: duplicate } = await supabase
                .from('devices')
                .select('id')
                .eq('serial_number', validatedData.serial_number)
                .neq('id', id)
                .single()
            
            if (duplicate) {
                return NextResponse.json(
                    { error: { code: 'DUPLICATE_ENTRY', message: 'Serial number already exists' } },
                    { status: 409 }
                )
            }
        }
        
        // Update device
        const { data, error } = await supabase
            .from('devices')
            .update(validatedData)
            .eq('id', id)
            .select()
            .single()
        
        if (error) {
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: error.message } },
                { status: 500 }
            )
        }
        
        // Create audit log
        await supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action: 'update',
                table_name: 'devices',
                record_id: id,
                old_values: existing,
                new_values: data
            })
        
        return NextResponse.json({ data })
    } catch (error) {
        console.error('Error updating device:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to update device' } },
            { status: 500 }
        )
    }
}

export async function DELETE(request, { params }) {
    try {
        const supabase = createServerSupabaseClient()
        const { id } = params
        
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            )
        }
        
        // Check permission
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
        
        if (!profile || !['admin', 'manager'].includes(profile.role)) {
            return NextResponse.json(
                { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            )
        }
        
        // Get existing device
        const { data: existing } = await supabase
            .from('devices')
            .select('*')
            .eq('id', id)
            .single()
        
        if (!existing) {
            return NextResponse.json(
                { error: { code: 'DEVICE_NOT_FOUND', message: 'Device not found' } },
                { status: 404 }
            )
        }
        
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
                return NextResponse.json(
                    { error: { code: 'DATABASE_ERROR', message: error.message } },
                    { status: 500 }
                )
            }
            
            // Create audit log
            await supabase
                .from('audit_logs')
                .insert({
                    user_id: user.id,
                    action: 'update',
                    table_name: 'devices',
                    record_id: id,
                    old_values: existing,
                    new_values: data
                })
            
            return NextResponse.json({ 
                data: { message: 'Device deactivated (has test sessions)' } 
            })
        } else {
            // Hard delete - no test sessions
            const { error } = await supabase
                .from('devices')
                .delete()
                .eq('id', id)
            
            if (error) {
                return NextResponse.json(
                    { error: { code: 'DATABASE_ERROR', message: error.message } },
                    { status: 500 }
                )
            }
            
            // Create audit log
            await supabase
                .from('audit_logs')
                .insert({
                    user_id: user.id,
                    action: 'delete',
                    table_name: 'devices',
                    record_id: id,
                    old_values: existing
                })
            
            return NextResponse.json({ 
                data: { message: 'Device deleted successfully' } 
            })
        }
    } catch (error) {
        console.error('Error deleting device:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete device' } },
            { status: 500 }
        )
    }
}