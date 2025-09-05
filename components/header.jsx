'use client'

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
    const { isAuthenticated, profile, signOut } = useAuth();

    const navItems = isAuthenticated ? [
        { linkText: 'Dashboard', href: '/' },
        { linkText: 'Devices', href: '/devices' },
        { linkText: 'Test Sessions', href: '/test-sessions' },
    ] : [];

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                            Solar Testing
                        </span>
                    </Link>

                    {/* Navigation */}
                    {isAuthenticated && (
                        <div className="hidden md:flex items-center space-x-8">
                            {navItems.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                                >
                                    {item.linkText}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* User Menu */}
                    {isAuthenticated ? (
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                {profile?.full_name || profile?.email}
                            </span>
                            <button
                                onClick={handleSignOut}
                                className="text-sm text-gray-700 hover:text-red-600 px-3 py-1 border border-gray-300 rounded-md hover:border-red-300"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">
                            Please sign in to continue
                        </div>
                    )}
                </div>

                {/* Mobile Navigation */}
                {isAuthenticated && (
                    <div className="md:hidden mt-4 border-t border-gray-200 pt-4">
                        <div className="flex flex-wrap gap-2">
                            {navItems.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                                >
                                    {item.linkText}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
