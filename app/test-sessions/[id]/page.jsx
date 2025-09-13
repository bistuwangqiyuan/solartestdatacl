'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { ExcelImportExport } from '../../../components/excel/ExcelImportExport'
import { supabase } from '../../../lib/supabase'
import { formatDate, formatRelativeTime } from '../../../utils'

export default function TestSessionDetailPage({ params }) {
    const { id } = use(params)
    const router = useRouter()
    const { user, hasPermission } = useAuth()
    const [session, setSession] = useState(null)
    const [measurements, setMeasurements] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    useEffect(() => {
        if (id) {
            fetchSessionDetails()
            fetchMeasurements()

            // Subscribe to real-time updates
            const subscription = supabase
                .channel(`session-${id}`)
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'test_measurements', filter: `test_session_id=eq.${id}` },
                    () => {
                        fetchMeasurements()
                    }
                )
                .subscribe()

            return () => {
                subscription.unsubscribe()
            }
        }
    }, [id])

    const fetchSessionDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('test_sessions')
                .select(`
                    *,
                    device:devices!device_id(
                        id,
                        device_name,
                        manufacturer,
                        model_number,
                        rated_voltage,
                        rated_current,
                        testing_standard
                    ),
                    engineer:users!test_engineer_id(full_name, email),
                    reviewer:users!quality_reviewer_id(full_name, email),
                    approver:users!approved_by(full_name, email)
                `)
                .eq('id', id)
                .single()

            if (error) throw error

            setSession(data)
        } catch (error) {
            console.error('Error fetching session details:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchMeasurements = async () => {
        try {
            const { data, error } = await supabase
                .from('test_measurements')
                .select('*')
                .eq('test_session_id', id)
                .order('measurement_timestamp', { ascending: true })

            if (error) throw error

            setMeasurements(data || [])
        } catch (error) {
            console.error('Error fetching measurements:', error)
        }
    }

    const handleStatusUpdate = async (newStatus) => {
        setIsUpdatingStatus(true)
        try {
            const updates = {
                session_status: newStatus,
                updated_at: new Date().toISOString()
            }

            if (newStatus === 'in_progress' && !session.started_at) {
                updates.started_at = new Date().toISOString()
            }

            if (newStatus === 'completed' || newStatus === 'failed') {
                updates.completed_at = new Date().toISOString()
            }

            const { error } = await supabase
                .from('test_sessions')
                .update(updates)
                .eq('id', id)

            if (error) throw error

            await fetchSessionDetails()
        } catch (error) {
            console.error('Error updating status:', error)
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const calculateStatistics = () => {
        if (measurements.length === 0) {
            return {
                totalMeasurements: 0,
                passCount: 0,
                failCount: 0,
                passRate: 0,
                avgVoltage: 0,
                avgCurrent: 0,
                minVoltage: 0,
                maxVoltage: 0,
                minCurrent: 0,
                maxCurrent: 0
            }
        }

        const passCount = measurements.filter(m => m.pass_fail === true).length
        const failCount = measurements.filter(m => m.pass_fail === false).length
        const voltages = measurements.map(m => m.voltage).filter(v => v != null)
        const currents = measurements.map(m => m.current).filter(c => c != null)

        return {
            totalMeasurements: measurements.length,
            passCount,
            failCount,
            passRate: measurements.length > 0 ? (passCount / measurements.length * 100).toFixed(1) : 0,
            avgVoltage: voltages.length > 0 ? (voltages.reduce((a, b) => a + b, 0) / voltages.length).toFixed(2) : 0,
            avgCurrent: currents.length > 0 ? (currents.reduce((a, b) => a + b, 0) / currents.length).toFixed(2) : 0,
            minVoltage: voltages.length > 0 ? Math.min(...voltages).toFixed(2) : 0,
            maxVoltage: voltages.length > 0 ? Math.max(...voltages).toFixed(2) : 0,
            minCurrent: currents.length > 0 ? Math.min(...currents).toFixed(2) : 0,
            maxCurrent: currents.length > 0 ? Math.max(...currents).toFixed(2) : 0
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800'
            case 'in_progress':
                return 'bg-blue-100 text-blue-800'
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
            case 'cancelled':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (isLoading) {
        return (
            <AuthLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            </AuthLayout>
        )
    }

    if (!session) {
        return (
            <AuthLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Test Session Not Found</h2>
                    <Link href="/test-sessions" className="mt-4 text-blue-600 hover:text-blue-800">
                        Back to Test Sessions
                    </Link>
                </div>
            </AuthLayout>
        )
    }

    const stats = calculateStatistics()
    const canEdit = session.test_engineer_id === user?.id || hasPermission('edit_test_sessions')

    return (
        <AuthLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/test-sessions"
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900">{session.session_name}</h1>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(session.session_status)}`}>
                                    {session.session_status?.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <p className="text-gray-600 mt-1">
                                Created {formatRelativeTime(session.created_at)} by {session.engineer?.full_name}
                            </p>
                        </div>
                        
                        {canEdit && (
                            <div className="flex items-center space-x-3">
                                {session.session_status === 'draft' && (
                                    <button
                                        onClick={() => handleStatusUpdate('in_progress')}
                                        disabled={isUpdatingStatus}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        Start Testing
                                    </button>
                                )}
                                {session.session_status === 'in_progress' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate('completed')}
                                            disabled={isUpdatingStatus}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            Mark Complete
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('failed')}
                                            disabled={isUpdatingStatus}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            Mark Failed
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                            {['overview', 'measurements', 'import-export', 'reports'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Statistics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Total Measurements</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalMeasurements}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Pass Count</p>
                                        <p className="text-2xl font-bold text-green-600">{stats.passCount}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Fail Count</p>
                                        <p className="text-2xl font-bold text-red-600">{stats.failCount}</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Pass Rate</p>
                                        <p className="text-2xl font-bold text-blue-600">{stats.passRate}%</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Avg Voltage</p>
                                        <p className="text-2xl font-bold text-purple-600">{stats.avgVoltage}V</p>
                                    </div>
                                </div>

                                {/* Session Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h3>
                                        <dl className="space-y-2">
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-600">Device Name:</dt>
                                                <dd className="text-sm font-medium text-gray-900">{session.device?.device_name}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-600">Manufacturer:</dt>
                                                <dd className="text-sm font-medium text-gray-900">{session.device?.manufacturer}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-600">Model Number:</dt>
                                                <dd className="text-sm font-medium text-gray-900">{session.device?.model_number}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-600">Rated Voltage:</dt>
                                                <dd className="text-sm font-medium text-gray-900">{session.device?.rated_voltage}V</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-600">Rated Current:</dt>
                                                <dd className="text-sm font-medium text-gray-900">{session.device?.rated_current}A</dd>
                                            </div>
                                        </dl>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Information</h3>
                                        <dl className="space-y-2">
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-600">Testing Standard:</dt>
                                                <dd className="text-sm font-medium text-gray-900">
                                                    {session.testing_standard?.replace(/_/g, ' ')}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-600">Test Engineer:</dt>
                                                <dd className="text-sm font-medium text-gray-900">{session.engineer?.full_name}</dd>
                                            </div>
                                            {session.reviewer && (
                                                <div className="flex justify-between">
                                                    <dt className="text-sm text-gray-600">Quality Reviewer:</dt>
                                                    <dd className="text-sm font-medium text-gray-900">{session.reviewer?.full_name}</dd>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-600">Started At:</dt>
                                                <dd className="text-sm font-medium text-gray-900">
                                                    {session.started_at ? formatDate(session.started_at, 'PPp') : 'Not started'}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-600">Completed At:</dt>
                                                <dd className="text-sm font-medium text-gray-900">
                                                    {session.completed_at ? formatDate(session.completed_at, 'PPp') : 'In progress'}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Measurements Tab */}
                        {activeTab === 'measurements' && (
                            <div>
                                {measurements.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <p className="mt-4 text-gray-600">No measurements recorded yet</p>
                                        <p className="text-sm text-gray-500 mt-2">Import data from Excel or start manual measurements</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Timestamp
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Voltage (V)
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Current (A)
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Resistance (Ω)
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Power (W)
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Pass/Fail
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {measurements.slice(0, 100).map((measurement) => (
                                                    <tr key={measurement.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatDate(measurement.measurement_timestamp, 'PP HH:mm:ss')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {measurement.voltage?.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {measurement.current?.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {measurement.resistance?.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {measurement.power?.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {measurement.pass_fail ? (
                                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                                    Pass
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                                    Fail
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {measurements.length > 100 && (
                                            <p className="text-center py-4 text-sm text-gray-500">
                                                Showing first 100 of {measurements.length} measurements
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Import/Export Tab */}
                        {activeTab === 'import-export' && (
                            <div>
                                <ExcelImportExport 
                                    sessionId={id}
                                    onImportComplete={() => {
                                        fetchMeasurements()
                                        fetchSessionDetails()
                                    }}
                                />
                            </div>
                        )}

                        {/* Reports Tab */}
                        {activeTab === 'reports' && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="mt-4 text-gray-600">Report generation coming soon</p>
                                <p className="text-sm text-gray-500 mt-2">Generate IEC 60947-3 and UL 98B compliance reports</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthLayout>
    )
}