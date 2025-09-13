// General utility functions

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns'
import { DATE_FORMATS } from './constants'

// Class name utility for Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatDate(date: string | Date | null | undefined, formatString: string = DATE_FORMATS.DISPLAY): string {
  if (!date) return ''
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(parsedDate)) return ''
  
  return format(parsedDate, formatString)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, DATE_FORMATS.DISPLAY_WITH_TIME)
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(parsedDate)) return ''
  
  return formatDistance(parsedDate, new Date(), { addSuffix: true })
}

export function formatFileDate(date: string | Date | null | undefined): string {
  return formatDate(date, DATE_FORMATS.FILE_NAME)
}

// Number formatting utilities
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '-'
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) return '-'
  
  return `${formatNumber(value, decimals)}%`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// String utilities
export function truncate(str: string | null | undefined, length: number): string {
  if (!str) return ''
  
  if (str.length <= length) return str
  
  return `${str.substring(0, length)}...`
}

export function capitalize(str: string | null | undefined): string {
  if (!str) return ''
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function titleCase(str: string | null | undefined): string {
  if (!str) return ''
  
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ')
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key])
    
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    
    groups[groupKey].push(item)
    
    return groups
  }, {} as Record<string, T[]>)
}

export function uniqueBy<T>(array: T[], key: keyof T | ((item: T) => any)): T[] {
  const seen = new Set()
  
  return array.filter(item => {
    const k = typeof key === 'function' ? key(item) : item[key]
    
    if (seen.has(k)) {
      return false
    }
    
    seen.add(k)
    return true
  })
}

export function sortBy<T>(array: T[], key: keyof T | ((item: T) => any), order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key]
    const bVal = typeof key === 'function' ? key(b) : b[key]
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

// Object utilities
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  
  return result
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  
  keys.forEach(key => {
    delete result[key]
  })
  
  return result as Omit<T, K>
}

export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0
}

// URL utilities
export function getQueryParams(url: string): Record<string, string> {
  const params = new URLSearchParams(new URL(url).search)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Async utilities
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  
  return 'An unexpected error occurred'
}

export function isApiError(error: unknown): error is { code: string; message: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  )
}

// Color utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

// Math utilities
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function round(value: number, decimals: number = 0): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  
  const avg = calculateAverage(values)
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2))
  const avgSquaredDiff = calculateAverage(squaredDiffs)
  
  return Math.sqrt(avgSquaredDiff)
}

// Random utilities
export function randomId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined
  return array[randomInt(0, array.length - 1)]
}

// Export all utilities
export default {
  cn,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatFileDate,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatFileSize,
  truncate,
  capitalize,
  titleCase,
  slugify,
  groupBy,
  uniqueBy,
  sortBy,
  pick,
  omit,
  isEmptyObject,
  getQueryParams,
  buildQueryString,
  isValidEmail,
  isValidPhone,
  isValidUUID,
  sleep,
  debounce,
  throttle,
  getErrorMessage,
  isApiError,
  hexToRgb,
  rgbToHex,
  clamp,
  round,
  calculatePercentage,
  calculateAverage,
  calculateStandardDeviation,
  randomId,
  randomInt,
  randomElement,
}