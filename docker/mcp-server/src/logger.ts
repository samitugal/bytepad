/**
 * Simple logger for Docker MCP Server
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const levels: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = levels[LOG_LEVEL] ?? 1;

function formatMessage(level: string, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + args.map(a =>
    typeof a === 'object' ? JSON.stringify(a) : String(a)
  ).join(' ') : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (currentLevel <= 0) {
      console.log(formatMessage('debug', message, ...args));
    }
  },

  info(message: string, ...args: unknown[]) {
    if (currentLevel <= 1) {
      console.log(formatMessage('info', message, ...args));
    }
  },

  warn(message: string, ...args: unknown[]) {
    if (currentLevel <= 2) {
      console.warn(formatMessage('warn', message, ...args));
    }
  },

  error(message: string, ...args: unknown[]) {
    if (currentLevel <= 3) {
      console.error(formatMessage('error', message, ...args));
    }
  },
};
