'use client'

import { useAuth } from '../contexts/AuthContext'
import { Dashboard } from '../components/dashboard/Dashboard'
import { LoginForm } from '../components/auth/LoginForm'

export default function HomePage() {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <LoginForm />
    }

    return <Dashboard />
}
