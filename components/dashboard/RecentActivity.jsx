'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatRelativeTime } from '../../utils'

export function RecentActivity() {
    const [activities, setActivities] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchRecentActivity()

        // Subscribe to real-time updates
        const subscription = supabase
            .channel('recent-activity')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
                fetchRecentActivity()
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const fetchRecentActivity = async () => {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select(`
                    *,
                    user:users!user_id(full_name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error

            const formattedActivities = data.map(log => ({
                id: log.id,
                user: log.user?.full_name || 'System',
                action: formatAction(log.action, log.table_name),
                timestamp: log.created_at,
                icon: getActionIcon(log.action),
                color: getActionColor(log.action)
            }))

            setActivities(formattedActivities)
        } catch (error) {
            console.error('Error fetching activity:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatAction = (action, tableName) => {
        const actionMap = {
            create: 'created',
            update: 'updated',
            delete: 'deleted',
            login: 'logged in',
            logout: 'logged out',
            export: 'exported',
            import: 'imported'
        }

        const tableMap = {
            devices: 'device',
            test_sessions: 'test session',
            test_measurements: 'measurements',
            compliance_reports: 'compliance report',
            excel_imports: 'Excel data'
        }

        const actionText = actionMap[action] || action
        const tableText = tableMap[tableName] || tableName

        if (action === 'login' || action === 'logout') {
            return actionText
        }

        return `${actionText} ${tableText}`
    }

    const getActionIcon = (action) => {
        switch (action) {
            case 'create':
                return (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                )
            case 'update':
                return (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                )
            case 'delete':
                return (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                )
            case 'login':
                return (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                )
            case 'export':
            case 'import':
                return (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                )
            default:
                return (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
        }
    }

    const getActionColor = (action) => {
        switch (action) {
            case 'create':
                return 'bg-green-100 text-green-600'
            case 'update':
                return 'bg-blue-100 text-blue-600'
            case 'delete':
                return 'bg-red-100 text-red-600'
            case 'login':
            case 'logout':
                return 'bg-gray-100 text-gray-600'
            case 'export':
            case 'import':
                return 'bg-purple-100 text-purple-600'
            default:
                return 'bg-gray-100 text-gray-600'
        }
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                    <span className="text-sm text-gray-500">Last 10 activities</span>
                </div>
                
                {activities.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No recent activity</p>
                ) : (
                    <div className="space-y-3">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color}`}>
                                    {activity.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-medium">{activity.user}</span>
                                        {' '}
                                        <span className="text-gray-600">{activity.action}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatRelativeTime(activity.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}