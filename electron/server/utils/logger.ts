type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel) {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[currentLevel];
}

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [MCP-${level.toUpperCase()}]`;
  return `${prefix} ${message}`;
}

// Safe logging that handles EPIPE errors (broken pipe)
function safeLog(logFn: (...args: unknown[]) => void, ...args: unknown[]) {
  try {
    logFn(...args);
  } catch (err) {
    // Ignore EPIPE errors - happens when console pipe is broken
    if ((err as NodeJS.ErrnoException).code !== 'EPIPE') {
      // For other errors, we can't log them (would cause recursion)
    }
  }
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (shouldLog('debug')) {
      safeLog(console.log, formatMessage('debug', message), ...args);
    }
  },

  info(message: string, ...args: unknown[]) {
    if (shouldLog('info')) {
      safeLog(console.log, formatMessage('info', message), ...args);
    }
  },

  warn(message: string, ...args: unknown[]) {
    if (shouldLog('warn')) {
      safeLog(console.warn, formatMessage('warn', message), ...args);
    }
  },

  error(message: string, ...args: unknown[]) {
    if (shouldLog('error')) {
      safeLog(console.error, formatMessage('error', message), ...args);
    }
  },
};
