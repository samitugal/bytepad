// Shared logging utility for the renderer (src/).
//
// Shape mirrors electron/server/utils/logger.ts (debug/info/warn/error with a
// priority-based level filter) so the codebase has one logger convention
// instead of two. The renderer ships to end users, so it defaults to a
// quieter level in production builds and a verbose level in dev, based on
// Vite's `import.meta.env.DEV` flag.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Dev: show everything. Prod: only warn/error survive by default, so real
// problems remain visible (e.g. for users reporting bugs) while routine
// debug/info tracing stays silent.
let currentLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'warn'

export function setLogLevel(level: LogLevel) {
  currentLevel = level
}

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[currentLevel]
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },

  info(message: string, ...args: unknown[]) {
    if (shouldLog('info')) {
      console.log(`[INFO] ${message}`, ...args)
    }
  },

  warn(message: string, ...args: unknown[]) {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  error(message: string, ...args: unknown[]) {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  },
}
