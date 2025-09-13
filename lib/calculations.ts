// Electrical and statistical calculation utilities

// Electrical calculations

/**
 * Calculate resistance using Ohm's law (R = V / I)
 */
export function calculateResistance(voltage: number, current: number): number | null {
  if (current === 0 || !isFinite(voltage) || !isFinite(current)) {
    return null
  }
  return voltage / current
}

/**
 * Calculate power (P = V * I)
 */
export function calculatePower(voltage: number, current: number): number | null {
  if (!isFinite(voltage) || !isFinite(current)) {
    return null
  }
  return voltage * current
}

/**
 * Calculate apparent power in AC systems (S = V * I)
 */
export function calculateApparentPower(voltage: number, current: number): number | null {
  return calculatePower(voltage, current)
}

/**
 * Calculate real power in AC systems (P = V * I * cos(φ))
 */
export function calculateRealPower(
  voltage: number,
  current: number,
  powerFactor: number
): number | null {
  const apparentPower = calculateApparentPower(voltage, current)
  if (apparentPower === null || !isFinite(powerFactor)) {
    return null
  }
  return apparentPower * powerFactor
}

/**
 * Calculate reactive power in AC systems (Q = V * I * sin(φ))
 */
export function calculateReactivePower(
  voltage: number,
  current: number,
  phaseAngle: number
): number | null {
  const apparentPower = calculateApparentPower(voltage, current)
  if (apparentPower === null || !isFinite(phaseAngle)) {
    return null
  }
  const phaseAngleRad = (phaseAngle * Math.PI) / 180
  return apparentPower * Math.sin(phaseAngleRad)
}

/**
 * Calculate power factor from phase angle
 */
export function calculatePowerFactor(phaseAngle: number): number | null {
  if (!isFinite(phaseAngle)) {
    return null
  }
  const phaseAngleRad = (phaseAngle * Math.PI) / 180
  return Math.cos(phaseAngleRad)
}

/**
 * Calculate percentage deviation from expected value
 */
export function calculateDeviation(
  actual: number,
  expected: number
): number | null {
  if (expected === 0 || !isFinite(actual) || !isFinite(expected)) {
    return null
  }
  return ((actual - expected) / expected) * 100
}

/**
 * Check if a value is within tolerance
 */
export function isWithinTolerance(
  value: number,
  target: number,
  tolerancePercent: number
): boolean {
  const deviation = Math.abs(calculateDeviation(value, target) || 0)
  return deviation <= tolerancePercent
}

// Statistical calculations

/**
 * Calculate mean (average) of an array of numbers
 */
export function calculateMean(values: number[]): number | null {
  if (values.length === 0) return null
  const validValues = values.filter(v => isFinite(v))
  if (validValues.length === 0) return null
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length
}

/**
 * Calculate median of an array of numbers
 */
export function calculateMedian(values: number[]): number | null {
  const validValues = values.filter(v => isFinite(v)).sort((a, b) => a - b)
  if (validValues.length === 0) return null
  
  const mid = Math.floor(validValues.length / 2)
  
  if (validValues.length % 2 === 0) {
    return (validValues[mid - 1] + validValues[mid]) / 2
  } else {
    return validValues[mid]
  }
}

/**
 * Calculate mode (most frequent value) of an array of numbers
 */
export function calculateMode(values: number[]): number[] | null {
  const validValues = values.filter(v => isFinite(v))
  if (validValues.length === 0) return null
  
  const frequency: Record<number, number> = {}
  let maxFreq = 0
  
  validValues.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1
    maxFreq = Math.max(maxFreq, frequency[val])
  })
  
  const modes = Object.entries(frequency)
    .filter(([_, freq]) => freq === maxFreq)
    .map(([val, _]) => Number(val))
  
  return modes.length > 0 ? modes : null
}

/**
 * Calculate variance of an array of numbers
 */
export function calculateVariance(values: number[]): number | null {
  const mean = calculateMean(values)
  if (mean === null) return null
  
  const validValues = values.filter(v => isFinite(v))
  const squaredDiffs = validValues.map(val => Math.pow(val - mean, 2))
  
  return calculateMean(squaredDiffs)
}

/**
 * Calculate standard deviation of an array of numbers
 */
export function calculateStandardDeviation(values: number[]): number | null {
  const variance = calculateVariance(values)
  if (variance === null) return null
  
  return Math.sqrt(variance)
}

/**
 * Calculate coefficient of variation (CV)
 */
export function calculateCoefficientOfVariation(values: number[]): number | null {
  const mean = calculateMean(values)
  const stdDev = calculateStandardDeviation(values)
  
  if (mean === null || stdDev === null || mean === 0) return null
  
  return (stdDev / Math.abs(mean)) * 100
}

/**
 * Calculate min and max values
 */
export function calculateRange(values: number[]): { min: number; max: number } | null {
  const validValues = values.filter(v => isFinite(v))
  if (validValues.length === 0) return null
  
  return {
    min: Math.min(...validValues),
    max: Math.max(...validValues),
  }
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number | null {
  if (percentile < 0 || percentile > 100) return null
  
  const validValues = values.filter(v => isFinite(v)).sort((a, b) => a - b)
  if (validValues.length === 0) return null
  
  const index = (percentile / 100) * (validValues.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index % 1
  
  if (lower === upper) {
    return validValues[lower]
  }
  
  return validValues[lower] * (1 - weight) + validValues[upper] * weight
}

/**
 * Calculate quartiles (Q1, Q2, Q3)
 */
export function calculateQuartiles(values: number[]): {
  q1: number | null
  q2: number | null
  q3: number | null
} {
  return {
    q1: calculatePercentile(values, 25),
    q2: calculatePercentile(values, 50), // Median
    q3: calculatePercentile(values, 75),
  }
}

/**
 * Calculate interquartile range (IQR)
 */
export function calculateIQR(values: number[]): number | null {
  const { q1, q3 } = calculateQuartiles(values)
  if (q1 === null || q3 === null) return null
  
  return q3 - q1
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliers(values: number[]): {
  outliers: number[]
  lower_fence: number
  upper_fence: number
} | null {
  const { q1, q3 } = calculateQuartiles(values)
  const iqr = calculateIQR(values)
  
  if (q1 === null || q3 === null || iqr === null) return null
  
  const lower_fence = q1 - 1.5 * iqr
  const upper_fence = q3 + 1.5 * iqr
  
  const outliers = values.filter(v => 
    isFinite(v) && (v < lower_fence || v > upper_fence)
  )
  
  return { outliers, lower_fence, upper_fence }
}

// Compliance calculations

/**
 * Calculate pass rate
 */
export function calculatePassRate(
  passCount: number,
  totalCount: number
): number | null {
  if (totalCount === 0) return null
  return (passCount / totalCount) * 100
}

/**
 * Check if measurements meet compliance criteria
 */
export function checkCompliance(
  measurements: Array<{ voltage?: number; current?: number; pass_fail?: boolean }>,
  criteria: {
    min_pass_rate?: number
    max_voltage_deviation?: number
    max_current_deviation?: number
    rated_voltage?: number
    rated_current?: number
  }
): {
  compliant: boolean
  pass_rate: number | null
  voltage_deviation: number | null
  current_deviation: number | null
  issues: string[]
} {
  const issues: string[] = []
  
  // Calculate pass rate
  const passFailMeasurements = measurements.filter(m => m.pass_fail !== undefined)
  const passCount = passFailMeasurements.filter(m => m.pass_fail === true).length
  const pass_rate = calculatePassRate(passCount, passFailMeasurements.length)
  
  if (pass_rate !== null && criteria.min_pass_rate && pass_rate < criteria.min_pass_rate) {
    issues.push(`Pass rate (${pass_rate.toFixed(1)}%) below minimum (${criteria.min_pass_rate}%)`)
  }
  
  // Calculate voltage deviation
  let voltage_deviation: number | null = null
  if (criteria.rated_voltage) {
    const voltages = measurements
      .map(m => m.voltage)
      .filter((v): v is number => v !== undefined && v !== null)
    
    if (voltages.length > 0) {
      const avgVoltage = calculateMean(voltages)
      if (avgVoltage !== null) {
        voltage_deviation = calculateDeviation(avgVoltage, criteria.rated_voltage)
        
        if (
          voltage_deviation !== null &&
          criteria.max_voltage_deviation &&
          Math.abs(voltage_deviation) > criteria.max_voltage_deviation
        ) {
          issues.push(
            `Voltage deviation (${Math.abs(voltage_deviation).toFixed(1)}%) exceeds maximum (${criteria.max_voltage_deviation}%)`
          )
        }
      }
    }
  }
  
  // Calculate current deviation
  let current_deviation: number | null = null
  if (criteria.rated_current) {
    const currents = measurements
      .map(m => m.current)
      .filter((c): c is number => c !== undefined && c !== null)
    
    if (currents.length > 0) {
      const avgCurrent = calculateMean(currents)
      if (avgCurrent !== null) {
        current_deviation = calculateDeviation(avgCurrent, criteria.rated_current)
        
        if (
          current_deviation !== null &&
          criteria.max_current_deviation &&
          Math.abs(current_deviation) > criteria.max_current_deviation
        ) {
          issues.push(
            `Current deviation (${Math.abs(current_deviation).toFixed(1)}%) exceeds maximum (${criteria.max_current_deviation}%)`
          )
        }
      }
    }
  }
  
  return {
    compliant: issues.length === 0,
    pass_rate,
    voltage_deviation,
    current_deviation,
    issues,
  }
}

// Time calculations

/**
 * Calculate test duration in various units
 */
export function calculateTestDuration(
  startTime: Date | string,
  endTime: Date | string
): {
  milliseconds: number
  seconds: number
  minutes: number
  hours: number
  formatted: string
} | null {
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  if (!isFinite(start.getTime()) || !isFinite(end.getTime())) {
    return null
  }
  
  const milliseconds = end.getTime() - start.getTime()
  const seconds = milliseconds / 1000
  const minutes = seconds / 60
  const hours = minutes / 60
  
  const h = Math.floor(hours)
  const m = Math.floor(minutes % 60)
  const s = Math.floor(seconds % 60)
  
  const formatted = `${h}h ${m}m ${s}s`
  
  return {
    milliseconds,
    seconds,
    minutes,
    hours,
    formatted,
  }
}

/**
 * Calculate sampling rate from measurements
 */
export function calculateSamplingRate(
  timestamps: (Date | string)[]
): number | null {
  if (timestamps.length < 2) return null
  
  const times = timestamps
    .map(t => new Date(t).getTime())
    .filter(t => isFinite(t))
    .sort((a, b) => a - b)
  
  if (times.length < 2) return null
  
  const intervals = []
  for (let i = 1; i < times.length; i++) {
    intervals.push(times[i] - times[i - 1])
  }
  
  const avgInterval = calculateMean(intervals)
  if (avgInterval === null || avgInterval === 0) return null
  
  // Return samples per second
  return 1000 / avgInterval
}