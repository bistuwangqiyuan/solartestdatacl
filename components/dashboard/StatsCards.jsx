'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function StatsCards() {
    const [stats, setStats] = useState({
        totalDevices: 0,
        totalSessions: 0,
        activeSessions: 0,
        totalMeasurements: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            // Get total devices
            const { count: deviceCount } = await supabase
                .from('devices')
                .select('*', { count: 'exact', head: true })

            // Get total test sessions
            const { count: sessionCount } = await supabase
                .from('test_sessions')
                .select('*', { count: 'exact', head: true })

            // Get active sessions
            const { count: activeCount } = await supabase
                .from('test_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'in_progress')

            // Get total measurements
            const { count: measurementCount } = await supabase
                .from('test_measurements')
                .select('*', { count: 'exact', head: true })

            setStats({
                totalDevices: deviceCount || 0,
                totalSessions: sessionCount || 0,
                activeSessions: activeCount || 0,
                totalMeasurements: measurementCount || 0
            })
        } catch (error) {
            console.error('Error loading stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const statCards = [
        {
            title: 'Total Devices',
            value: stats.totalDevices,
            icon: (
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
            ),
            color: 'blue',
            description: 'Registered disconnect devices'
        },
        {
            title: 'Test Sessions',
            value: stats.totalSessions,
            icon: (
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'green',
            description: 'Total testing sessions'
        },
        {
            title: 'Active Sessions',
            value: stats.activeSessions,
            icon: (
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: 'yellow',
            description: 'Currently in progress'
        },
        {
            title: 'Measurements',
            value: stats.totalMeasurements,
            icon: (
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            color: 'purple',
            description: 'Data points collected'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className={`p-2 rounded-md bg-${card.color}-100`}>
                            {card.icon}
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                {card.title}
                            </p>
                            {isLoading ? (
                                <div className="animate-pulse">
                                    <div className="h-8 w-16 bg-gray-200 rounded mt-1"></div>
                                </div>
                            ) : (
                                <p className="text-2xl font-semibold text-gray-900">
                                    {card.value.toLocaleString()}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                {card.description}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}