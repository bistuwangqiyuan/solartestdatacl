'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export function StatsCards() {
    const [stats, setStats] = useState({
        totalDevices: 0,
        activeSessions: 0,
        totalMeasurements: 0,
        recentImports: 0,
        isLoading: true
    })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            // Fetch total devices
            const { count: deviceCount } = await supabase
                .from('devices')
                .select('*', { count: 'exact', head: true })

            // Fetch active sessions
            const { count: activeSessionCount } = await supabase
                .from('test_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('session_status', 'in_progress')

            // Fetch total measurements
            const { count: measurementCount } = await supabase
                .from('test_measurements')
                .select('*', { count: 'exact', head: true })

            // Fetch recent imports (last 7 days)
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            
            const { count: importCount } = await supabase
                .from('excel_imports')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString())

            setStats({
                totalDevices: deviceCount || 0,
                activeSessions: activeSessionCount || 0,
                totalMeasurements: measurementCount || 0,
                recentImports: importCount || 0,
                isLoading: false
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
            setStats(prev => ({ ...prev, isLoading: false }))
        }
    }

    const statCards = [
        {
            title: 'Total Devices',
            value: stats.totalDevices,
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            ),
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Active Sessions',
            value: stats.activeSessions,
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'Total Measurements',
            value: stats.totalMeasurements.toLocaleString(),
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            title: 'Recent Imports',
            value: stats.recentImports,
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            ),
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        }
    ]

    if (stats.isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                        <div className={`${stat.bgColor} p-3 rounded-lg`}>
                            <div className={stat.color}>{stat.icon}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}