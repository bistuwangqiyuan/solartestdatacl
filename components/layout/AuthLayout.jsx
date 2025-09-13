'use client'

import { useAuth } from '../../contexts/AuthContext'
import { Navigation } from './Navigation'

export function AuthLayout({ children }) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <>{children}</>
    }

    return (
        <>
            <Navigation />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {children}
            </div>
        </>
    )
}