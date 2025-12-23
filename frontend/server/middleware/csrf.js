/**
 * CSRF Protection Middleware
 *
 * Implements Double Submit Cookie pattern for CSRF protection.
 * - Token stored in httpOnly cookie
 * - Token also returned in response header
 * - Client must send token in X-CSRF-Token header
 */

import crypto from 'crypto';
import { config } from '../config/env.js';
import { createLogger } from '../config/logger.js';

const log = createLogger('CSRF');

// CSRF Token configuration
const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Store tokens with expiry (in production, use Redis)
const tokenStore = new Map();

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [token, expiry] of tokenStore.entries()) {
    if (expiry < now) {
      tokenStore.delete(token);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    log.debug({ cleaned }, 'Cleaned expired CSRF tokens');
  }
}, 60 * 60 * 1000); // Every hour

/**
 * Generate a new CSRF token
 */
function generateToken() {
  const token = crypto.randomBytes(TOKEN_LENGTH).toString('hex');
  tokenStore.set(token, Date.now() + TOKEN_EXPIRY_MS);
  return token;
}

/**
 * Validate a CSRF token
 */
function validateToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const expiry = tokenStore.get(token);
  if (!expiry) {
    return false;
  }

  if (expiry < Date.now()) {
    tokenStore.delete(token);
    return false;
  }

  return true;
}

/**
 * CSRF Protection Middleware
 *
 * For GET/HEAD/OPTIONS requests: generates and sets CSRF token
 * For POST/PUT/DELETE/PATCH requests: validates CSRF token
 */
export function csrfProtection(req, res, next) {
  // Skip CSRF for API health check
  if (req.path === '/api/health') {
    return next();
  }

  // Safe methods - generate/refresh token
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    // Generate new token or use existing
    let token = req.cookies?.[CSRF_COOKIE_NAME];

    if (!token || !validateToken(token)) {
      token = generateToken();
    }

    // Set cookie
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY_MS
    });

    // Also send in header for client to read
    res.setHeader('X-CSRF-Token', token);

    return next();
  }

  // Unsafe methods - validate token
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  // Both tokens must be present and match
  if (!cookieToken || !headerToken) {
    log.warn({
      path: req.path,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken
    }, 'CSRF token missing');
    return res.status(403).json({
      error: 'CSRF token missing',
      code: 'CSRF_MISSING'
    });
  }

  if (cookieToken !== headerToken) {
    log.warn({ path: req.path }, 'CSRF token mismatch');
    return res.status(403).json({
      error: 'CSRF token mismatch',
      code: 'CSRF_MISMATCH'
    });
  }

  if (!validateToken(cookieToken)) {
    log.warn({ path: req.path }, 'CSRF token invalid or expired');
    return res.status(403).json({
      error: 'CSRF token invalid or expired',
      code: 'CSRF_INVALID'
    });
  }

  // Token valid - proceed
  next();
}

/**
 * CSRF Token endpoint - returns current token
 */
export function csrfTokenEndpoint(req, res) {
  let token = req.cookies?.[CSRF_COOKIE_NAME];

  if (!token || !validateToken(token)) {
    token = generateToken();
  }

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY_MS
  });

  res.json({ token });
}

export default {
  csrfProtection,
  csrfTokenEndpoint
};
