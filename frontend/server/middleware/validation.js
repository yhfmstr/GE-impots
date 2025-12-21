import { z } from 'zod';

// Valid document types whitelist
const VALID_DOCUMENT_TYPES = [
  'certificat-salaire',
  'attestation-3a',
  'attestation-lpp-rachat',
  'releve-bancaire',
  'etat-titres',
  'attestation-maladie',
  'attestation-vie',
  'facture-garde',
  'attestation-hypothecaire',
  'facture-formation',
  'releve-credit',
  'estimation-immobiliere'
];

// Chat message validation schema
export const chatSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(10000, 'Message too long (max 10000 characters)'),
  context: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(50000)
  })).max(20, 'Too many context messages').optional().default([]),
  agent: z.enum([
    'tax-coordinator',
    'getax-guide',
    'revenus-expert',
    'deductions-expert',
    'fortune-expert',
    'immobilier-expert',
    'optimizer',
    'compliance-checker'
  ]).optional().default('tax-coordinator')
});

// Document extraction validation schema with whitelist
export const documentExtractSchema = z.object({
  documentType: z.enum(VALID_DOCUMENT_TYPES, {
    errorMap: () => ({ message: 'Type de document non valide' })
  }),
  filePath: z.string().optional()
});

// Auto-detect document type schema (no type required)
export const documentAutoDetectSchema = z.object({
  documentType: z.string().optional()
});

// Validate request body middleware factory
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      return res.status(400).json({ error: 'Invalid request body' });
    }
  };
}

// Sanitize string to prevent basic injection
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
}
