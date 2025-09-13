'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils'
import { DEVICE_TYPES, DISPLAY_LABELS } from '@/lib/constants'
import { AuthLayout } from '@/components/layout/AuthLayout'

export default function DevicesPage() {
    const { hasPermission } = useAuth()
    const [devices, setDevices] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filters, setFilters] = useState({
        search: '',
        manufacturer: '',
        device_type: ''
    })
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    })

    useEffect(() => {
        fetchDevices()
    }, [filters, pagination.page])

    const fetchDevices = async () => {
        try {
            setIsLoading(true)
            
            let query = supabase
                .from('devices')
                .select('*', { count: 'exact' })
                .eq('is_active', true)
                .order('created_at', { ascending: false })
            
            // Apply filters
            if (filters.search) {
                query = query.or(
                    `device_name.ilike.%${filters.search}%,model_number.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`
                )
            }
            
            if (filters.manufacturer) {
                query = query.eq('manufacturer', filters.manufacturer)
            }
            
            if (filters.device_type) {
                query = query.eq('device_type', filters.device_type)
            }
            
            // Pagination
            const from = (pagination.page - 1) * pagination.limit
            const to = from + pagination.limit - 1
            query = query.range(from, to)
            
            const { data, error, count } = await query
            
            if (error) throw error
            
            setDevices(data || [])
            setPagination(prev => ({ ...prev, total: count || 0 }))
        } catch (error) {
            console.error('Error fetching devices:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setPagination(prev => ({ ...prev, page: 1 }))
        fetchDevices()
    }

    const totalPages = Math.ceil(pagination.total / pagination.limit)

    return (
        <AuthLayout>
            <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
                        <p className="text-gray-600">Manage photovoltaic disconnect devices</p>
                    </div>
                    {hasPermission('create_devices') && (
                        <Link
                            href="/devices/new"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Add New Device
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                placeholder="Device name, model, serial..."
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Manufacturer
                            </label>
                            <input
                                type="text"
                                value={filters.manufacturer}
                                onChange={(e) => setFilters(prev => ({ ...prev, manufacturer: e.target.value }))}
                                placeholder="Filter by manufacturer"
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Device Type
                            </label>
                            <select
                                value={filters.device_type}
                                onChange={(e) => setFilters(prev => ({ ...prev, device_type: e.target.value }))}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Types</option>
                                {Object.entries(DEVICE_TYPES).map(([key, value]) => (
                                    <option key={value} value={value}>
                                        {DISPLAY_LABELS[value]}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Devices Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading devices...</p>
                    </div>
                ) : devices.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500">No devices found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Device Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Manufacturer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Model Number
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ratings
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
                                    {devices.map((device) => (
                                        <tr key={device.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {device.device_name}
                                                </div>
                                                {device.serial_number && (
                                                    <div className="text-xs text-gray-500">
                                                        SN: {device.serial_number}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {DISPLAY_LABELS[device.device_type]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {device.manufacturer}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {device.model_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>{device.rated_voltage}V</div>
                                                <div>{device.rated_current}A</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    {device.testing_standard?.map((standard) => (
                                                        <span
                                                            key={standard}
                                                            className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                                                        >
                                                            {DISPLAY_LABELS[standard]}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                        disabled={pagination.page === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                                        disabled={pagination.page === totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing{' '}
                                            <span className="font-medium">
                                                {(pagination.page - 1) * pagination.limit + 1}
                                            </span>{' '}
                                            to{' '}
                                            <span className="font-medium">
                                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-medium">{pagination.total}</span>{' '}
                                            results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        page === pagination.page
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
        </AuthLayout>
    )
}