'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { supabase } from '../../../lib/supabase'

export default function NewTestSessionPage() {
    const router = useRouter()
    const { user, hasPermission } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [devices, setDevices] = useState([])
    const [users, setUsers] = useState([])

    const [formData, setFormData] = useState({
        session_name: '',
        device_id: '',
        testing_standard: 'IEC_60947_3',
        test_engineer_id: user?.id || '',
        quality_reviewer_id: '',
        test_conditions: {
            temperature: 25,
            humidity: 50,
            ambient_pressure: 1013,
            test_location: ''
        },
        test_parameters: {
            voltage_range_min: 0,
            voltage_range_max: 1000,
            current_range_min: 0,
            current_range_max: 100,
            test_duration_hours: 1
        },
        notes: ''
    })

    useEffect(() => {
        if (!hasPermission('create_test_sessions')) {
            router.push('/test-sessions')
            return
        }

        fetchDevices()
        fetchUsers()
    }, [])

    const fetchDevices = async () => {
        try {
            const { data } = await supabase
                .from('devices')
                .select('id, device_name, manufacturer, model_number, rated_voltage, rated_current')
                .eq('is_active', true)
                .order('device_name')

            setDevices(data || [])
        } catch (error) {
            console.error('Error fetching devices:', error)
        }
    }

    const fetchUsers = async () => {
        try {
            const { data } = await supabase
                .from('users')
                .select('id, full_name, email, role')
                .in('role', ['engineer', 'manager', 'admin'])
                .eq('is_active', true)
                .order('full_name')

            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleConditionChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            test_conditions: {
                ...prev.test_conditions,
                [name]: parseFloat(value) || value
            }
        }))
    }

    const handleParameterChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            test_parameters: {
                ...prev.test_parameters,
                [name]: parseFloat(value) || value
            }
        }))
    }

    const handleDeviceChange = (e) => {
        const deviceId = e.target.value
        setFormData(prev => ({ ...prev, device_id: deviceId }))

        // Auto-set voltage and current ranges based on device specs
        const device = devices.find(d => d.id === deviceId)
        if (device) {
            setFormData(prev => ({
                ...prev,
                test_parameters: {
                    ...prev.test_parameters,
                    voltage_range_max: device.rated_voltage * 1.1, // 10% tolerance
                    current_range_max: device.rated_current * 1.1
                }
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            // Validate form
            if (!formData.session_name || !formData.device_id) {
                throw new Error('Please fill in all required fields')
            }

            // Create test session
            const { data, error: createError } = await supabase
                .from('test_sessions')
                .insert({
                    ...formData,
                    test_engineer_id: user.id,
                    session_status: 'draft',
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (createError) throw createError

            // Redirect to session details
            router.push(`/test-sessions/${data.id}`)
        } catch (err) {
            console.error('Error creating test session:', err)
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Test Session</h1>
                    <p className="text-gray-600 mt-1">Set up a new testing campaign for PV disconnect devices</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Session Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="session_name"
                                    value={formData.session_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Q4 2024 Compliance Testing"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Device <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="device_id"
                                    value={formData.device_id}
                                    onChange={handleDeviceChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select a device</option>
                                    {devices.map(device => (
                                        <option key={device.id} value={device.id}>
                                            {device.manufacturer} {device.device_name} ({device.model_number})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Testing Standard <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="testing_standard"
                                    value={formData.testing_standard}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="IEC_60947_3">IEC 60947-3</option>
                                    <option value="UL_98B">UL 98B</option>
                                    <option value="IEC_62271_100">IEC 62271-100</option>
                                    <option value="ANSI_C37_06">ANSI C37.06</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quality Reviewer
                                </label>
                                <select
                                    name="quality_reviewer_id"
                                    value={formData.quality_reviewer_id}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select a reviewer (optional)</option>
                                    {users.filter(u => u.id !== user?.id).map(reviewer => (
                                        <option key={reviewer.id} value={reviewer.id}>
                                            {reviewer.full_name} ({reviewer.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Test Conditions */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Conditions</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Temperature (°C)
                                </label>
                                <input
                                    type="number"
                                    name="temperature"
                                    value={formData.test_conditions.temperature}
                                    onChange={handleConditionChange}
                                    step="0.1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Humidity (%)
                                </label>
                                <input
                                    type="number"
                                    name="humidity"
                                    value={formData.test_conditions.humidity}
                                    onChange={handleConditionChange}
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ambient Pressure (hPa)
                                </label>
                                <input
                                    type="number"
                                    name="ambient_pressure"
                                    value={formData.test_conditions.ambient_pressure}
                                    onChange={handleConditionChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Test Location
                                </label>
                                <input
                                    type="text"
                                    name="test_location"
                                    value={formData.test_conditions.test_location}
                                    onChange={handleConditionChange}
                                    placeholder="e.g., Lab A"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Test Parameters */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Parameters</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Voltage Range (V)
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        name="voltage_range_min"
                                        value={formData.test_parameters.voltage_range_min}
                                        onChange={handleParameterChange}
                                        placeholder="Min"
                                        step="0.1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <span className="self-center">to</span>
                                    <input
                                        type="number"
                                        name="voltage_range_max"
                                        value={formData.test_parameters.voltage_range_max}
                                        onChange={handleParameterChange}
                                        placeholder="Max"
                                        step="0.1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Range (A)
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        name="current_range_min"
                                        value={formData.test_parameters.current_range_min}
                                        onChange={handleParameterChange}
                                        placeholder="Min"
                                        step="0.1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <span className="self-center">to</span>
                                    <input
                                        type="number"
                                        name="current_range_max"
                                        value={formData.test_parameters.current_range_max}
                                        onChange={handleParameterChange}
                                        placeholder="Max"
                                        step="0.1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Test Duration (hours)
                                </label>
                                <input
                                    type="number"
                                    name="test_duration_hours"
                                    value={formData.test_parameters.test_duration_hours}
                                    onChange={handleParameterChange}
                                    min="0.1"
                                    step="0.1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
                        
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Any additional notes or special instructions..."
                        />
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                            <div className="flex">
                                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/test-sessions')}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Create Test Session</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AuthLayout>
    )
}