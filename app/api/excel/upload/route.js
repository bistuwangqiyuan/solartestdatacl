import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST /api/excel/upload - Upload and process Excel file
export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const sessionId = formData.get('session_id')

    if (!file) {
      return NextResponse.json(
        { error: { code: 'MISSING_FILE', message: 'No file provided' } },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: { code: 'MISSING_SESSION_ID', message: 'Session ID is required' } },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: { 
            code: 'INVALID_FILE_TYPE', 
            message: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed',
            details: { allowed_types: ['.xlsx', '.xls', '.csv'] }
          } 
        },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: { 
            code: 'FILE_TOO_LARGE', 
            message: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
            details: { max_size_mb: maxSize / (1024 * 1024), file_size_mb: file.size / (1024 * 1024) }
          } 
        },
        { status: 400 }
      )
    }

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('test_sessions')
      .select('id, device_id, user_id, session_name')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: { code: 'INVALID_SESSION', message: 'Test session not found' } },
        { status: 400 }
      )
    }

    // Parse Excel/CSV file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null })

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: { code: 'EMPTY_FILE', message: 'Excel file contains no data' } },
        { status: 400 }
      )
    }

    // Validate and transform data
    const measurements = []
    const errors = []
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNumber = i + 2 // Excel rows start at 1, plus header row
      
      try {
        // Expected columns (flexible mapping)
        const voltage = parseFloat(row.voltage || row.Voltage || row.V || row['电压'] || 0)
        const current = parseFloat(row.current || row.Current || row.I || row.A || row['电流'] || 0)
        const resistance = parseFloat(row.resistance || row.Resistance || row.R || row['电阻'] || null)
        const temperature = parseFloat(row.temperature || row.Temperature || row.T || row['温度'] || null)
        
        // Parse timestamp - try multiple formats
        let timestamp = new Date()
        if (row.timestamp || row.Timestamp || row.time || row.Time || row['时间']) {
          const timeValue = row.timestamp || row.Timestamp || row.time || row.Time || row['时间']
          timestamp = new Date(timeValue)
          
          if (isNaN(timestamp.getTime())) {
            // Try Excel date format
            if (typeof timeValue === 'number') {
              // Excel date serial number
              timestamp = new Date((timeValue - 25569) * 86400 * 1000)
            } else {
              timestamp = new Date() // Fallback to current time
            }
          }
        }

        // Validate required fields
        if (isNaN(voltage) || isNaN(current)) {
          errors.push({
            row: rowNumber,
            message: 'Invalid or missing voltage/current values',
            data: { voltage, current }
          })
          continue
        }

        measurements.push({
          session_id: sessionId,
          voltage: voltage,
          current: current,
          resistance: isNaN(resistance) ? null : resistance,
          temperature: isNaN(temperature) ? null : temperature,
          timestamp: timestamp.toISOString(),
          sequence_number: i + 1,
          measurement_type: 'normal',
          raw_data: row
        })
      } catch (err) {
        errors.push({
          row: rowNumber,
          message: `Error processing row: ${err.message}`,
          data: row
        })
      }
    }

    // If too many errors, reject the file
    if (errors.length > jsonData.length * 0.1) { // More than 10% errors
      return NextResponse.json(
        { 
          error: { 
            code: 'TOO_MANY_ERRORS', 
            message: 'Too many validation errors in the file',
            details: { 
              total_rows: jsonData.length,
              error_count: errors.length,
              errors: errors.slice(0, 10) // Return first 10 errors
            }
          } 
        },
        { status: 400 }
      )
    }

    if (measurements.length === 0) {
      return NextResponse.json(
        { 
          error: { 
            code: 'NO_VALID_DATA', 
            message: 'No valid measurement data found in file',
            details: { errors: errors.slice(0, 10) }
          } 
        },
        { status: 400 }
      )
    }

    // Store file in Supabase Storage
    const fileName = `${sessionId}_${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('excel-files')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        metadata: {
          session_id: sessionId,
          original_name: file.name,
          uploaded_at: new Date().toISOString()
        }
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // Continue without storing the file - data is more important
    }

    // Insert measurements into database
    const { data: insertedData, error: insertError } = await supabase
      .from('test_measurements')
      .insert(measurements)
      .select('id')

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to insert measurement data' } },
        { status: 500 }
      )
    }

    // Update session with file info and summary stats
    const summaryStats = {
      total_measurements: measurements.length,
      avg_voltage: measurements.reduce((sum, m) => sum + m.voltage, 0) / measurements.length,
      avg_current: measurements.reduce((sum, m) => sum + m.current, 0) / measurements.length,
      min_voltage: Math.min(...measurements.map(m => m.voltage)),
      max_voltage: Math.max(...measurements.map(m => m.voltage)),
      min_current: Math.min(...measurements.map(m => m.current)),
      max_current: Math.max(...measurements.map(m => m.current)),
      processed_at: new Date().toISOString(),
      validation_errors: errors.length
    }

    const { error: updateError } = await supabase
      .from('test_sessions')
      .update({
        excel_file_path: uploadData?.path || null,
        summary_stats: summaryStats,
        status: 'completed'
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Session update error:', updateError)
      // Data is inserted successfully, so this is not critical
    }

    return NextResponse.json({
      data: {
        session_id: sessionId,
        measurements_imported: measurements.length,
        total_rows_processed: jsonData.length,
        validation_errors: errors.length,
        file_path: uploadData?.path,
        summary_stats: summaryStats
      },
      warnings: errors.length > 0 ? {
        message: `${errors.length} rows had validation errors`,
        errors: errors.slice(0, 5) // Return first 5 errors as examples
      } : null
    })

  } catch (error) {
    console.error('Excel upload error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process Excel file' } },
      { status: 500 }
    )
  }
}