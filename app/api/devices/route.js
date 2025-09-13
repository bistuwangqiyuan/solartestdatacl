import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
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
            .from('devices')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
        
        // Apply filters
        const manufacturer = searchParams.get('manufacturer')
        if (manufacturer) {
            query = query.eq('manufacturer', manufacturer)
        }
        
        const deviceType = searchParams.get('device_type')
        if (deviceType) {
            query = query.eq('device_type', deviceType)
        }
        
        const search = searchParams.get('search')
        if (search) {
            query = query.or(
                `device_name.ilike.%${search}%,model_number.ilike.%${search}%,serial_number.ilike.%${search}%`
            )
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
        console.error('Error fetching devices:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch devices' } },
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
        if (!body.device_name || !body.device_type || !body.manufacturer || !body.model_number) {
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
        
        const validatedData = body
        
        // Check for duplicate serial number
        if (validatedData.serial_number) {
            const { data: existing } = await supabase
                .from('devices')
                .select('id')
                .eq('serial_number', validatedData.serial_number)
                .single()
            
            if (existing) {
                return NextResponse.json(
                    { error: { code: 'DUPLICATE_ENTRY', message: 'Serial number already exists' } },
                    { status: 409 }
                )
            }
        }
        
        // Create device
        const { data, error } = await supabase
            .from('devices')
            .insert({
                ...validatedData,
                created_by: user.id
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
                table_name: 'devices',
                record_id: data.id,
                new_values: data
            })
        
        return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
        console.error('Error creating device:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to create device' } },
            { status: 500 }
        )
    }
}