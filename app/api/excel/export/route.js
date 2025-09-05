import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/excel/export - Export test session data to Excel
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const format = searchParams.get('format') || 'xlsx'

    if (!sessionId) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAMETER', message: 'session_id parameter is required' } },
        { status: 400 }
      )
    }

    // Validate format
    const validFormats = ['xlsx', 'csv']
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: { code: 'INVALID_FORMAT', message: 'Format must be xlsx or csv' } },
        { status: 400 }
      )
    }

    // Get test session details
    const { data: session, error: sessionError } = await supabase
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
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: { code: 'SESSION_NOT_FOUND', message: 'Test session not found' } },
        { status: 404 }
      )
    }

    // Get measurements
    const { data: measurements, error: measurementError } = await supabase
      .from('test_measurements')
      .select('*')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true })

    if (measurementError) {
      console.error('Measurement fetch error:', measurementError)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch measurements' } },
        { status: 500 }
      )
    }

    if (!measurements || measurements.length === 0) {
      return NextResponse.json(
        { error: { code: 'NO_DATA', message: 'No measurement data found for this session' } },
        { status: 404 }
      )
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    // Session Information Sheet
    const sessionInfo = [
      ['Session Information', ''],
      ['Session Name', session.session_name],
      ['Device Model', session.devices.model_number],
      ['Manufacturer', session.devices.manufacturer],
      ['Device Type', session.devices.device_type],
      ['Voltage Rating', `${session.devices.voltage_rating}V`],
      ['Current Rating', `${session.devices.current_rating}A`],
      ['Test Engineer', session.users.full_name],
      ['Started At', new Date(session.started_at).toLocaleString()],
      ['Completed At', session.completed_at ? new Date(session.completed_at).toLocaleString() : 'In Progress'],
      ['Status', session.status],
      ['Total Measurements', measurements.length],
      [''],
      ['Test Conditions', ''],
      ...(session.test_conditions ? Object.entries(session.test_conditions).map(([key, value]) => [key, value]) : []),
      [''],
      ['Summary Statistics', ''],
      ...(session.summary_stats ? Object.entries(session.summary_stats).map(([key, value]) => [key, typeof value === 'number' ? value.toFixed(4) : value]) : [])
    ]

    const sessionInfoSheet = XLSX.utils.aoa_to_sheet(sessionInfo)
    XLSX.utils.book_append_sheet(workbook, sessionInfoSheet, 'Session Info')

    // Measurements Data Sheet
    const measurementHeaders = [
      'Sequence',
      'Timestamp',
      'Voltage (V)',
      'Current (A)',
      'Resistance (Ω)',
      'Temperature (°C)',
      'Type',
      'Notes'
    ]

    const measurementData = measurements.map(m => [
      m.sequence_number,
      new Date(m.timestamp).toLocaleString(),
      m.voltage,
      m.current,
      m.resistance || '',
      m.temperature || '',
      m.measurement_type,
      m.raw_data?.notes || ''
    ])

    const measurementSheet = XLSX.utils.aoa_to_sheet([measurementHeaders, ...measurementData])

    // Auto-size columns
    const columnWidths = [
      { wch: 10 }, // Sequence
      { wch: 20 }, // Timestamp
      { wch: 12 }, // Voltage
      { wch: 12 }, // Current
      { wch: 15 }, // Resistance
      { wch: 15 }, // Temperature
      { wch: 12 }, // Type
      { wch: 30 }  // Notes
    ]
    measurementSheet['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(workbook, measurementSheet, 'Measurements')

    // Analysis Sheet (if we have enough data points)
    if (measurements.length > 1) {
      const voltages = measurements.map(m => m.voltage).filter(v => !isNaN(v))
      const currents = measurements.map(m => m.current).filter(c => !isNaN(c))
      
      const analysisData = [
        ['Statistical Analysis', ''],
        ['Voltage Statistics', ''],
        ['Average Voltage', voltages.length > 0 ? (voltages.reduce((a, b) => a + b, 0) / voltages.length).toFixed(4) : 'N/A'],
        ['Min Voltage', voltages.length > 0 ? Math.min(...voltages).toFixed(4) : 'N/A'],
        ['Max Voltage', voltages.length > 0 ? Math.max(...voltages).toFixed(4) : 'N/A'],
        ['Voltage Range', voltages.length > 0 ? (Math.max(...voltages) - Math.min(...voltages)).toFixed(4) : 'N/A'],
        [''],
        ['Current Statistics', ''],
        ['Average Current', currents.length > 0 ? (currents.reduce((a, b) => a + b, 0) / currents.length).toFixed(4) : 'N/A'],
        ['Min Current', currents.length > 0 ? Math.min(...currents).toFixed(4) : 'N/A'],
        ['Max Current', currents.length > 0 ? Math.max(...currents).toFixed(4) : 'N/A'],
        ['Current Range', currents.length > 0 ? (Math.max(...currents) - Math.min(...currents)).toFixed(4) : 'N/A']
      ]

      const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData)
      XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analysis')
    }

    // Generate file
    let buffer
    let contentType
    let fileName

    if (format === 'csv') {
      // For CSV, export only the measurements sheet
      buffer = XLSX.write(workbook, { bookType: 'csv', type: 'buffer', sheet: 'Measurements' })
      contentType = 'text/csv'
      fileName = `${session.session_name.replace(/[^a-zA-Z0-9]/g, '_')}_measurements.csv`
    } else {
      // For Excel, export all sheets
      buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      fileName = `${session.session_name.replace(/[^a-zA-Z0-9]/g, '_')}_complete_report.xlsx`
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to export data' } },
      { status: 500 }
    )
  }
}