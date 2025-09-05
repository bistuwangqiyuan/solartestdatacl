import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/devices - Get all devices with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const manufacturer = searchParams.get('manufacturer')
    const standards = searchParams.get('standards')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (manufacturer) {
      query = query.ilike('manufacturer', `%${manufacturer}%`)
    }

    if (standards) {
      const standardsArray = standards.split(',')
      query = query.overlaps('standards_compliance', standardsArray)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch devices' } },
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

// POST /api/devices - Create a new device
export async function POST(request) {
  try {
    const body = await request.json()
    
    // Basic validation
    const requiredFields = ['model_number', 'manufacturer', 'voltage_rating', 'current_rating', 'device_type']
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

    // Validate device type
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

    // Insert device
    const { data, error } = await supabase
      .from('devices')
      .insert({
        model_number: body.model_number,
        manufacturer: body.manufacturer,
        voltage_rating: parseFloat(body.voltage_rating),
        current_rating: parseFloat(body.current_rating),
        resistance_rating: body.resistance_rating ? parseFloat(body.resistance_rating) : null,
        device_type: body.device_type,
        standards_compliance: body.standards_compliance || [],
        specifications: body.specifications || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // Handle duplicate key errors
      if (error.code === '23505') {
        return NextResponse.json(
          { error: { code: 'DUPLICATE_ENTRY', message: 'Device with this model number already exists' } },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to create device' } },
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