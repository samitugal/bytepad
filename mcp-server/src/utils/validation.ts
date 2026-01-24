// Input validation utilities

export function isValidPriority(value: unknown): value is 'P1' | 'P2' | 'P3' | 'P4' {
  return typeof value === 'string' && ['P1', 'P2', 'P3', 'P4'].includes(value)
}

export function isValidMood(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return typeof value === 'number' && value >= 1 && value <= 5 && Number.isInteger(value)
}

export function isValidEnergy(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return typeof value === 'number' && value >= 1 && value <= 5 && Number.isInteger(value)
}

export function isValidFrequency(value: unknown): value is 'daily' | 'weekly' {
  return typeof value === 'string' && ['daily', 'weekly'].includes(value)
}

export function isValidCollection(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const valid = ['Gold', 'Silver', 'Bronze', 'Unsorted']
  return valid.includes(value) || value.length > 0
}

export function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

export function isValidDate(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return !isNaN(date.getTime())
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

// Sanitize string input
export function sanitize(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

// Parse tags from various inputs
export function parseTags(value: unknown): string[] {
  if (isStringArray(value)) {
    return value.map(t => t.trim()).filter(t => t.length > 0)
  }
  if (typeof value === 'string') {
    return value.split(',').map(t => t.trim()).filter(t => t.length > 0)
  }
  return []
}
