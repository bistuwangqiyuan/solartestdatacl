'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils'

export default function DevicesPage() {
    const { hasPermission } = useAuth()
    const [devices, setDevices] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('')
    const [filterManufacturer, setFilterManufacturer] = useState('')

    useEffect(() => {
        fetchDevices()
    }, [filterType, filterManufacturer])

    const fetchDevices = async () => {
        try {
            setIsLoading(true)
            let query = supabase
                .from('devices')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (filterType) {
                query = query.eq('device_type', filterType)
            }

            if (filterManufacturer) {
                query = query.eq('manufacturer', filterManufacturer)
            }

            const { data, error } = await query

            if (error) throw error

            setDevices(data || [])
        } catch (error) {
            console.error('Error fetching devices:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredDevices = devices.filter(device =>
        device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const manufacturers = [...new Set(devices.map(d => d.manufacturer))]

    return (
        <AuthLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
                            <p className="text-gray-600">Manage PV disconnect devices</p>
                        </div>
                        {hasPermission('create_devices') && (
                            <Link
                                href="/devices/new"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add Device</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                            <input
                                type="text"
                                placeholder="Search devices..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Device Type</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Types</option>
                                <option value="disconnect_switch">Disconnect Switch</option>
                                <option value="fuse_combination">Fuse Combination</option>
                                <option value="switch_disconnector">Switch Disconnector</option>
                                <option value="circuit_breaker">Circuit Breaker</option>
                                <option value="load_break_switch">Load Break Switch</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                            <select
                                value={filterManufacturer}
                                onChange={(e) => setFilterManufacturer(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Manufacturers</option>
                                {manufacturers.map(manufacturer => (
                                    <option key={manufacturer} value={manufacturer}>
                                        {manufacturer}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Devices Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading devices...</p>
                        </div>
                    ) : filteredDevices.length === 0 ? (
                        <div className="p-8 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <p className="mt-4 text-gray-600">No devices found</p>
                            {hasPermission('create_devices') && (
                                <Link
                                    href="/devices/new"
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Add your first device
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Device
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Specifications
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Standards
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
                                    {filteredDevices.map((device) => (
                                        <tr key={device.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {device.device_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {device.manufacturer} • {device.model_number}
                                                    </div>
                                                    {device.serial_number && (
                                                        <div className="text-xs text-gray-400">
                                                            SN: {device.serial_number}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {device.device_type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>
                                                    <div>{device.rated_voltage}V</div>
                                                    <div>{device.rated_current}A</div>
                                                    {device.rated_power && <div>{device.rated_power}W</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    {device.testing_standard?.map((standard) => (
                                                        <span
                                                            key={standard}
                                                            className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800"
                                                        >
                                                            {standard.replace(/_/g, ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(device.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={`/devices/${device.id}`}
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