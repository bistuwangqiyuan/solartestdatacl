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

export async function GET(request) {
    try {
        const supabase = createServerSupabaseClient()
        const { searchParams } = new URL(request.url)
        
        // Build query
        let query = supabase
            .from('test_sessions')
            .select(`
                *,
                device:devices(device_name, manufacturer, model_number),
                engineer:users!test_engineer_id(full_name, email),
                reviewer:users!quality_reviewer_id(full_name, email)
            `)
            .order('created_at', { ascending: false })
        
        // Apply filters
        const deviceId = searchParams.get('device_id')
        if (deviceId) {
            query = query.eq('device_id', deviceId)
        }
        
        const status = searchParams.get('status')
        if (status) {
            query = query.eq('session_status', status)
        }
        
        const engineerId = searchParams.get('engineer_id')
        if (engineerId) {
            query = query.eq('test_engineer_id', engineerId)
        }
        
        // Date range filter
        const dateFrom = searchParams.get('date_from')
        if (dateFrom) {
            query = query.gte('started_at', dateFrom)
        }
        
        const dateTo = searchParams.get('date_to')
        if (dateTo) {
            query = query.lte('started_at', dateTo)
        }
        
        // Pagination
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = (page - 1) * limit
        
        query = query.range(offset, offset + limit - 1)
        
        // Execute query
        const { data, error, count } = await query
        
        if (error) {
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: error.message } },
                { status: 500 }
            )
        }
        
        return NextResponse.json({
            data,
            meta: {
                total: count,
                page,
                limit,
                hasMore: count > offset + limit
            }
        })
    } catch (error) {
        console.error('Error fetching test sessions:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch test sessions' } },
            { status: 500 }
        )
    }
}

export async function POST(request) {
    try {
        const supabase = createServerSupabaseClient()
        
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
        
        // Parse request body
        const body = await request.json()
        
        // Basic validation
        if (!body.session_name || !body.device_id || !body.testing_standard) {
            return NextResponse.json(
                { 
                    error: { 
                        code: 'VALIDATION_ERROR', 
                        message: 'Missing required fields'
                    } 
                },
                { status: 400 }
            )
        }
        
        // Check if device exists
        const { data: device } = await supabase
            .from('devices')
            .select('id')
            .eq('id', body.device_id)
            .single()
        
        if (!device) {
            return NextResponse.json(
                { error: { code: 'DEVICE_NOT_FOUND', message: 'Device not found' } },
                { status: 404 }
            )
        }
        
        // Create test session
        const { data, error } = await supabase
            .from('test_sessions')
            .insert({
                session_name: body.session_name,
                device_id: body.device_id,
                testing_standard: body.testing_standard,
                test_engineer_id: user.id,
                session_status: 'draft',
                test_conditions: body.test_conditions || {},
                test_parameters: body.test_parameters || {},
                notes: body.notes
            })
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
                action: 'create',
                table_name: 'test_sessions',
                record_id: data.id,
                new_values: data
            })
        
        return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
        console.error('Error creating test session:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to create test session' } },
            { status: 500 }
        )
    }
}