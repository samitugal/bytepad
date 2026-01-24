// Simple logger utility for MCP server
// Uses stderr to not interfere with stdio transport

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  if (data !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(data)}`
  }
  return `${prefix} ${message}`
}

export const logger = {
  debug(message: string, data?: unknown): void {
    if (shouldLog('debug')) {
      console.error(formatMessage('debug', message, data))
    }
  },

  info(message: string, data?: unknown): void {
    if (shouldLog('info')) {
      console.error(formatMessage('info', message, data))
    }
  },

  warn(message: string, data?: unknown): void {
    if (shouldLog('warn')) {
      console.error(formatMessage('warn', message, data))
    }
  },

  error(message: string, data?: unknown): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, data))
    }
  },
}
