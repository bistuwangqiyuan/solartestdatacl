'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { supabase } from '../../../lib/supabase'
import { formatDate, formatRelativeTime } from '../../../utils'

export default function DeviceDetailPage({ params }) {
    const { id } = use(params)
    const router = useRouter()
    const { hasPermission } = useAuth()
    const [device, setDevice] = useState(null)
    const [testSessions, setTestSessions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('details')
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({})

    useEffect(() => {
        if (id) {
            fetchDeviceDetails()
            fetchTestSessions()
        }
    }, [id])

    const fetchDeviceDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('devices')
                .select(`
                    *,
                    creator:users!created_by(full_name, email)
                `)
                .eq('id', id)
                .single()

            if (error) throw error

            setDevice(data)
            setEditForm(data)
        } catch (error) {
            console.error('Error fetching device:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchTestSessions = async () => {
        try {
            const { data, error } = await supabase
                .from('test_sessions')
                .select(`
                    *,
                    engineer:users!test_engineer_id(full_name),
                    _count:test_measurements(count)
                `)
                .eq('device_id', id)
                .order('created_at', { ascending: false })

            if (error) throw error

            setTestSessions(data || [])
        } catch (error) {
            console.error('Error fetching test sessions:', error)
        }
    }

    const handleEditToggle = () => {
        if (isEditing) {
            setEditForm(device) // Reset form if canceling
        }
        setIsEditing(!isEditing)
    }

    const handleEditChange = (e) => {
        const { name, value } = e.target
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleEditSubmit = async () => {
        try {
            const updates = {
                device_name: editForm.device_name,
                manufacturer: editForm.manufacturer,
                model_number: editForm.model_number,
                serial_number: editForm.serial_number,
                rated_voltage: parseFloat(editForm.rated_voltage),
                rated_current: parseFloat(editForm.rated_current),
                rated_power: editForm.rated_power ? parseFloat(editForm.rated_power) : null,
                updated_at: new Date().toISOString()
            }

            const { error } = await supabase
                .from('devices')
                .update(updates)
                .eq('id', id)

            if (error) throw error

            setDevice({ ...device, ...updates })
            setIsEditing(false)
        } catch (error) {
            console.error('Error updating device:', error)
            alert('Failed to update device')
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
            return
        }

        try {
            const { error } = await supabase
                .from('devices')
                .update({ is_active: false })
                .eq('id', id)

            if (error) throw error

            router.push('/devices')
        } catch (error) {
            console.error('Error deleting device:', error)
            alert('Failed to delete device')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'in_progress':
                return 'bg-blue-100 text-blue-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
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

    if (!device) {
        return (
            <AuthLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Device Not Found</h2>
                    <Link href="/devices" className="mt-4 text-blue-600 hover:text-blue-800">
                        Back to Devices
                    </Link>
                </div>
            </AuthLayout>
        )
    }

    // Calculate device statistics
    const totalSessions = testSessions.length
    const completedSessions = testSessions.filter(s => s.session_status === 'completed').length
    const inProgressSessions = testSessions.filter(s => s.session_status === 'in_progress').length
    const totalMeasurements = testSessions.reduce((sum, session) => sum + (session._count?.length || 0), 0)

    return (
        <AuthLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/devices"
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900">{device.device_name}</h1>
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {device.device_type?.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <p className="text-gray-600 mt-1">
                                {device.manufacturer} • {device.model_number}
                            </p>
                        </div>
                        
                        {hasPermission('edit_devices') && (
                            <div className="flex items-center space-x-3">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={handleEditToggle}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        {hasPermission('delete_devices') && (
                                            <button
                                                onClick={handleDelete}
                                                className="px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleEditToggle}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleEditSubmit}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Save Changes
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <p className="text-sm text-gray-600">Total Sessions</p>
                        <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-green-600">{completedSessions}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <p className="text-sm text-gray-600">In Progress</p>
                        <p className="text-2xl font-bold text-blue-600">{inProgressSessions}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <p className="text-sm text-gray-600">Total Measurements</p>
                        <p className="text-2xl font-bold text-purple-600">{totalMeasurements}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'details'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Device Details
                            </button>
                            <button
                                onClick={() => setActiveTab('sessions')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'sessions'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Test Sessions ({totalSessions})
                            </button>
                            <button
                                onClick={() => setActiveTab('specifications')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'specifications'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Specifications
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Device Details Tab */}
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm text-gray-600">Device Name</dt>
                                            <dd className="text-sm font-medium text-gray-900">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="device_name"
                                                        value={editForm.device_name}
                                                        onChange={handleEditChange}
                                                        className="w-full px-3 py-1 border border-gray-300 rounded"
                                                    />
                                                ) : (
                                                    device.device_name
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-600">Manufacturer</dt>
                                            <dd className="text-sm font-medium text-gray-900">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="manufacturer"
                                                        value={editForm.manufacturer}
                                                        onChange={handleEditChange}
                                                        className="w-full px-3 py-1 border border-gray-300 rounded"
                                                    />
                                                ) : (
                                                    device.manufacturer
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-600">Model Number</dt>
                                            <dd className="text-sm font-medium text-gray-900">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="model_number"
                                                        value={editForm.model_number}
                                                        onChange={handleEditChange}
                                                        className="w-full px-3 py-1 border border-gray-300 rounded"
                                                    />
                                                ) : (
                                                    device.model_number
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-600">Serial Number</dt>
                                            <dd className="text-sm font-medium text-gray-900">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="serial_number"
                                                        value={editForm.serial_number || ''}
                                                        onChange={handleEditChange}
                                                        className="w-full px-3 py-1 border border-gray-300 rounded"
                                                    />
                                                ) : (
                                                    device.serial_number || 'N/A'
                                                )}
                                            </dd>
                                        </div>
                                        {device.barcode && (
                                            <div>
                                                <dt className="text-sm text-gray-600">Barcode</dt>
                                                <dd className="text-sm font-medium text-gray-900">{device.barcode}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Electrical Ratings</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm text-gray-600">Rated Voltage</dt>
                                            <dd className="text-sm font-medium text-gray-900">
                                                {isEditing ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            name="rated_voltage"
                                                            value={editForm.rated_voltage}
                                                            onChange={handleEditChange}
                                                            className="w-full px-3 py-1 border border-gray-300 rounded"
                                                        />
                                                        <span>V</span>
                                                    </div>
                                                ) : (
                                                    `${device.rated_voltage} V`
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-600">Rated Current</dt>
                                            <dd className="text-sm font-medium text-gray-900">
                                                {isEditing ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            name="rated_current"
                                                            value={editForm.rated_current}
                                                            onChange={handleEditChange}
                                                            className="w-full px-3 py-1 border border-gray-300 rounded"
                                                        />
                                                        <span>A</span>
                                                    </div>
                                                ) : (
                                                    `${device.rated_current} A`
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-600">Rated Power</dt>
                                            <dd className="text-sm font-medium text-gray-900">
                                                {isEditing ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            name="rated_power"
                                                            value={editForm.rated_power || ''}
                                                            onChange={handleEditChange}
                                                            className="w-full px-3 py-1 border border-gray-300 rounded"
                                                        />
                                                        <span>W</span>
                                                    </div>
                                                ) : (
                                                    device.rated_power ? `${device.rated_power} W` : 'N/A'
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-600">Testing Standards</dt>
                                            <dd className="flex flex-wrap gap-1 mt-1">
                                                {device.testing_standard?.map((standard) => (
                                                    <span
                                                        key={standard}
                                                        className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800"
                                                    >
                                                        {standard.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
                                    <dl className="grid grid-cols-2 gap-4">
                                        <div>
                                            <dt className="text-sm text-gray-600">Created By</dt>
                                            <dd className="text-sm font-medium text-gray-900">
                                                {device.creator?.full_name || 'System'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-600">Created At</dt>
                                            <dd className="text-sm font-medium text-gray-900">
                                                {formatDate(device.created_at, 'PPp')}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-600">Last Updated</dt>
                                            <dd className="text-sm font-medium text-gray-900">
                                                {formatRelativeTime(device.updated_at)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-600">Status</dt>
                                            <dd>
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        )}

                        {/* Test Sessions Tab */}
                        {activeTab === 'sessions' && (
                            <div>
                                {testSessions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p className="mt-4 text-gray-600">No test sessions for this device</p>
                                        {hasPermission('create_test_sessions') && (
                                            <Link
                                                href="/test-sessions/new"
                                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                Create Test Session
                                            </Link>
                                        )}
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
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Engineer
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Standard
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Created
                                                    </th>
                                                    <th className="relative px-6 py-3">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {testSessions.map((session) => (
                                                    <tr key={session.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {session.session_name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.session_status)}`}>
                                                                {session.session_status?.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {session.engineer?.full_name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {session.testing_standard?.replace(/_/g, ' ')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(session.created_at)}
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
                        )}

                        {/* Specifications Tab */}
                        {activeTab === 'specifications' && (
                            <div>
                                {device.specifications ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Object.entries(device.specifications).map(([key, value]) => (
                                            <div key={key}>
                                                <dt className="text-sm text-gray-600">
                                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </dt>
                                                <dd className="text-sm font-medium text-gray-900 mt-1">
                                                    {value || 'N/A'}
                                                </dd>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        No additional specifications recorded
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthLayout>
    )
}