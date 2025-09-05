'use client'

import { useAuth } from '../../contexts/AuthContext'
import { StatsCards } from './StatsCards'
import { RecentActivity } from './RecentActivity'
import { QuickActions } from './QuickActions'
import { TestDataCharts } from './TestDataCharts'

export function Dashboard() {
    const { profile } = useAuth()

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome back, {profile?.full_name || 'User'}
                        </h1>
                        <p className="text-gray-600">
                            Solar Disconnect Device Testing Dashboard
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Role: {profile?.role}</p>
                        <p className="text-sm text-gray-500">
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <StatsCards />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <QuickActions />
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <RecentActivity />
                </div>
            </div>

            {/* Real-time Charts and Analytics */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Testing Analytics</h2>
                <TestDataCharts />
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Database Connected</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">File Storage Available</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Real-time Updates Active</span>
                    </div>
                </div>
            </div>
        </div>
    )
}