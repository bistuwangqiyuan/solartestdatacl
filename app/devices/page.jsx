'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Link from 'next/link'

export default function DevicesPage() {
    const { isAuthenticated, hasRole } = useAuth()
    const [devices, setDevices] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStandard, setFilterStandard] = useState('')

    useEffect(() => {
        if (isAuthenticated) {
            loadDevices()
        }
    }, [isAuthenticated, searchTerm, filterStandard])

    const loadDevices = async () => {
        try {
            const params = new URLSearchParams()
            if (searchTerm) params.append('manufacturer', searchTerm)
            if (filterStandard) params.append('standards', filterStandard)
            
            const response = await fetch(`/api/devices?${params}`)
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error?.message || 'Failed to load devices')
            }
            
            setDevices(result.data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="text-center py-12">
                <p>Please log in to view devices.</p>
            </div>
        )
    }

    const getDeviceTypeLabel = (type) => {
        const labels = {
            'disconnect_switch': 'Disconnect Switch',
            'fuse_combination': 'Fuse Combination',
            'switch_disconnector': 'Switch Disconnector'
        }
        return labels[type] || type
    }

    const getStandardsBadges = (standards) => {
        if (!standards || standards.length === 0) return null
        
        return standards.map((standard, index) => (
            <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1"
            >
                {standard}
            </span>
        ))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
                    <p className="text-gray-600">Manage photovoltaic disconnect devices</p>
                </div>
                {hasRole('engineer') && (
                    <Link
                        href="/devices/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Device
                    </Link>
                )}
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Search by Manufacturer
                        </label>
                        <input
                            type="text"
                            id="search"
                            placeholder="Enter manufacturer name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="standard" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Standard
                        </label>
                        <select
                            id="standard"
                            value={filterStandard}
                            onChange={(e) => setFilterStandard(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Standards</option>
                            <option value="IEC 60947-3">IEC 60947-3</option>
                            <option value="UL 98B">UL 98B</option>
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

            {/* Devices List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading devices...</p>
                    </div>
                ) : devices.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No devices found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || filterStandard ? 'Try adjusting your search criteria.' : 'Get started by adding a new device.'}
                        </p>
                        {hasRole('engineer') && !searchTerm && !filterStandard && (
                            <div className="mt-6">
                                <Link
                                    href="/devices/new"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Add First Device
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
                                        Device
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ratings
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Standards
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Added
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
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {device.model_number}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {device.manufacturer}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {getDeviceTypeLabel(device.device_type)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                <div>{device.voltage_rating}V</div>
                                                <div className="text-gray-500">{device.current_rating}A</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {getStandardsBadges(device.standards_compliance)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(device.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/devices/${device.id}`}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                View
                                            </Link>
                                            {hasRole('engineer') && (
                                                <Link
                                                    href={`/devices/${device.id}/edit`}
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