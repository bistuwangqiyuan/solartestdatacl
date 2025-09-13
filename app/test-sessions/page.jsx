'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils'

export default function TestSessionsPage() {
    const { hasPermission, profile } = useAuth()
    const [sessions, setSessions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('')
    const [filterDevice, setFilterDevice] = useState('')
    const [devices, setDevices] = useState([])

    useEffect(() => {
        fetchDevices()
        fetchSessions()
    }, [filterStatus, filterDevice])

    const fetchDevices = async () => {
        try {
            const { data } = await supabase
                .from('devices')
                .select('id, device_name, manufacturer, model_number')
                .eq('is_active', true)
                .order('device_name')

            setDevices(data || [])
        } catch (error) {
            console.error('Error fetching devices:', error)
        }
    }

    const fetchSessions = async () => {
        try {
            setIsLoading(true)
            let query = supabase
                .from('test_sessions')
                .select(`
                    *,
                    device:devices!device_id(device_name, manufacturer, model_number),
                    engineer:users!test_engineer_id(full_name, email),
                    reviewer:users!quality_reviewer_id(full_name, email)
                `)
                .order('created_at', { ascending: false })

            if (filterStatus) {
                query = query.eq('session_status', filterStatus)
            }

            if (filterDevice) {
                query = query.eq('device_id', filterDevice)
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

    const getStandardBadgeColor = (standard) => {
        switch (standard) {
            case 'IEC_60947_3':
                return 'bg-purple-100 text-purple-800'
            case 'UL_98B':
                return 'bg-orange-100 text-orange-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <AuthLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Test Sessions</h1>
                            <p className="text-gray-600">Manage and monitor testing campaigns</p>
                        </div>
                        {hasPermission('create_test_sessions') && (
                            <Link
                                href="/test-sessions/new"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>New Test Session</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Device</label>
                            <select
                                value={filterDevice}
                                onChange={(e) => setFilterDevice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Devices</option>
                                {devices.map(device => (
                                    <option key={device.id} value={device.id}>
                                        {device.manufacturer} {device.device_name} ({device.model_number})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sessions Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading test sessions...</p>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="p-8 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="mt-4 text-gray-600">No test sessions found</p>
                            {hasPermission('create_test_sessions') && (
                                <Link
                                    href="/test-sessions/new"
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Create your first test session
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Session
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
                                            Dates
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
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {session.device?.device_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {session.device?.manufacturer} • {session.device?.model_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStandardBadgeColor(session.testing_standard)}`}>
                                                    {session.testing_standard?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.session_status)}`}>
                                                    {session.session_status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {session.engineer?.full_name}
                                                </div>
                                                {session.reviewer && (
                                                    <div className="text-xs text-gray-500">
                                                        Reviewer: {session.reviewer.full_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>Created: {formatDate(session.created_at)}</div>
                                                {session.started_at && (
                                                    <div>Started: {formatDate(session.started_at)}</div>
                                                )}
                                                {session.completed_at && (
                                                    <div>Completed: {formatDate(session.completed_at)}</div>
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