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
            .from('test_sessions')
            .select(`
                *,
                device:devices(*),
                engineer:users!test_engineer_id(full_name, email),
                reviewer:users!quality_reviewer_id(full_name, email),
                test_measurements(
                    id,
                    measurement_timestamp,
                    measurement_type,
                    voltage,
                    current,
                    resistance,
                    pass_fail
                )
            `)
            .eq('id', id)
            .single()
        
        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: { code: 'SESSION_NOT_FOUND', message: 'Test session not found' } },
                    { status: 404 }
                )
            }
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: error.message } },
                { status: 500 }
            )
        }
        
        // Calculate statistics
        const measurements = data.test_measurements || []
        const stats = {
            total_measurements: measurements.length,
            passed_measurements: measurements.filter(m => m.pass_fail === true).length,
            failed_measurements: measurements.filter(m => m.pass_fail === false).length,
            pass_rate: measurements.length > 0 
                ? (measurements.filter(m => m.pass_fail === true).length / measurements.length * 100).toFixed(1)
                : 0
        }
        
        return NextResponse.json({ 
            data: {
                ...data,
                statistics: stats
            }
        })
    } catch (error) {
        console.error('Error fetching test session:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch test session' } },
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
        
        // Get existing session
        const { data: existing } = await supabase
            .from('test_sessions')
            .select('*, test_engineer_id')
            .eq('id', id)
            .single()
        
        if (!existing) {
            return NextResponse.json(
                { error: { code: 'SESSION_NOT_FOUND', message: 'Test session not found' } },
                { status: 404 }
            )
        }
        
        // Check permission
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
        
        const isOwner = existing.test_engineer_id === user.id
        const isManagerOrAdmin = profile && ['admin', 'manager'].includes(profile.role)
        
        if (!isOwner && !isManagerOrAdmin) {
            return NextResponse.json(
                { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            )
        }
        
        // Parse request body
        const body = await request.json()
        const updates = { ...body }
        
        // Handle status transitions
        if (body.session_status) {
            if (body.session_status === 'in_progress' && existing.session_status === 'draft') {
                updates.started_at = new Date().toISOString()
            } else if (['completed', 'failed'].includes(body.session_status) && existing.session_status === 'in_progress') {
                updates.completed_at = new Date().toISOString()
            }
        }
        
        // Update session
        const { data, error } = await supabase
            .from('test_sessions')
            .update(updates)
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
                table_name: 'test_sessions',
                record_id: id,
                old_values: existing,
                new_values: data
            })
        
        return NextResponse.json({ data })
    } catch (error) {
        console.error('Error updating test session:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to update test session' } },
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
        
        // Get existing session
        const { data: existing } = await supabase
            .from('test_sessions')
            .select('*')
            .eq('id', id)
            .single()
        
        if (!existing) {
            return NextResponse.json(
                { error: { code: 'SESSION_NOT_FOUND', message: 'Test session not found' } },
                { status: 404 }
            )
        }
        
        // Check if session can be deleted
        if (existing.session_status === 'completed' && existing.compliance_approved) {
            return NextResponse.json(
                { error: { code: 'CANNOT_DELETE', message: 'Cannot delete approved sessions' } },
                { status: 400 }
            )
        }
        
        // Delete session (cascade will delete measurements)
        const { error } = await supabase
            .from('test_sessions')
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
                table_name: 'test_sessions',
                record_id: id,
                old_values: existing
            })
        
        return NextResponse.json({ 
            data: { message: 'Test session deleted successfully' } 
        })
    } catch (error) {
        console.error('Error deleting test session:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete test session' } },
            { status: 500 }
        )
    }
}