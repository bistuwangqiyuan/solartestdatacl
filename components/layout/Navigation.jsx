'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

export function Navigation() {
    const { profile, signOut, hasPermission } = useAuth()
    const pathname = usePathname()

    const handleSignOut = async () => {
        await signOut()
    }

    const navItems = [
        {
            label: 'Dashboard',
            href: '/',
            permission: 'view_dashboard'
        },
        {
            label: 'Devices',
            href: '/devices',
            permission: 'view_devices'
        },
        {
            label: 'Test Sessions',
            href: '/test-sessions',
            permission: 'view_test_sessions'
        },
        {
            label: 'Reports',
            href: '/reports',
            permission: 'view_reports'
        }
    ]

    return (
        <nav className="bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link href="/" className="text-white text-xl font-bold">
                                Solar PV Testing
                            </Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                {navItems.map((item) => {
                                    if (!hasPermission(item.permission)) return null
                                    
                                    const isActive = pathname === item.href
                                    
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                                isActive
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">
                            <div className="relative">
                                <div className="flex items-center space-x-4">
                                    <span className="text-gray-300 text-sm">
                                        {profile?.full_name || profile?.email}
                                    </span>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-gray-300 hover:text-white text-sm"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}