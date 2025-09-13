'use client'

import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'

export function QuickActions() {
    const { hasPermission } = useAuth()

    const actions = [
        {
            title: 'New Test Session',
            description: 'Start a new testing session',
            href: '/test-sessions/new',
            permission: 'create_test_sessions',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            ),
            color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
            title: 'Add Device',
            description: 'Register a new device',
            href: '/devices/new',
            permission: 'create_devices',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            ),
            color: 'bg-green-500 hover:bg-green-600'
        },
        {
            title: 'Import Excel',
            description: 'Import test data from Excel',
            href: '/excel/import',
            permission: 'import_excel',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            ),
            color: 'bg-purple-500 hover:bg-purple-600'
        },
        {
            title: 'Generate Report',
            description: 'Create compliance report',
            href: '/reports/generate',
            permission: 'generate_compliance_reports',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'bg-orange-500 hover:bg-orange-600'
        }
    ]

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                    {actions.map((action, index) => {
                        if (!hasPermission(action.permission)) {
                            return null
                        }

                        return (
                            <Link
                                key={index}
                                href={action.href}
                                className={`${action.color} text-white rounded-lg p-4 flex items-center justify-between transition-colors duration-200`}
                            >
                                <div>
                                    <p className="font-medium">{action.title}</p>
                                    <p className="text-sm opacity-90">{action.description}</p>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                    {action.icon}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}