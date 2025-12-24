/**
 * Environment Configuration & Validation
 *
 * Validates all required environment variables at startup
 * and provides typed access to configuration values.
 */

import 'dotenv/config';

// Required environment variables
const REQUIRED_VARS = {
  production: [
    'ANTHROPIC_API_KEY',
    'FRONTEND_URL'
  ],
  development: [
    'ANTHROPIC_API_KEY'
  ]
};

// Optional environment variables with defaults
const OPTIONAL_VARS = {
  NODE_ENV: 'development',
  PORT: '3002',
  FRONTEND_URL: 'http://localhost:5173',
  CLAUDE_MODEL: 'claude-opus-4-5-20251101',
  LOG_LEVEL: 'info',
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: '100',
  FILE_MAX_AGE_MS: '3600000', // 1 hour
  FILE_CLEANUP_INTERVAL_MS: '900000' // 15 minutes
};

/**
 * Validates required environment variables
 * @throws {Error} If required variables are missing
 */
export function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredVars = isProduction ? REQUIRED_VARS.production : REQUIRED_VARS.development;
  const missing = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
      missing.map(v => `  - ${v}`).join('\n') +
      `\n\nPlease set these variables in your .env file or environment.`
    );
  }

  return true;
}

/**
 * Get environment variable with fallback to default
 */
function getEnv(key, defaultValue) {
  return process.env[key] || OPTIONAL_VARS[key] || defaultValue;
}

/**
 * Parsed and typed configuration object
 */
export const config = {
  // Server
  nodeEnv: getEnv('NODE_ENV'),
  isProduction: getEnv('NODE_ENV') === 'production',
  isDevelopment: getEnv('NODE_ENV') !== 'production',
  port: parseInt(getEnv('PORT'), 10),

  // CORS
  frontendUrls: getEnv('FRONTEND_URL').split(',').map(u => u.trim()),

  // AI
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  claudeModel: getEnv('CLAUDE_MODEL'),

  // Logging
  logLevel: getEnv('LOG_LEVEL'),

  // Rate Limiting
  rateLimitWindowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS'), 10),
  rateLimitMaxRequests: parseInt(getEnv('RATE_LIMIT_MAX_REQUESTS'), 10),

  // File Cleanup
  fileMaxAgeMs: parseInt(getEnv('FILE_MAX_AGE_MS'), 10),
  fileCleanupIntervalMs: parseInt(getEnv('FILE_CLEANUP_INTERVAL_MS'), 10)
};

export default config;
