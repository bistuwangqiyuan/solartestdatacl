// Excel parsing utilities

import * as XLSX from 'xlsx'
import { 
  ExcelParseResult, 
  ExcelMeasurementData, 
  ExcelMetadata, 
  ExcelParseError, 
  ExcelFormat,
  ExcelColumnMapping,
  ExcelProcessingOptions,
  EXCEL_FORMATS,
  isExcelMeasurementData
} from '@/types/excel'
import { parseISO, isValid } from 'date-fns'
import { z } from 'zod'

// Excel date conversion utility
function excelDateToJSDate(excelDate: number): Date {
  // Excel dates are stored as numbers representing days since 1900-01-01
  // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
  const EXCEL_EPOCH = new Date(1899, 11, 30) // December 30, 1899
  const msPerDay = 24 * 60 * 60 * 1000
  
  return new Date(EXCEL_EPOCH.getTime() + excelDate * msPerDay)
}

// Parse various date formats
function parseDate(value: any): Date | null {
  if (!value) return null
  
  // If it's already a Date object
  if (value instanceof Date) {
    return isValid(value) ? value : null
  }
  
  // If it's a number (Excel date)
  if (typeof value === 'number') {
    const date = excelDateToJSDate(value)
    return isValid(date) ? date : null
  }
  
  // If it's a string
  if (typeof value === 'string') {
    // Try ISO format first
    const isoDate = parseISO(value)
    if (isValid(isoDate)) return isoDate
    
    // Try common date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    ]
    
    for (const format of formats) {
      if (format.test(value)) {
        const date = new Date(value)
        if (isValid(date)) return date
      }
    }
  }
  
  return null
}

// Parse numeric value
function parseNumber(value: any, options?: ExcelProcessingOptions): number | null {
  if (value === null || value === undefined || value === '') return null
  
  // If it's already a number
  if (typeof value === 'number') {
    return isNaN(value) ? null : value
  }
  
  // If it's a string
  if (typeof value === 'string') {
    let cleanValue = value.trim()
    
    // Handle different decimal/thousand separators
    if (options?.decimal_separator === ',') {
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.')
    } else if (options?.thousand_separator) {
      cleanValue = cleanValue.replace(new RegExp(`\\${options.thousand_separator}`, 'g'), '')
    }
    
    // Remove any non-numeric characters except decimal point and minus
    cleanValue = cleanValue.replace(/[^\d.-]/g, '')
    
    const num = parseFloat(cleanValue)
    return isNaN(num) ? null : num
  }
  
  return null
}

// Parse boolean value
function parseBoolean(value: any): boolean | null {
  if (value === null || value === undefined) return null
  
  if (typeof value === 'boolean') return value
  
  if (typeof value === 'string') {
    const lowercaseValue = value.toLowerCase().trim()
    
    if (['true', 'yes', 'y', '1', 'pass', 'passed'].includes(lowercaseValue)) {
      return true
    }
    
    if (['false', 'no', 'n', '0', 'fail', 'failed'].includes(lowercaseValue)) {
      return false
    }
  }
  
  if (typeof value === 'number') {
    return value !== 0
  }
  
  return null
}

// Get cell value with type conversion
function getCellValue(
  row: any,
  mapping: ExcelColumnMapping,
  options?: ExcelProcessingOptions
): any {
  const rawValue = typeof mapping.source_column === 'number'
    ? row[mapping.source_column]
    : row[mapping.source_column]
  
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return mapping.required ? null : undefined
  }
  
  // Apply custom transform if provided
  if (mapping.transform) {
    return mapping.transform(rawValue)
  }
  
  // Type conversion
  switch (mapping.data_type) {
    case 'date':
      return parseDate(rawValue)
    
    case 'number':
      return parseNumber(rawValue, options)
    
    case 'boolean':
      return parseBoolean(rawValue)
    
    case 'string':
    default:
      return options?.trim_values !== false ? String(rawValue).trim() : String(rawValue)
  }
}

// Validate cell value
function validateCellValue(
  value: any,
  mapping: ExcelColumnMapping,
  row: number
): ExcelParseError | null {
  if (mapping.required && (value === null || value === undefined)) {
    return {
      row,
      column: String(mapping.source_column),
      value,
      message: `Required field is missing`,
      type: 'missing',
    }
  }
  
  if (value !== null && value !== undefined && mapping.validation) {
    const { min, max, pattern, values } = mapping.validation
    
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        return {
          row,
          column: String(mapping.source_column),
          value,
          message: `Value ${value} is less than minimum ${min}`,
          type: 'range',
        }
      }
      
      if (max !== undefined && value > max) {
        return {
          row,
          column: String(mapping.source_column),
          value,
          message: `Value ${value} exceeds maximum ${max}`,
          type: 'range',
        }
      }
    }
    
    if (typeof value === 'string' && pattern) {
      const regex = new RegExp(pattern)
      if (!regex.test(value)) {
        return {
          row,
          column: String(mapping.source_column),
          value,
          message: `Value does not match required pattern`,
          type: 'format',
        }
      }
    }
    
    if (values && !values.includes(value)) {
      return {
        row,
        column: String(mapping.source_column),
        value,
        message: `Value must be one of: ${values.join(', ')}`,
        type: 'validation',
      }
    }
  }
  
  return null
}

// Detect Excel format from headers
function detectFormat(headers: string[]): ExcelFormat | null {
  const normalizedHeaders = headers.map(h => h?.toLowerCase().trim() || '')
  
  // Check each predefined format
  for (const [formatName, format] of Object.entries(EXCEL_FORMATS)) {
    const requiredHeaders = format.columns
      .filter(col => col.required)
      .map(col => typeof col.source_column === 'string' ? col.source_column.toLowerCase() : null)
      .filter(Boolean)
    
    const hasAllRequired = requiredHeaders.every(required => 
      normalizedHeaders.some(header => header.includes(required!))
    )
    
    if (hasAllRequired) {
      return format
    }
  }
  
  // Try to auto-detect based on common patterns
  const hasVoltage = normalizedHeaders.some(h => h.includes('volt') || h.includes('v'))
  const hasCurrent = normalizedHeaders.some(h => h.includes('current') || h.includes('amp') || h.includes('a'))
  const hasTimestamp = normalizedHeaders.some(h => h.includes('time') || h.includes('date'))
  
  if (hasVoltage && hasCurrent && hasTimestamp) {
    return EXCEL_FORMATS.standard_v1
  }
  
  return null
}

// Main Excel parsing function
export async function parseExcelFile(
  file: File | ArrayBuffer,
  options: ExcelProcessingOptions = {}
): Promise<ExcelParseResult> {
  try {
    // Read the file
    const data = file instanceof File ? await file.arrayBuffer() : file
    const workbook = XLSX.read(data, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
    })
    
    // Get the sheet
    const sheetName = options.sheet_name || workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    if (!worksheet) {
      return {
        success: false,
        errors: [{
          row: 0,
          message: `Sheet "${sheetName}" not found`,
          type: 'format',
        }],
      }
    }
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd',
    })
    
    if (jsonData.length === 0) {
      return {
        success: false,
        errors: [{
          row: 0,
          message: 'No data found in sheet',
          type: 'format',
        }],
      }
    }
    
    // Extract headers
    const headerRow = options.header_row || 0
    const headers = (jsonData[headerRow] as any[]).map(h => String(h || ''))
    
    // Detect or use specified format
    let format: ExcelFormat | null = null
    
    if (options.format && EXCEL_FORMATS[options.format]) {
      format = EXCEL_FORMATS[options.format]
    } else {
      format = detectFormat(headers)
    }
    
    if (!format) {
      return {
        success: false,
        errors: [{
          row: 0,
          message: 'Unable to detect Excel format. Please ensure the file contains valid measurement data.',
          type: 'format',
        }],
      }
    }
    
    // Parse data rows
    const dataStartRow = options.data_start_row || headerRow + 1
    const maxRows = options.max_rows || Infinity
    const measurements: ExcelMeasurementData[] = []
    const errors: ExcelParseError[] = []
    
    let rowCount = 0
    
    for (let i = dataStartRow; i < jsonData.length && rowCount < maxRows; i++) {
      const row = jsonData[i] as any[]
      
      // Skip empty rows if configured
      if (options.skip_empty_rows !== false && row.every(cell => !cell)) {
        continue
      }
      
      rowCount++
      
      const measurement: any = {
        _raw: row,
        _row: i + 1, // Excel rows are 1-based
      }
      
      let hasError = false
      
      // Map columns to fields
      for (const mapping of format.columns) {
        const value = getCellValue(row, mapping, options)
        const error = validateCellValue(value, mapping, i + 1)
        
        if (error) {
          errors.push(error)
          hasError = true
        } else if (value !== undefined) {
          measurement[mapping.target_field] = value
        }
      }
      
      // Add to results if valid
      if (!hasError && isExcelMeasurementData(measurement)) {
        measurements.push(measurement)
      }
    }
    
    // Extract metadata
    const metadata: ExcelMetadata = {
      filename: file instanceof File ? file.name : 'unknown',
      file_size: file instanceof File ? file.size : data.byteLength,
      total_rows: jsonData.length - dataStartRow,
      valid_rows: measurements.length,
      invalid_rows: errors.length,
      headers,
      detected_format: format,
    }
    
    // Try to extract device and test info from the file
    // This would need to be customized based on specific file formats
    
    return {
      success: measurements.length > 0,
      data: measurements,
      metadata,
      errors: errors.length > 0 ? errors : undefined,
    }
    
  } catch (error) {
    return {
      success: false,
      errors: [{
        row: 0,
        message: error instanceof Error ? error.message : 'Failed to parse Excel file',
        type: 'format',
      }],
    }
  }
}

// Validate Excel file before full parsing
export async function validateExcelFile(
  file: File,
  options: ExcelProcessingOptions = {}
): Promise<{
  isValid: boolean
  errors: string[]
  preview?: ExcelMeasurementData[]
}> {
  const errors: string[] = []
  
  // Check file size
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`)
  }
  
  // Check file type
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ]
  
  if (!validTypes.includes(file.type)) {
    errors.push('Invalid file type. Please upload an Excel file (.xlsx or .xls)')
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors }
  }
  
  // Try to parse a preview
  try {
    const result = await parseExcelFile(file, {
      ...options,
      max_rows: 10, // Only parse first 10 rows for preview
    })
    
    if (!result.success) {
      return {
        isValid: false,
        errors: result.errors?.map(e => e.message) || ['Failed to parse file'],
      }
    }
    
    return {
      isValid: true,
      errors: [],
      preview: result.data,
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Failed to validate file'],
    }
  }
}

// Convert measurements to Excel format
export function measurementsToExcelData(
  measurements: any[],
  format: ExcelFormat
): any[][] {
  // Create header row
  const headers = format.columns.map(col => 
    typeof col.source_column === 'string' ? col.source_column : `Column ${col.source_column}`
  )
  
  // Create data rows
  const rows = measurements.map(measurement => {
    const row: any[] = []
    
    format.columns.forEach(col => {
      const value = measurement[col.target_field]
      
      // Format value based on type
      if (value === null || value === undefined) {
        row.push('')
      } else if (col.data_type === 'date' && value instanceof Date) {
        row.push(value.toISOString())
      } else if (col.data_type === 'boolean') {
        row.push(value ? 'Pass' : 'Fail')
      } else {
        row.push(value)
      }
    })
    
    return row
  })
  
  return [headers, ...rows]
}

// Export measurements to Excel file
export function exportToExcel(
  data: any[][],
  filename: string = 'export.xlsx'
): void {
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  
  // Generate and download file
  XLSX.writeFile(wb, filename)
}