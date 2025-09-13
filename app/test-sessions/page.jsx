'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDate, formatRelativeTime } from '@/utils'
import { TEST_SESSION_STATUS, TESTING_STANDARDS, DISPLAY_LABELS } from '@/lib/constants'
import { AuthLayout } from '@/components/layout/AuthLayout'

export default function TestSessionsPage() {
    const { hasPermission } = useAuth()
    const [sessions, setSessions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filters, setFilters] = useState({
        device_id: '',
        status: '',
        date_from: '',
        date_to: ''
    })
    const [devices, setDevices] = useState([])

    useEffect(() => {
        fetchDevices()
        fetchSessions()
    }, [filters])

    const fetchDevices = async () => {
        const { data } = await supabase
            .from('devices')
            .select('id, device_name, manufacturer, model_number')
            .eq('is_active', true)
            .order('device_name')
        
        setDevices(data || [])
    }

    const fetchSessions = async () => {
        try {
            setIsLoading(true)
            
            let query = supabase
                .from('test_sessions')
                .select(`
                    *,
                    device:devices(device_name, manufacturer, model_number),
                    engineer:users!test_engineer_id(full_name),
                    reviewer:users!quality_reviewer_id(full_name),
                    _count:test_measurements(count)
                `)
                .order('created_at', { ascending: false })
            
            // Apply filters
            if (filters.device_id) {
                query = query.eq('device_id', filters.device_id)
            }
            
            if (filters.status) {
                query = query.eq('session_status', filters.status)
            }
            
            if (filters.date_from) {
                query = query.gte('started_at', filters.date_from)
            }
            
            if (filters.date_to) {
                query = query.lte('started_at', filters.date_to)
            }
            
            const { data, error } = await query
            
            if (error) throw error
            
            setSessions(data || [])
        } catch (error) {
            console.error('Error fetching sessions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800'
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-800'
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
            case 'cancelled':
                return 'bg-gray-100 text-gray-600'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <AuthLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Test Sessions</h1>
                            <p className="text-gray-600">Manage testing sessions for PV disconnect devices</p>
                        </div>
                        {hasPermission('create_test_sessions') && (
                            <Link
                                href="/test-sessions/new"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                New Test Session
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Device
                            </label>
                            <select
                                value={filters.device_id}
                                onChange={(e) => setFilters(prev => ({ ...prev, device_id: e.target.value }))}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Devices</option>
                                {devices.map((device) => (
                                    <option key={device.id} value={device.id}>
                                        {device.manufacturer} - {device.device_name} ({device.model_number})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Statuses</option>
                                {Object.entries(TEST_SESSION_STATUS).map(([key, value]) => (
                                    <option key={value} value={value}>
                                        {DISPLAY_LABELS[value]}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Sessions Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {isLoading ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Loading test sessions...</p>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-gray-500">No test sessions found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Session Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Device
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Standard
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Engineer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Measurements
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Started
                                        </th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {session.session_name}
                                                </div>
                                                {session.compliance_approved && (
                                                    <div className="text-xs text-green-600">
                                                        ✓ Approved
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {session.device?.manufacturer}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {session.device?.device_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">
                                                    {DISPLAY_LABELS[session.testing_standard]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.session_status)}`}>
                                                    {DISPLAY_LABELS[session.session_status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {session.engineer?.full_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {session._count?.[0]?.count || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {session.started_at ? (
                                                    <div>
                                                        <div>{formatDate(session.started_at)}</div>
                                                        <div className="text-xs">{formatRelativeTime(session.started_at)}</div>
                                                    </div>
                                                ) : (
                                                    'Not started'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={`/test-sessions/${session.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthLayout>
    )
}