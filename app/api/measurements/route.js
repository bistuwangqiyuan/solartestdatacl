import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/measurements - Get measurements with filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const measurementType = searchParams.get('measurement_type')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('order_by') || 'sequence_number'
    const orderDirection = searchParams.get('order_direction') || 'asc'

    if (!sessionId) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAMETER', message: 'session_id parameter is required' } },
        { status: 400 }
      )
    }

    let query = supabase
      .from('test_measurements')
      .select('*')
      .eq('session_id', sessionId)
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1)

    if (measurementType) {
      const validTypes = ['normal', 'calibration', 'verification']
      if (validTypes.includes(measurementType)) {
        query = query.eq('measurement_type', measurementType)
      }
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch measurements' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      meta: {
        total: count,
        offset,
        limit,
        session_id: sessionId
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

// POST /api/measurements - Add new measurement
export async function POST(request) {
  try {
    const body = await request.json()
    
    // Basic validation
    const requiredFields = ['session_id', 'voltage', 'current']
    const missingFields = requiredFields.filter(field => body[field] === undefined || body[field] === null)
    
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

    // Validate session exists
    const { data: session, error: sessionError } = await supabase
      .from('test_sessions')
      .select('id')
      .eq('id', body.session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: { code: 'INVALID_SESSION', message: 'Test session not found' } },
        { status: 400 }
      )
    }

    // Validate measurement type
    const validMeasurementTypes = ['normal', 'calibration', 'verification']
    if (body.measurement_type && !validMeasurementTypes.includes(body.measurement_type)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid measurement_type. Must be one of: ${validMeasurementTypes.join(', ')}`,
            details: { valid_types: validMeasurementTypes }
          }
        },
        { status: 400 }
      )
    }

    // Get next sequence number
    const { data: lastMeasurement, error: sequenceError } = await supabase
      .from('test_measurements')
      .select('sequence_number')
      .eq('session_id', body.session_id)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single()

    let nextSequenceNumber = 1
    if (!sequenceError && lastMeasurement) {
      nextSequenceNumber = lastMeasurement.sequence_number + 1
    }

    // Prepare measurement data
    const measurementData = {
      session_id: body.session_id,
      voltage: parseFloat(body.voltage),
      current: parseFloat(body.current),
      resistance: body.resistance ? parseFloat(body.resistance) : null,
      temperature: body.temperature ? parseFloat(body.temperature) : null,
      timestamp: body.timestamp || new Date().toISOString(),
      sequence_number: body.sequence_number || nextSequenceNumber,
      measurement_type: body.measurement_type || 'normal',
      raw_data: body.raw_data || null
    }

    // Validate numeric values
    if (isNaN(measurementData.voltage) || isNaN(measurementData.current)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Voltage and current must be valid numbers' } },
        { status: 400 }
      )
    }

    // Insert measurement
    const { data, error } = await supabase
      .from('test_measurements')
      .insert(measurementData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to create measurement' } },
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