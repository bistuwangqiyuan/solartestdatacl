'use client'

import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { USER_ROLES } from '../../lib/supabase'

export function QuickActions() {
    const { hasRole } = useAuth()

    const actions = [
        {
            title: 'Import Excel Data',
            description: 'Upload and process testing data from Excel files',
            href: '/testing/import',
            icon: (
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
            ),
            color: 'green',
            requiredRole: USER_ROLES.ENGINEER
        },
        {
            title: 'Create Test Session',
            description: 'Start a new testing session for a device',
            href: '/testing/sessions/new',
            icon: (
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
            color: 'blue',
            requiredRole: USER_ROLES.ENGINEER
        },
        {
            title: 'View Devices',
            description: 'Browse and manage registered devices',
            href: '/devices',
            icon: (
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
            ),
            color: 'purple',
            requiredRole: USER_ROLES.VIEWER
        },
        {
            title: 'Generate Reports',
            description: 'Create compliance and analysis reports',
            href: '/reports',
            icon: (
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'orange',
            requiredRole: USER_ROLES.ENGINEER
        },
        {
            title: 'Add Device',
            description: 'Register a new disconnect device',
            href: '/devices/new',
            icon: (
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            ),
            color: 'indigo',
            requiredRole: USER_ROLES.ENGINEER
        },
        {
            title: 'System Settings',
            description: 'Configure system settings and users',
            href: '/admin',
            icon: (
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            color: 'gray',
            requiredRole: USER_ROLES.ADMIN
        }
    ]

    // Filter actions based on user role
    const availableActions = actions.filter(action => hasRole(action.requiredRole))

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-4">
                {availableActions.map((action, index) => (
                    <Link
                        key={index}
                        href={action.href}
                        className="block group hover:bg-gray-50 rounded-lg p-3 transition-colors"
                    >
                        <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-md bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                                {action.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                                    {action.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {action.description}
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}