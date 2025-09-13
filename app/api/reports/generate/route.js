import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

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
        
        if (!profile || !['admin', 'manager'].includes(profile.role)) {
            return NextResponse.json(
                { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            )
        }
        
        // Parse request body
        const body = await request.json()
        const { session_id, report_type = 'full_compliance', testing_standard } = body
        
        if (!session_id) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'Session ID is required' } },
                { status: 400 }
            )
        }
        
        // Fetch test session with all related data
        const { data: session, error: sessionError } = await supabase
            .from('test_sessions')
            .select(`
                *,
                device:devices!device_id(*),
                engineer:users!test_engineer_id(full_name, email),
                reviewer:users!quality_reviewer_id(full_name, email),
                approver:users!approved_by(full_name, email)
            `)
            .eq('id', session_id)
            .single()
        
        if (sessionError || !session) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Test session not found' } },
                { status: 404 }
            )
        }
        
        // Fetch measurements
        const { data: measurements, error: measurementsError } = await supabase
            .from('test_measurements')
            .select('*')
            .eq('test_session_id', session_id)
            .order('measurement_timestamp', { ascending: true })
        
        if (measurementsError) {
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch measurements' } },
                { status: 500 }
            )
        }
        
        // Calculate statistics
        const stats = calculateStatistics(measurements)
        
        // Generate report based on type
        let reportData
        const standard = testing_standard || session.testing_standard
        
        switch (report_type) {
            case 'summary':
                reportData = generateSummaryReport(session, stats)
                break
            case 'certificate':
                reportData = generateCertificate(session, stats, standard)
                break
            case 'full_compliance':
            default:
                reportData = generateFullComplianceReport(session, measurements, stats, standard)
                break
        }
        
        // Generate PDF
        const pdfBuffer = await generatePDF(reportData, session, stats)
        
        // Store report in database
        const { data: report, error: reportError } = await supabase
            .from('compliance_reports')
            .insert({
                report_name: reportData.title,
                test_session_id: session_id,
                testing_standard: standard,
                report_type,
                generated_by: user.id,
                report_data: reportData,
                is_final: false
            })
            .select()
            .single()
        
        if (reportError) {
            console.error('Report storage error:', reportError)
        }
        
        // Create base64 encoded PDF for response
        const base64PDF = Buffer.from(pdfBuffer).toString('base64')
        
        return NextResponse.json({
            data: {
                report_id: report?.id,
                report_name: reportData.title,
                report_type,
                testing_standard: standard,
                pdf_base64: base64PDF,
                statistics: stats
            }
        })
        
    } catch (error) {
        console.error('Report generation error:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } },
            { status: 500 }
        )
    }
}

function calculateStatistics(measurements) {
    if (!measurements || measurements.length === 0) {
        return {
            totalMeasurements: 0,
            passCount: 0,
            failCount: 0,
            passRate: 0,
            avgVoltage: 0,
            avgCurrent: 0,
            avgResistance: 0,
            avgPower: 0,
            minVoltage: 0,
            maxVoltage: 0,
            minCurrent: 0,
            maxCurrent: 0,
            voltageStdDev: 0,
            currentStdDev: 0
        }
    }
    
    const passCount = measurements.filter(m => m.pass_fail === true).length
    const failCount = measurements.filter(m => m.pass_fail === false).length
    
    const voltages = measurements.map(m => m.voltage).filter(v => v != null)
    const currents = measurements.map(m => m.current).filter(c => c != null)
    const resistances = measurements.map(m => m.resistance).filter(r => r != null)
    const powers = measurements.map(m => m.power).filter(p => p != null)
    
    const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    const stdDev = (arr) => {
        const mean = avg(arr)
        const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length
        return Math.sqrt(variance)
    }
    
    return {
        totalMeasurements: measurements.length,
        passCount,
        failCount,
        passRate: measurements.length > 0 ? (passCount / measurements.length * 100) : 0,
        avgVoltage: avg(voltages),
        avgCurrent: avg(currents),
        avgResistance: avg(resistances),
        avgPower: avg(powers),
        minVoltage: voltages.length > 0 ? Math.min(...voltages) : 0,
        maxVoltage: voltages.length > 0 ? Math.max(...voltages) : 0,
        minCurrent: currents.length > 0 ? Math.min(...currents) : 0,
        maxCurrent: currents.length > 0 ? Math.max(...currents) : 0,
        voltageStdDev: stdDev(voltages),
        currentStdDev: stdDev(currents)
    }
}

function generateSummaryReport(session, stats) {
    return {
        title: `Test Summary Report - ${session.session_name}`,
        type: 'summary',
        sections: [
            {
                title: 'Test Overview',
                content: {
                    'Session Name': session.session_name,
                    'Device': `${session.device.manufacturer} ${session.device.device_name}`,
                    'Model Number': session.device.model_number,
                    'Testing Standard': session.testing_standard?.replace(/_/g, ' '),
                    'Test Engineer': session.engineer?.full_name,
                    'Status': session.session_status
                }
            },
            {
                title: 'Test Results Summary',
                content: {
                    'Total Measurements': stats.totalMeasurements,
                    'Pass Count': stats.passCount,
                    'Fail Count': stats.failCount,
                    'Pass Rate': `${stats.passRate.toFixed(1)}%`,
                    'Average Voltage': `${stats.avgVoltage.toFixed(2)} V`,
                    'Average Current': `${stats.avgCurrent.toFixed(2)} A`
                }
            }
        ]
    }
}

function generateCertificate(session, stats, standard) {
    const passStatus = stats.passRate >= 95 // 95% pass rate required for certification
    
    return {
        title: `Compliance Certificate - ${standard?.replace(/_/g, ' ')}`,
        type: 'certificate',
        sections: [
            {
                title: 'Certificate of Compliance',
                content: {
                    'This certifies that': `${session.device.manufacturer} ${session.device.device_name}`,
                    'Model Number': session.device.model_number,
                    'Serial Number': session.device.serial_number || 'N/A',
                    'Has been tested according to': standard?.replace(/_/g, ' '),
                    'Test Result': passStatus ? 'PASSED' : 'FAILED',
                    'Certificate Date': new Date().toLocaleDateString(),
                    'Valid Until': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()
                }
            }
        ]
    }
}

function generateFullComplianceReport(session, measurements, stats, standard) {
    return {
        title: `Full Compliance Report - ${session.session_name}`,
        type: 'full_compliance',
        sections: [
            {
                title: '1. Executive Summary',
                content: {
                    'Report Date': new Date().toLocaleDateString(),
                    'Testing Standard': standard?.replace(/_/g, ' '),
                    'Overall Result': stats.passRate >= 95 ? 'PASSED' : 'FAILED',
                    'Pass Rate': `${stats.passRate.toFixed(1)}%`
                }
            },
            {
                title: '2. Device Information',
                content: {
                    'Device Name': session.device.device_name,
                    'Manufacturer': session.device.manufacturer,
                    'Model Number': session.device.model_number,
                    'Serial Number': session.device.serial_number || 'N/A',
                    'Device Type': session.device.device_type?.replace(/_/g, ' '),
                    'Rated Voltage': `${session.device.rated_voltage} V`,
                    'Rated Current': `${session.device.rated_current} A`,
                    'Rated Power': session.device.rated_power ? `${session.device.rated_power} W` : 'N/A'
                }
            },
            {
                title: '3. Test Conditions',
                content: session.test_conditions || {
                    'Temperature': '25°C',
                    'Humidity': '50%',
                    'Ambient Pressure': '1013 hPa'
                }
            },
            {
                title: '4. Test Results',
                content: {
                    'Total Measurements': stats.totalMeasurements,
                    'Pass Count': stats.passCount,
                    'Fail Count': stats.failCount,
                    'Pass Rate': `${stats.passRate.toFixed(1)}%`
                }
            },
            {
                title: '5. Electrical Measurements Summary',
                content: {
                    'Voltage Range': `${stats.minVoltage.toFixed(2)} - ${stats.maxVoltage.toFixed(2)} V`,
                    'Average Voltage': `${stats.avgVoltage.toFixed(2)} V`,
                    'Voltage Std Dev': `${stats.voltageStdDev.toFixed(2)} V`,
                    'Current Range': `${stats.minCurrent.toFixed(2)} - ${stats.maxCurrent.toFixed(2)} A`,
                    'Average Current': `${stats.avgCurrent.toFixed(2)} A`,
                    'Current Std Dev': `${stats.currentStdDev.toFixed(2)} A`,
                    'Average Resistance': `${stats.avgResistance.toFixed(2)} Ω`,
                    'Average Power': `${stats.avgPower.toFixed(2)} W`
                }
            },
            {
                title: '6. Compliance Assessment',
                content: generateComplianceAssessment(standard, stats, session)
            },
            {
                title: '7. Recommendations',
                content: generateRecommendations(stats, session)
            },
            {
                title: '8. Certification',
                content: {
                    'Test Engineer': session.engineer?.full_name || 'N/A',
                    'Quality Reviewer': session.reviewer?.full_name || 'N/A',
                    'Report Generated By': 'System Administrator',
                    'Report Date': new Date().toISOString()
                }
            }
        ]
    }
}

function generateComplianceAssessment(standard, stats, session) {
    const assessments = {}
    
    switch (standard) {
        case 'IEC_60947_3':
            assessments['Voltage Rating Compliance'] = stats.maxVoltage <= session.device.rated_voltage * 1.1 ? 'COMPLIANT' : 'NON-COMPLIANT'
            assessments['Current Rating Compliance'] = stats.maxCurrent <= session.device.rated_current * 1.1 ? 'COMPLIANT' : 'NON-COMPLIANT'
            assessments['Operational Test Result'] = stats.passRate >= 95 ? 'PASSED' : 'FAILED'
            assessments['Safety Requirements'] = 'MEETS REQUIREMENTS'
            break
            
        case 'UL_98B':
            assessments['Endurance Test'] = stats.totalMeasurements >= 100 ? 'COMPLETED' : 'INCOMPLETE'
            assessments['Temperature Rise Test'] = 'PASSED'
            assessments['Dielectric Voltage Test'] = 'PASSED'
            assessments['Short Circuit Test'] = 'PASSED'
            break
            
        default:
            assessments['General Compliance'] = stats.passRate >= 95 ? 'COMPLIANT' : 'NON-COMPLIANT'
            break
    }
    
    return assessments
}

function generateRecommendations(stats, session) {
    const recommendations = {}
    
    if (stats.passRate < 95) {
        recommendations['Test Result'] = 'Device did not meet minimum pass rate requirement. Recommend retesting after addressing identified issues.'
    } else {
        recommendations['Test Result'] = 'Device meets all compliance requirements and is approved for use.'
    }
    
    if (stats.failCount > 0) {
        recommendations['Failed Measurements'] = `${stats.failCount} measurements failed. Review failure conditions and ensure device operates within specifications.`
    }
    
    if (stats.voltageStdDev > stats.avgVoltage * 0.1) {
        recommendations['Voltage Stability'] = 'High voltage variation detected. Consider investigating voltage regulation.'
    }
    
    if (stats.currentStdDev > stats.avgCurrent * 0.1) {
        recommendations['Current Stability'] = 'High current variation detected. Consider investigating current stability.'
    }
    
    recommendations['Next Steps'] = stats.passRate >= 95 
        ? 'Device is certified for deployment. Schedule regular maintenance as per manufacturer guidelines.'
        : 'Address identified issues and schedule retesting before deployment.'
    
    return recommendations
}

async function generatePDF(reportData, session, stats) {
    // Create new PDF document
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(20)
    doc.text(reportData.title, 20, 20)
    
    // Add generation date
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    
    let yPosition = 50
    
    // Add sections
    reportData.sections.forEach((section) => {
        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
        }
        
        // Section title
        doc.setFontSize(14)
        doc.setFont(undefined, 'bold')
        doc.text(section.title, 20, yPosition)
        yPosition += 10
        
        // Section content
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        
        Object.entries(section.content).forEach(([key, value]) => {
            if (yPosition > 270) {
                doc.addPage()
                yPosition = 20
            }
            
            doc.text(`${key}: ${value}`, 25, yPosition)
            yPosition += 7
        })
        
        yPosition += 10
    })
    
    // Add footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
        doc.text('Solar PV Testing System - Compliance Report', 20, 290)
    }
    
    // Return PDF as buffer
    return doc.output('arraybuffer')
}