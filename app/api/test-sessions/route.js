import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/test-sessions - Get test sessions with filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('device_id')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeDevice = searchParams.get('include_device') === 'true'

    let query = supabase
      .from('test_sessions')
      .select(includeDevice ? `
        *,
        devices!inner(
          id, model_number, manufacturer, voltage_rating, current_rating, device_type
        )
      ` : '*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (deviceId) {
      query = query.eq('device_id', deviceId)
    }

    if (status) {
      const validStatuses = ['in_progress', 'completed', 'failed']
      if (validStatuses.includes(status)) {
        query = query.eq('status', status)
      }
    }

    if (dateFrom) {
      query = query.gte('started_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('started_at', dateTo)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch test sessions' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      meta: {
        total: count,
        offset,
        limit
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

// POST /api/test-sessions - Create a new test session
export async function POST(request) {
  try {
    const body = await request.json()
    
    // Basic validation
    const requiredFields = ['device_id', 'session_name', 'user_id']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: `Missing required fields: ${missingFields.join(', ')}`,
            details: { missing_fields: missingFields }
          } 
        },
        { status: 400 }
      )
    }

    // Validate device exists
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id')
      .eq('id', body.device_id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json(
        { error: { code: 'INVALID_DEVICE', message: 'Device not found' } },
        { status: 400 }
      )
    }

    // Validate user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', body.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: { code: 'INVALID_USER', message: 'User not found' } },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['in_progress', 'completed', 'failed']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
              details: { valid_statuses: validStatuses }
            }
          },
          { status: 400 }
        )
      }
    }

    // Insert test session
    const { data, error } = await supabase
      .from('test_sessions')
      .insert({
        device_id: body.device_id,
        user_id: body.user_id,
        session_name: body.session_name,
        test_conditions: body.test_conditions || {},
        status: body.status || 'in_progress',
        notes: body.notes || null,
        summary_stats: body.summary_stats || {}
      })
      .select(`
        *,
        devices!inner(
          id, model_number, manufacturer, voltage_rating, current_rating, device_type
        ),
        users!inner(
          id, full_name, email
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to create test session' } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data },
      { status: 201 }
    )
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Invalid JSON in request body' } },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}