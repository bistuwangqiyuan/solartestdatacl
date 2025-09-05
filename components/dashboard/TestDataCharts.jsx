'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export function TestDataCharts() {
  const [chartData, setChartData] = useState({
    recentMeasurements: [],
    voltageDistribution: [],
    currentDistribution: [],
    testSessionStatus: [],
    deviceTypeBreakdown: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadChartData()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'test_measurements' },
        (payload) => {
          console.log('Real-time update:', payload)
          loadChartData() // Reload data on changes
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const loadChartData = async () => {
    try {
      setIsLoading(true)

      // Recent measurements trend (last 24 hours)
      const { data: recentData, error: recentError } = await supabase
        .from('test_measurements')
        .select(`
          *,
          test_session:test_sessions(
            session_name,
            device:devices(device_name, manufacturer)
          )
        `)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true })
        .limit(100)

      if (recentError) throw recentError

      // Process recent measurements for trend chart
      const trendData = recentData?.map((measurement, index) => ({
        time: new Date(measurement.created_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        voltage: measurement.voltage,
        current: measurement.current,
        resistance: measurement.resistance,
        temperature: measurement.temperature,
        deviceName: measurement.test_session?.device?.device_name || 'Unknown'
      })) || []

      // Voltage distribution analysis
      const voltageRanges = [
        { range: '0-10V', min: 0, max: 10, count: 0 },
        { range: '10-20V', min: 10, max: 20, count: 0 },
        { range: '20-30V', min: 20, max: 30, count: 0 },
        { range: '30-40V', min: 30, max: 40, count: 0 },
        { range: '40V+', min: 40, max: Infinity, count: 0 }
      ]

      recentData?.forEach(measurement => {
        const voltage = measurement.voltage
        voltageRanges.forEach(range => {
          if (voltage >= range.min && voltage < range.max) {
            range.count++
          }
        })
      })

      // Current distribution analysis
      const currentRanges = [
        { range: '0-2A', min: 0, max: 2, count: 0 },
        { range: '2-5A', min: 2, max: 5, count: 0 },
        { range: '5-10A', min: 5, max: 10, count: 0 },
        { range: '10-15A', min: 10, max: 15, count: 0 },
        { range: '15A+', min: 15, max: Infinity, count: 0 }
      ]

      recentData?.forEach(measurement => {
        const current = measurement.current
        currentRanges.forEach(range => {
          if (current >= range.min && current < range.max) {
            range.count++
          }
        })
      })

      // Test session status breakdown
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('test_sessions')
        .select('session_status')

      if (sessionsError) throw sessionsError

      const statusCounts = {
        draft: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
      }

      sessionsData?.forEach(session => {
        statusCounts[session.session_status] = (statusCounts[session.session_status] || 0) + 1
      })

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.replace('_', ' ').toUpperCase(),
        value: count,
        color: {
          draft: '#94a3b8',
          in_progress: '#f59e0b',
          completed: '#10b981',
          failed: '#ef4444',
          cancelled: '#6b7280'
        }[status]
      }))

      // Device type breakdown
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('device_type')

      if (devicesError) throw devicesError

      const deviceTypeCounts = {}
      devicesData?.forEach(device => {
        const type = device.device_type
        deviceTypeCounts[type] = (deviceTypeCounts[type] || 0) + 1
      })

      const deviceTypeData = Object.entries(deviceTypeCounts).map(([type, count]) => ({
        name: type.replace('_', ' ').toUpperCase(),
        value: count,
        color: {
          disconnect_switch: '#3b82f6',
          fuse_combination: '#10b981',
          switch_disconnector: '#f59e0b',
          circuit_breaker: '#ef4444',
          load_break_switch: '#8b5cf6'
        }[type] || '#6b7280'
      }))

      setChartData({
        recentMeasurements: trendData,
        voltageDistribution: voltageRanges,
        currentDistribution: currentRanges,
        testSessionStatus: statusData,
        deviceTypeBreakdown: deviceTypeData
      })

    } catch (err) {
      setError(err.message)
      console.error('Chart data loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        Error loading chart data: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recent Measurements Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Measurements Trend (Last 24 Hours)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.recentMeasurements}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="voltage" orientation="left" />
            <YAxis yAxisId="current" orientation="right" />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Line
              yAxisId="voltage"
              type="monotone"
              dataKey="voltage"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Voltage (V)"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line
              yAxisId="current"
              type="monotone"
              dataKey="current"
              stroke="#10b981"
              strokeWidth={2}
              name="Current (A)"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
            {chartData.recentMeasurements.some(d => d.temperature) && (
              <Line
                yAxisId="voltage"
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Temperature (°C)"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voltage Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Voltage Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.voltageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                name="Measurements"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Current Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.currentDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                name="Measurements"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Test Session Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Test Session Status
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.testSessionStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.testSessionStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Device Type Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Device Type Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.deviceTypeBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.deviceTypeBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Voltage vs Current Scatter Plot */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Voltage vs Current Correlation
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={chartData.recentMeasurements}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="voltage" 
              name="voltage" 
              unit="V"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="current" 
              name="current" 
              unit="A" 
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
              formatter={(value, name) => [value, `${name.charAt(0).toUpperCase() + name.slice(1)}`]}
            />
            <Scatter 
              name="Measurements" 
              dataKey="current" 
              fill="#3b82f6"
              fillOpacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}