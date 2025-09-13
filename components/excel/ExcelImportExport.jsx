'use client'

import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import * as XLSX from 'xlsx'

export function ExcelImportExport({ sessionId, onImportComplete }) {
    const { user } = useAuth()
    const fileInputRef = useRef(null)
    const [isImporting, setIsImporting] = useState(false)
    const [importProgress, setImportProgress] = useState(0)
    const [importError, setImportError] = useState(null)
    const [importSummary, setImportSummary] = useState(null)

    const handleFileSelect = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        setIsImporting(true)
        setImportError(null)
        setImportSummary(null)
        setImportProgress(0)

        try {
            // Check file size
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size exceeds 10MB limit')
            }

            // Check file type
            const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
            if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
                throw new Error('Invalid file type. Please upload an Excel file (.xlsx or .xls)')
            }

            // Read file
            const data = await readExcelFile(file)
            
            // Validate data
            const validationResult = validateExcelData(data)
            if (!validationResult.isValid) {
                throw new Error(validationResult.errors.join(', '))
            }

            // Upload file to Supabase Storage
            const fileName = `${sessionId}_${Date.now()}_${file.name}`
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('excel-imports')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Create import log
            const { data: importLog, error: logError } = await supabase
                .from('excel_imports')
                .insert({
                    filename: fileName,
                    original_filename: file.name,
                    file_size: file.size,
                    uploaded_by: user.id,
                    test_session_id: sessionId,
                    import_status: 'processing',
                    file_path: uploadData.path
                })
                .select()
                .single()

            if (logError) throw logError

            // Process and import measurements
            const measurements = data.map((row, index) => ({
                test_session_id: sessionId,
                measurement_timestamp: parseExcelDate(row.timestamp || row.Timestamp || new Date()),
                voltage: parseFloat(row.voltage || row.Voltage || 0),
                current: parseFloat(row.current || row.Current || 0),
                resistance: parseFloat(row.resistance || row.Resistance || 0),
                power: parseFloat(row.power || row.Power || 0),
                temperature: parseFloat(row.temperature || row.Temperature || 25),
                humidity: parseFloat(row.humidity || row.Humidity || 50),
                measurement_type: determineMeasurementType(row),
                pass_fail: determinePassFail(row),
                raw_data: row,
                notes: row.notes || row.Notes || null
            }))

            // Batch insert measurements
            const batchSize = 100
            let successCount = 0
            let failCount = 0

            for (let i = 0; i < measurements.length; i += batchSize) {
                const batch = measurements.slice(i, i + batchSize)
                setImportProgress(Math.round((i / measurements.length) * 100))

                const { error: insertError } = await supabase
                    .from('test_measurements')
                    .insert(batch)

                if (insertError) {
                    console.error('Batch insert error:', insertError)
                    failCount += batch.length
                } else {
                    successCount += batch.length
                }
            }

            // Update import log
            await supabase
                .from('excel_imports')
                .update({
                    rows_imported: successCount,
                    rows_failed: failCount,
                    import_status: 'completed',
                    processed_at: new Date().toISOString()
                })
                .eq('id', importLog.id)

            setImportSummary({
                totalRows: measurements.length,
                successCount,
                failCount
            })

            setImportProgress(100)

            // Notify parent component
            if (onImportComplete) {
                onImportComplete()
            }

        } catch (error) {
            console.error('Import error:', error)
            setImportError(error.message)
        } finally {
            setIsImporting(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const readExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (e) => {
                try {
                    const data = e.target.result
                    const workbook = XLSX.read(data, { type: 'array' })
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]
                    const jsonData = XLSX.utils.sheet_to_json(worksheet)
                    resolve(jsonData)
                } catch (error) {
                    reject(error)
                }
            }

            reader.onerror = reject
            reader.readAsArrayBuffer(file)
        })
    }

    const validateExcelData = (data) => {
        const errors = []

        if (!Array.isArray(data) || data.length === 0) {
            errors.push('No data found in Excel file')
            return { isValid: false, errors }
        }

        // Check required columns
        const requiredColumns = ['voltage', 'current']
        const firstRow = data[0]
        const columns = Object.keys(firstRow).map(col => col.toLowerCase())

        requiredColumns.forEach(col => {
            if (!columns.some(c => c.includes(col))) {
                errors.push(`Missing required column: ${col}`)
            }
        })

        // Validate data types
        data.forEach((row, index) => {
            const voltage = parseFloat(row.voltage || row.Voltage)
            const current = parseFloat(row.current || row.Current)

            if (isNaN(voltage)) {
                errors.push(`Invalid voltage value at row ${index + 2}`)
            }
            if (isNaN(current)) {
                errors.push(`Invalid current value at row ${index + 2}`)
            }

            // Stop after 10 errors
            if (errors.length > 10) {
                errors.push('...and more errors')
                return false
            }
        })

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    const parseExcelDate = (value) => {
        if (!value) return new Date()
        
        // If it's already a date object
        if (value instanceof Date) return value
        
        // If it's an Excel serial number
        if (typeof value === 'number') {
            const date = new Date((value - 25569) * 86400 * 1000)
            return date
        }
        
        // Try to parse as string
        try {
            return new Date(value)
        } catch {
            return new Date()
        }
    }

    const determineMeasurementType = (row) => {
        // Logic to determine measurement type based on data
        if (row.type) return row.type.toLowerCase()
        if (row.measurement_type) return row.measurement_type.toLowerCase()
        return 'normal_operation'
    }

    const determinePassFail = (row) => {
        // Logic to determine pass/fail status
        if ('pass_fail' in row) return row.pass_fail
        if ('pass' in row) return row.pass
        if ('status' in row) return row.status.toLowerCase() === 'pass'
        
        // Default logic based on values
        const voltage = parseFloat(row.voltage || row.Voltage || 0)
        const current = parseFloat(row.current || row.Current || 0)
        
        // Example criteria (adjust based on actual requirements)
        return voltage > 0 && current > 0
    }

    const handleExportTemplate = () => {
        // Create template Excel file
        const templateData = [
            {
                timestamp: new Date().toISOString(),
                voltage: 220.5,
                current: 10.2,
                resistance: 21.6,
                power: 2245.1,
                temperature: 25.0,
                humidity: 50.0,
                measurement_type: 'normal_operation',
                pass_fail: true,
                notes: 'Sample measurement data'
            }
        ]

        const worksheet = XLSX.utils.json_to_sheet(templateData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Measurements')

        // Add column widths
        const cols = [
            { wch: 20 }, // timestamp
            { wch: 10 }, // voltage
            { wch: 10 }, // current
            { wch: 10 }, // resistance
            { wch: 10 }, // power
            { wch: 12 }, // temperature
            { wch: 10 }, // humidity
            { wch: 18 }, // measurement_type
            { wch: 10 }, // pass_fail
            { wch: 30 }  // notes
        ]
        worksheet['!cols'] = cols

        // Download file
        XLSX.writeFile(workbook, 'measurement_template.xlsx')
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Excel Data Import</h3>
                
                {/* File Upload */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Excel File
                        </label>
                        <div className="flex items-center space-x-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                disabled={isImporting}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                onClick={handleExportTemplate}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Download Template
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Supports .xlsx and .xls files up to 10MB
                        </p>
                    </div>

                    {/* Progress Bar */}
                    {isImporting && (
                        <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Importing measurements...</span>
                                <span>{importProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${importProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {importError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                            <div className="flex">
                                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm">
                                    <p className="font-medium">Import Error</p>
                                    <p>{importError}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Summary */}
                    {importSummary && (
                        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                            <div className="flex">
                                <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm">
                                    <p className="font-medium">Import Completed</p>
                                    <p>Total rows: {importSummary.totalRows}</p>
                                    <p>Successfully imported: {importSummary.successCount}</p>
                                    {importSummary.failCount > 0 && (
                                        <p>Failed: {importSummary.failCount}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}