/**
 * API Endpoints Constants
 *
 * Centralized API endpoint definitions for type-safety and maintainability.
 * All API routes are defined here to prevent typos and enable easy refactoring.
 */

// Base API URL (handled by axios instance)
export const API_ENDPOINTS = {
  // Health & Meta
  HEALTH: '/health',
  CSRF_TOKEN: '/csrf-token',

  // Chat / AI Assistant
  CHAT: '/chat',
  CHAT_AGENTS: '/chat/agents',

  // Declarations
  DECLARATION_DATA: '/declaration/data',
  DECLARATION_QUESTIONNAIRE: (id) => `/declaration/questionnaire/${id}`,

  // Documents
  DOCUMENTS_TYPES: '/documents/types',
  DOCUMENTS_DETECT: '/documents/detect',
  DOCUMENTS_EXTRACT: '/documents/extract',
  DOCUMENTS_EXTRACT_AUTO: '/documents/extract-auto',
  DOCUMENTS_CONFIRM_EXTRACT: '/documents/confirm-extract',
  DOCUMENTS_EXTRACTIONS: '/documents/extractions'
};

/**
 * Document types supported by the extraction API
 */
export const DOCUMENT_TYPES = {
  CERTIFICAT_SALAIRE: 'certificat_salaire',
  ATTESTATION_3A: 'attestation_3a',
  LPP_RACHAT: 'lpp_rachat',
  RELEVE_BANCAIRE: 'releve_bancaire',
  RELEVE_TITRES: 'releve_titres',
  ASSURANCE_VIE: 'assurance_vie',
  ATTESTATION_HYPOTHECAIRE: 'attestation_hypothecaire',
  FRAIS_GARDE: 'frais_garde',
  FRAIS_FORMATION: 'frais_formation',
  ATTESTATION_PRET: 'attestation_pret',
  ATTESTATION_PROPRIETE: 'attestation_propriete'
};

/**
 * API Error Codes
 */
export const API_ERROR_CODES = {
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // CSRF
  CSRF_MISSING: 'CSRF_MISSING',
  CSRF_MISMATCH: 'CSRF_MISMATCH',
  CSRF_INVALID: 'CSRF_INVALID',

  // Rate Limiting
  RATE_LIMIT: 'RATE_LIMIT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

export default API_ENDPOINTS;
