/**
 * Structured Logging with Pino
 *
 * Production-ready logging with:
 * - Structured JSON output
 * - Log levels (debug, info, warn, error)
 * - Request ID tracking
 * - Pretty printing in development
 */

import pino from 'pino';
import { config } from './env.js';

// Create logger with appropriate configuration
const loggerOptions = {
  level: config.logLevel,
  base: {
    service: 'ge-impots-api',
    env: config.nodeEnv
  },
  timestamp: pino.stdTimeFunctions.isoTime
};

// In development, use pretty printing
if (config.isDevelopment) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,service,env'
    }
  };
}

// Create the base logger
const baseLogger = pino(loggerOptions);

/**
 * Create a child logger with context
 * @param {string} context - Logger context (e.g., 'Chat', 'Documents', 'Auth')
 * @returns {object} Child logger with context
 */
export function createLogger(context) {
  return baseLogger.child({ context });
}

/**
 * Request logging middleware
 * Adds requestId to each request and logs request/response
 */
let requestCounter = 0;

export function requestLogger(req, res, next) {
  // Generate request ID
  const requestId = `req-${Date.now()}-${++requestCounter}`;
  req.requestId = requestId;

  // Create request-scoped logger
  req.log = baseLogger.child({
    requestId,
    method: req.method,
    path: req.path
  });

  // Log request start
  req.log.info({ query: req.query }, 'Request started');

  // Track response time
  const startTime = process.hrtime();

  // Log response on finish
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationMs = Math.round(seconds * 1000 + nanoseconds / 1000000);

    const logData = {
      statusCode: res.statusCode,
      durationMs
    };

    if (res.statusCode >= 400) {
      req.log.warn(logData, 'Request completed with error');
    } else {
      req.log.info(logData, 'Request completed');
    }
  });

  next();
}

/**
 * Error logging helper
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @param {object} additionalData - Additional data to log
 */
export function logError(error, context, additionalData = {}) {
  const logger = createLogger(context);
  logger.error({
    err: {
      message: error.message,
      name: error.name,
      stack: config.isDevelopment ? error.stack : undefined,
      ...error
    },
    ...additionalData
  }, error.message);
}

// Export default logger for general use
export const logger = baseLogger;

export default {
  logger,
  createLogger,
  requestLogger,
  logError
};
