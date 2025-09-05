import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/devices/[id] - Get a specific device
export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAMETER', message: 'Device ID is required' } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Device not found' } },
          { status: 404 }
        )
      }
      
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch device' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

// PUT /api/devices/[id] - Update a device
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAMETER', message: 'Device ID is required' } },
        { status: 400 }
      )
    }

    // Validate device type if provided
    if (body.device_type) {
      const validDeviceTypes = ['disconnect_switch', 'fuse_combination', 'switch_disconnector']
      if (!validDeviceTypes.includes(body.device_type)) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid device_type. Must be one of: ${validDeviceTypes.join(', ')}`,
              details: { valid_types: validDeviceTypes }
            }
          },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData = {}
    const allowedFields = [
      'model_number', 'manufacturer', 'voltage_rating', 'current_rating', 
      'resistance_rating', 'device_type', 'standards_compliance', 'specifications'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'voltage_rating' || field === 'current_rating') {
          updateData[field] = parseFloat(body[field])
        } else if (field === 'resistance_rating') {
          updateData[field] = body[field] ? parseFloat(body[field]) : null
        } else {
          updateData[field] = body[field]
        }
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: { code: 'NO_UPDATES', message: 'No valid fields to update' } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('devices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Device not found' } },
          { status: 404 }
        )
      }
      
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update device' } },
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

// DELETE /api/devices/[id] - Delete a device
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAMETER', message: 'Device ID is required' } },
        { status: 400 }
      )
    }

    // Check if device has associated test sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('test_sessions')
      .select('id')
      .eq('device_id', id)
      .limit(1)

    if (sessionError) {
      console.error('Database error checking sessions:', sessionError)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to check device dependencies' } },
        { status: 500 }
      )
    }

    if (sessions && sessions.length > 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'CANNOT_DELETE', 
            message: 'Cannot delete device with associated test sessions',
            details: { reason: 'has_test_sessions' }
          } 
        },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to delete device' } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Device deleted successfully' },
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