import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Trop de requêtes, veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for chat/AI endpoints (expensive operations)
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 chat requests per minute
  message: {
    error: 'Trop de requêtes au chat AI. Veuillez patienter une minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for document extraction (very expensive operation)
export const extractionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 extractions per minute
  message: {
    error: 'Trop de demandes d\'extraction. Veuillez patienter une minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for uploads
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 uploads per 5 minutes
  message: {
    error: 'Trop de téléchargements. Veuillez patienter quelques minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
