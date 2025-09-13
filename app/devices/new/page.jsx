'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { supabase } from '../../../lib/supabase'

export default function NewDevicePage() {
    const router = useRouter()
    const { user, hasPermission } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)

    const [formData, setFormData] = useState({
        device_name: '',
        device_type: 'disconnect_switch',
        manufacturer: '',
        model_number: '',
        serial_number: '',
        rated_voltage: '',
        rated_current: '',
        rated_power: '',
        testing_standard: ['IEC_60947_3'],
        specifications: {
            breaking_capacity: '',
            short_circuit_rating: '',
            mechanical_life_cycles: '',
            electrical_life_cycles: '',
            operating_temperature_min: -25,
            operating_temperature_max: 70,
            ip_rating: '',
            insulation_class: ''
        },
        barcode: '',
        qr_code: ''
    })

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSpecificationChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            specifications: {
                ...prev.specifications,
                [name]: value
            }
        }))
    }

    const handleStandardToggle = (standard) => {
        setFormData(prev => ({
            ...prev,
            testing_standard: prev.testing_standard.includes(standard)
                ? prev.testing_standard.filter(s => s !== standard)
                : [...prev.testing_standard, standard]
        }))
    }

    const generateBarcode = () => {
        // Generate a unique barcode based on device info
        const timestamp = Date.now()
        const prefix = formData.manufacturer.substring(0, 3).toUpperCase()
        const barcode = `${prefix}-${formData.model_number}-${timestamp}`
        setFormData(prev => ({ ...prev, barcode }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            // Validate form
            if (!formData.device_name || !formData.manufacturer || !formData.model_number) {
                throw new Error('Please fill in all required fields')
            }

            if (!formData.rated_voltage || !formData.rated_current) {
                throw new Error('Please specify voltage and current ratings')
            }

            // Prepare data for submission
            const deviceData = {
                ...formData,
                rated_voltage: parseFloat(formData.rated_voltage),
                rated_current: parseFloat(formData.rated_current),
                rated_power: formData.rated_power ? parseFloat(formData.rated_power) : null,
                created_by: user.id,
                is_active: true
            }

            // Create device
            const { data, error: createError } = await supabase
                .from('devices')
                .insert(deviceData)
                .select()
                .single()

            if (createError) throw createError

            // Redirect to device details
            router.push(`/devices/${data.id}`)
        } catch (err) {
            console.error('Error creating device:', err)
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!hasPermission('create_devices')) {
        router.push('/devices')
        return null
    }

    return (
        <AuthLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Add New Device</h1>
                    <p className="text-gray-600 mt-1">Register a new PV disconnect device for testing</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Device Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="device_name"
                                    value={formData.device_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., PV Disconnect Switch 1000V"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Device Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="device_type"
                                    value={formData.device_type}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="disconnect_switch">Disconnect Switch</option>
                                    <option value="fuse_combination">Fuse Combination</option>
                                    <option value="switch_disconnector">Switch Disconnector</option>
                                    <option value="circuit_breaker">Circuit Breaker</option>
                                    <option value="load_break_switch">Load Break Switch</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Manufacturer <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="manufacturer"
                                    value={formData.manufacturer}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., SolarTech Industries"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Model Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="model_number"
                                    value={formData.model_number}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., ST-DS-1000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Serial Number
                                </label>
                                <input
                                    type="text"
                                    name="serial_number"
                                    value={formData.serial_number}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., SN-2024-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Barcode
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        name="barcode"
                                        value={formData.barcode}
                                        onChange={handleInputChange}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Auto-generate or enter manually"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateBarcode}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Electrical Specifications */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Electrical Specifications</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rated Voltage (V) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="rated_voltage"
                                    value={formData.rated_voltage}
                                    onChange={handleInputChange}
                                    required
                                    step="0.1"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 1000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rated Current (A) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="rated_current"
                                    value={formData.rated_current}
                                    onChange={handleInputChange}
                                    required
                                    step="0.1"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rated Power (W)
                                </label>
                                <input
                                    type="number"
                                    name="rated_power"
                                    value={formData.rated_power}
                                    onChange={handleInputChange}
                                    step="0.1"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 100000"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Testing Standards
                            </label>
                            <div className="space-y-2">
                                {['IEC_60947_3', 'UL_98B', 'IEC_62271_100', 'ANSI_C37_06'].map(standard => (
                                    <label key={standard} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.testing_standard.includes(standard)}
                                            onChange={() => handleStandardToggle(standard)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            {standard.replace(/_/g, ' ')}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Additional Specifications */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Specifications</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Breaking Capacity (kA)
                                </label>
                                <input
                                    type="text"
                                    name="breaking_capacity"
                                    value={formData.specifications.breaking_capacity}
                                    onChange={handleSpecificationChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Short Circuit Rating (kA)
                                </label>
                                <input
                                    type="text"
                                    name="short_circuit_rating"
                                    value={formData.specifications.short_circuit_rating}
                                    onChange={handleSpecificationChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 65"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mechanical Life (cycles)
                                </label>
                                <input
                                    type="text"
                                    name="mechanical_life_cycles"
                                    value={formData.specifications.mechanical_life_cycles}
                                    onChange={handleSpecificationChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 10000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Electrical Life (cycles)
                                </label>
                                <input
                                    type="text"
                                    name="electrical_life_cycles"
                                    value={formData.specifications.electrical_life_cycles}
                                    onChange={handleSpecificationChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 5000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    IP Rating
                                </label>
                                <input
                                    type="text"
                                    name="ip_rating"
                                    value={formData.specifications.ip_rating}
                                    onChange={handleSpecificationChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., IP65"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Insulation Class
                                </label>
                                <input
                                    type="text"
                                    name="insulation_class"
                                    value={formData.specifications.insulation_class}
                                    onChange={handleSpecificationChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Class II"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Operating Temperature Range (°C)
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    name="operating_temperature_min"
                                    value={formData.specifications.operating_temperature_min}
                                    onChange={handleSpecificationChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Min"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="number"
                                    name="operating_temperature_max"
                                    value={formData.specifications.operating_temperature_max}
                                    onChange={handleSpecificationChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Max"
                                />
                            </div>
                        </div>
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
                            onClick={() => router.push('/devices')}
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
                                    <span>Create Device</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AuthLayout>
    )
}