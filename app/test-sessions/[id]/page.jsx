'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { ExcelImportExport } from '../../../components/excel/ExcelImportExport'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function TestSessionDetailPage() {
  const { isAuthenticated, hasPermission } = useAuth()
  const params = useParams()
  const sessionId = params?.id

  const [session, setSession] = useState(null)
  const [measurements, setMeasurements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (isAuthenticated && sessionId) {
      loadSessionData()
    }
  }, [isAuthenticated, sessionId])

  const loadSessionData = async () => {
    try {
      setIsLoading(true)

      // Load session details
      const sessionResponse = await fetch(`/api/test-sessions/${sessionId}`)
      const sessionResult = await sessionResponse.json()

      if (!sessionResponse.ok) {
        throw new Error(sessionResult.error?.message || 'Failed to load session')
      }

      setSession(sessionResult.data)

      // Load measurements
      const measurementsResponse = await fetch(`/api/measurements?session_id=${sessionId}&limit=100&order=desc`)
      const measurementsResult = await measurementsResponse.json()

      if (measurementsResponse.ok) {
        setMeasurements(measurementsResult.data || [])
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportComplete = (importData) => {
    // Refresh measurements after successful import
    loadSessionData()
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p>Please log in to view this test session.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Session</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <Link
              href="/test-sessions"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Test Sessions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Test session not found.</p>
        <div className="mt-6">
          <Link
            href="/test-sessions"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Test Sessions
          </Link>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const badgeClasses = {
      'draft': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-yellow-100 text-yellow-800'
    }
    
    const statusLabels = {
      'draft': 'Draft',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'failed': 'Failed',
      'cancelled': 'Cancelled'
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    )
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'measurements', name: 'Measurements' },
    { id: 'excel', name: 'Excel Import/Export' },
    { id: 'analysis', name: 'Analysis' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/test-sessions"
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{session.session_name}</h1>
                  <p className="text-sm text-gray-500">Test Session #{session.id.substring(0, 8)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(session.session_status)}
              {hasPermission('edit_test_sessions') && (
                <Link
                  href={`/test-sessions/${sessionId}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit Session
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Device</dt>
                  <dd className="text-sm text-gray-900">
                    {session.device?.manufacturer} {session.device?.model_number}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Device Type</dt>
                  <dd className="text-sm text-gray-900">
                    {session.device?.device_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Voltage Rating</dt>
                  <dd className="text-sm text-gray-900">{session.device?.voltage_rating || 'N/A'}V</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Rating</dt>
                  <dd className="text-sm text-gray-900">{session.device?.current_rating || 'N/A'}A</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Testing Standard</dt>
                  <dd className="text-sm text-gray-900">{session.testing_standard || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Test Engineer</dt>
                  <dd className="text-sm text-gray-900">{session.test_engineer?.full_name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Started</dt>
                  <dd className="text-sm text-gray-900">
                    {session.started_at ? formatDateTime(session.started_at) : 'Not started'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completed</dt>
                  <dd className="text-sm text-gray-900">
                    {session.completed_at ? formatDateTime(session.completed_at) : 'In progress'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Statistics */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Measurements</span>
                  <span className="text-sm font-medium text-gray-900">
                    {session.summary_stats?.total_measurements || measurements.length || 0}
                  </span>
                </div>
                {session.summary_stats && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Voltage</span>
                      <span className="text-sm font-medium text-gray-900">
                        {session.summary_stats.avg_voltage?.toFixed(2) || 'N/A'}V
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Current</span>
                      <span className="text-sm font-medium text-gray-900">
                        {session.summary_stats.avg_current?.toFixed(2) || 'N/A'}A
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Voltage Range</span>
                      <span className="text-sm font-medium text-gray-900">
                        {session.summary_stats.min_voltage?.toFixed(2) || 'N/A'}V - {session.summary_stats.max_voltage?.toFixed(2) || 'N/A'}V
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Range</span>
                      <span className="text-sm font-medium text-gray-900">
                        {session.summary_stats.min_current?.toFixed(2) || 'N/A'}A - {session.summary_stats.max_current?.toFixed(2) || 'N/A'}A
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Measurements Tab */}
        {activeTab === 'measurements' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Measurements ({measurements.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              {measurements.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No measurements</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Import Excel data or add measurements manually.
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voltage (V)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current (A)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resistance (Ω)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Temperature (°C)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {measurements.map((measurement) => (
                      <tr key={measurement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(measurement.measurement_timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.voltage?.toFixed(4) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.current?.toFixed(4) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.resistance?.toFixed(6) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.temperature?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.measurement_type}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Excel Import/Export Tab */}
        {activeTab === 'excel' && (
          <ExcelImportExport 
            testSessionId={sessionId}
            onImportComplete={handleImportComplete}
          />
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data Analysis</h3>
            {measurements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No data available for analysis. Import measurements first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Voltage Statistics</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Count</dt>
                      <dd className="text-sm font-medium text-gray-900">{measurements.length}</dd>
                    </div>
                    {/* Add more statistical analysis here */}
                  </dl>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Current Statistics</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Count</dt>
                      <dd className="text-sm font-medium text-gray-900">{measurements.length}</dd>
                    </div>
                    {/* Add more statistical analysis here */}
                  </dl>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}