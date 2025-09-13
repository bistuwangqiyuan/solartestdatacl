'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { supabase } from '../../lib/supabase'
import { formatDate, formatRelativeTime } from '../../utils'

export default function ReportsPage() {
    const { hasPermission } = useAuth()
    const [sessions, setSessions] = useState([])
    const [reports, setReports] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedSession, setSelectedSession] = useState('')
    const [reportType, setReportType] = useState('full_compliance')
    const [isGenerating, setIsGenerating] = useState(false)
    const [activeTab, setActiveTab] = useState('generate')

    useEffect(() => {
        fetchSessions()
        fetchReports()
    }, [])

    const fetchSessions = async () => {
        try {
            const { data } = await supabase
                .from('test_sessions')
                .select(`
                    id,
                    session_name,
                    testing_standard,
                    session_status,
                    device:devices!device_id(device_name, manufacturer, model_number)
                `)
                .in('session_status', ['completed', 'failed'])
                .order('created_at', { ascending: false })

            setSessions(data || [])
        } catch (error) {
            console.error('Error fetching sessions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchReports = async () => {
        try {
            const { data } = await supabase
                .from('compliance_reports')
                .select(`
                    *,
                    session:test_sessions!test_session_id(
                        session_name,
                        device:devices!device_id(device_name, manufacturer)
                    ),
                    generator:users!generated_by(full_name),
                    approver:users!approved_by(full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(50)

            setReports(data || [])
        } catch (error) {
            console.error('Error fetching reports:', error)
        }
    }

    const handleGenerateReport = async () => {
        if (!selectedSession) {
            alert('Please select a test session')
            return
        }

        setIsGenerating(true)
        try {
            const response = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: selectedSession,
                    report_type: reportType
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error?.message || 'Failed to generate report')
            }

            // Download PDF
            const pdfBlob = base64ToBlob(result.data.pdf_base64, 'application/pdf')
            const url = URL.createObjectURL(pdfBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${result.data.report_name}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            // Refresh reports list
            await fetchReports()
            
            // Show success message
            alert('Report generated successfully!')
        } catch (error) {
            console.error('Error generating report:', error)
            alert(`Error: ${error.message}`)
        } finally {
            setIsGenerating(false)
        }
    }

    const base64ToBlob = (base64, contentType) => {
        const byteCharacters = atob(base64)
        const byteArrays = []

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512)
            const byteNumbers = new Array(slice.length)
            
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i)
            }
            
            const byteArray = new Uint8Array(byteNumbers)
            byteArrays.push(byteArray)
        }

        return new Blob(byteArrays, { type: contentType })
    }

    const getReportTypeBadge = (type) => {
        switch (type) {
            case 'full_compliance':
                return 'bg-blue-100 text-blue-800'
            case 'summary':
                return 'bg-green-100 text-green-800'
            case 'certificate':
                return 'bg-purple-100 text-purple-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStandardBadge = (standard) => {
        switch (standard) {
            case 'IEC_60947_3':
                return 'bg-orange-100 text-orange-800'
            case 'UL_98B':
                return 'bg-indigo-100 text-indigo-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (!hasPermission('view_reports')) {
        return (
            <AuthLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                    <p className="text-gray-600 mt-2">You don't have permission to view reports</p>
                </div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
                    <p className="text-gray-600 mt-1">Generate and manage compliance reports for testing sessions</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('generate')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'generate'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Generate Report
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'history'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Report History
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Generate Report Tab */}
                        {activeTab === 'generate' && hasPermission('generate_compliance_reports') && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Test Session
                                            </label>
                                            <select
                                                value={selectedSession}
                                                onChange={(e) => setSelectedSession(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Choose a test session...</option>
                                                {sessions.map(session => (
                                                    <option key={session.id} value={session.id}>
                                                        {session.session_name} - {session.device?.manufacturer} {session.device?.device_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Report Type
                                            </label>
                                            <select
                                                value={reportType}
                                                onChange={(e) => setReportType(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="full_compliance">Full Compliance Report</option>
                                                <option value="summary">Summary Report</option>
                                                <option value="certificate">Compliance Certificate</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <button
                                            onClick={handleGenerateReport}
                                            disabled={isGenerating || !selectedSession}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span>Generate Report</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Report Type Descriptions */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Report Types</h3>
                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium">Full Compliance Report:</span> Comprehensive report including all test data, statistics, compliance assessment, and recommendations.
                                        </div>
                                        <div>
                                            <span className="font-medium">Summary Report:</span> Concise overview of test results and key metrics.
                                        </div>
                                        <div>
                                            <span className="font-medium">Compliance Certificate:</span> Official certificate for devices that pass compliance testing.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Report History Tab */}
                        {activeTab === 'history' && (
                            <div>
                                {reports.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="mt-4 text-gray-600">No reports generated yet</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Report Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Test Session
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Type
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Standard
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Generated
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {reports.map((report) => (
                                                    <tr key={report.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {report.report_name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {report.session?.session_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {report.session?.device?.manufacturer} {report.session?.device?.device_name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getReportTypeBadge(report.report_type)}`}>
                                                                {report.report_type?.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStandardBadge(report.testing_standard)}`}>
                                                                {report.testing_standard?.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <div>{formatDate(report.created_at)}</div>
                                                            <div className="text-xs">by {report.generator?.full_name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {report.is_final ? (
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    Final
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                    Draft
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthLayout>
    )
}