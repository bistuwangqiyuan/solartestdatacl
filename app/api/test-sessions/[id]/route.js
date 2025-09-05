import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/test-sessions/[id] - Get a specific test session with measurements
export async function GET(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const includeMeasurements = searchParams.get('include_measurements') === 'true'

    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAMETER', message: 'Test session ID is required' } },
        { status: 400 }
      )
    }

    let query = supabase
      .from('test_sessions')
      .select(`
        *,
        devices!inner(
          id, model_number, manufacturer, voltage_rating, current_rating, device_type
        ),
        users!inner(
          id, full_name, email
        )
      `)
      .eq('id', id)
      .single()

    const { data, error } = await query

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Test session not found' } },
          { status: 404 }
        )
      }
      
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch test session' } },
        { status: 500 }
      )
    }

    // Get measurements if requested
    let measurements = []
    if (includeMeasurements) {
      const { data: measurementData, error: measurementError } = await supabase
        .from('test_measurements')
        .select('*')
        .eq('session_id', id)
        .order('sequence_number', { ascending: true })

      if (measurementError) {
        console.error('Measurement fetch error:', measurementError)
      } else {
        measurements = measurementData || []
      }
    }

    return NextResponse.json({ 
      data: {
        ...data,
        measurements: measurements
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

// PUT /api/test-sessions/[id] - Update a test session
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAMETER', message: 'Test session ID is required' } },
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

    // Prepare update data
    const updateData = {}
    const allowedFields = [
      'session_name', 'test_conditions', 'status', 'notes', 'summary_stats'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // Add completion timestamp if status is being set to completed
    if (body.status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: { code: 'NO_UPDATES', message: 'No valid fields to update' } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('test_sessions')
      .update(updateData)
      .eq('id', id)
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
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Test session not found' } },
          { status: 404 }
        )
      }
      
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update test session' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
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

// DELETE /api/test-sessions/[id] - Delete a test session
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAMETER', message: 'Test session ID is required' } },
        { status: 400 }
      )
    }

    // Delete associated measurements first
    const { error: measurementError } = await supabase
      .from('test_measurements')
      .delete()
      .eq('session_id', id)

    if (measurementError) {
      console.error('Database error deleting measurements:', measurementError)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to delete test measurements' } },
        { status: 500 }
      )
    }

    // Delete the test session
    const { error } = await supabase
      .from('test_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to delete test session' } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Test session deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}