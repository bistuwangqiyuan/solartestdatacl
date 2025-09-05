'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Link from 'next/link'

export default function TestSessionsPage() {
    const { isAuthenticated, hasRole } = useAuth()
    const [sessions, setSessions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [filterDevice, setFilterDevice] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [devices, setDevices] = useState([])

    useEffect(() => {
        if (isAuthenticated) {
            loadDevices()
            loadSessions()
        }
    }, [isAuthenticated, filterDevice, filterStatus])

    const loadDevices = async () => {
        try {
            const response = await fetch('/api/devices')
            const result = await response.json()
            
            if (response.ok) {
                setDevices(result.data || [])
            }
        } catch (err) {
            console.error('Failed to load devices:', err)
        }
    }

    const loadSessions = async () => {
        try {
            const params = new URLSearchParams()
            if (filterDevice) params.append('device_id', filterDevice)
            if (filterStatus) params.append('status', filterStatus)
            params.append('include_device', 'true')
            
            const response = await fetch(`/api/test-sessions?${params}`)
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error?.message || 'Failed to load test sessions')
            }
            
            setSessions(result.data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="text-center py-12">
                <p>Please log in to view test sessions.</p>
            </div>
        )
    }

    const getStatusBadge = (status) => {
        const badgeClasses = {
            'in_progress': 'bg-blue-100 text-blue-800',
            'completed': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800'
        }
        
        const statusLabels = {
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'failed': 'Failed'
        }

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeClasses[status] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabels[status] || status}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Test Sessions</h1>
                    <p className="text-gray-600">Manage device testing sessions and measurements</p>
                </div>
                {hasRole('engineer') && (
                    <Link
                        href="/test-sessions/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Test Session
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="device-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Device
                        </label>
                        <select
                            id="device-filter"
                            value={filterDevice}
                            onChange={(e) => setFilterDevice(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Devices</option>
                            {devices.map((device) => (
                                <option key={device.id} value={device.id}>
                                    {device.manufacturer} - {device.model_number}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Status
                        </label>
                        <select
                            id="status-filter"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            {/* Sessions List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading test sessions...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No test sessions found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filterDevice || filterStatus ? 'Try adjusting your filter criteria.' : 'Get started by creating a new test session.'}
                        </p>
                        {hasRole('engineer') && !filterDevice && !filterStatus && (
                            <div className="mt-6">
                                <Link
                                    href="/test-sessions/new"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Create First Test Session
                                </Link>
                            </div>
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
                                        Status
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
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {session.session_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {session.id.substring(0, 8)}...
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {session.devices?.manufacturer} {session.devices?.model_number}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {session.devices?.voltage_rating}V / {session.devices?.current_rating}A
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(session.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {session.summary_stats?.total_measurements || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(session.started_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Link
                                                href={`/test-sessions/${session.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                View
                                            </Link>
                                            {hasRole('engineer') && (
                                                <Link
                                                    href={`/test-sessions/${session.id}/edit`}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}