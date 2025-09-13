'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export function TestDataCharts() {
    const [chartData, setChartData] = useState({
        measurementTrend: [],
        passFailRatio: [],
        deviceUsage: [],
        isLoading: true
    })
    const [timeRange, setTimeRange] = useState('week') // week, month, year

    useEffect(() => {
        fetchChartData()
    }, [timeRange])

    const fetchChartData = async () => {
        try {
            // Calculate date range
            const endDate = new Date()
            const startDate = new Date()
            
            switch (timeRange) {
                case 'week':
                    startDate.setDate(startDate.getDate() - 7)
                    break
                case 'month':
                    startDate.setMonth(startDate.getMonth() - 1)
                    break
                case 'year':
                    startDate.setFullYear(startDate.getFullYear() - 1)
                    break
            }

            // Fetch measurement trend data
            const { data: measurements } = await supabase
                .from('test_measurements')
                .select('created_at, pass_fail')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true })

            // Process measurement trend
            const trendData = processMeasurementTrend(measurements || [], timeRange)

            // Calculate pass/fail ratio
            const passCount = measurements?.filter(m => m.pass_fail === true).length || 0
            const failCount = measurements?.filter(m => m.pass_fail === false).length || 0
            const passFailData = [
                { name: 'Pass', value: passCount, percentage: passCount / (passCount + failCount) * 100 },
                { name: 'Fail', value: failCount, percentage: failCount / (passCount + failCount) * 100 }
            ]

            // Fetch device usage data
            const { data: sessions } = await supabase
                .from('test_sessions')
                .select(`
                    device_id,
                    devices!inner(device_name, manufacturer)
                `)
                .gte('created_at', startDate.toISOString())

            // Process device usage
            const deviceUsageMap = {}
            sessions?.forEach(session => {
                const device = session.devices
                const key = `${device.manufacturer} ${device.device_name}`
                deviceUsageMap[key] = (deviceUsageMap[key] || 0) + 1
            })

            const deviceUsageData = Object.entries(deviceUsageMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5) // Top 5 devices

            setChartData({
                measurementTrend: trendData,
                passFailRatio: passFailData,
                deviceUsage: deviceUsageData,
                isLoading: false
            })
        } catch (error) {
            console.error('Error fetching chart data:', error)
            setChartData(prev => ({ ...prev, isLoading: false }))
        }
    }

    const processMeasurementTrend = (measurements, range) => {
        const groupedData = {}
        
        measurements.forEach(measurement => {
            let key
            const date = new Date(measurement.created_at)
            
            switch (range) {
                case 'week':
                    key = format(date, 'EEE')
                    break
                case 'month':
                    key = format(date, 'MMM d')
                    break
                case 'year':
                    key = format(date, 'MMM yyyy')
                    break
            }
            
            if (!groupedData[key]) {
                groupedData[key] = { date: key, total: 0, passed: 0 }
            }
            
            groupedData[key].total++
            if (measurement.pass_fail) {
                groupedData[key].passed++
            }
        })
        
        return Object.values(groupedData)
    }

    if (chartData.isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6">
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex justify-end">
                <div className="bg-white rounded-lg shadow px-4 py-2">
                    <div className="flex space-x-2">
                        {['week', 'month', 'year'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    timeRange === range
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Measurement Trend Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Measurement Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.measurementTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="total" 
                                stroke="#3B82F6" 
                                name="Total"
                                strokeWidth={2}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="passed" 
                                stroke="#10B981" 
                                name="Passed"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Pass/Fail Ratio Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass/Fail Ratio</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={chartData.passFailRatio}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                <Cell fill="#10B981" />
                                <Cell fill="#EF4444" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Device Usage Chart */}
                <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tested Devices</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.deviceUsage} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}