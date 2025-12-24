/**
 * API Client
 *
 * Centralized HTTP client with:
 * - Automatic CSRF token management
 * - Request/response interceptors
 * - Error handling and transformation
 * - Retry logic for transient failures
 */

import axios from 'axios';
import { API_ENDPOINTS, API_ERROR_CODES } from './endpoints.js';

// API URL configuration
const isProduction = import.meta.env.PROD;
export const API_URL = isProduction
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3002/api');

/**
 * Custom API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(message, code, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.data = data;
  }

  /**
   * Get user-friendly error message in French
   */
  getUserMessage() {
    const messages = {
      [API_ERROR_CODES.NETWORK_ERROR]: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
      [API_ERROR_CODES.TIMEOUT]: 'La requête a pris trop de temps. Veuillez réessayer.',
      [API_ERROR_CODES.UNAUTHORIZED]: 'Veuillez vous connecter pour continuer.',
      [API_ERROR_CODES.FORBIDDEN]: 'Vous n\'avez pas les droits nécessaires.',
      [API_ERROR_CODES.CSRF_MISSING]: 'Erreur de sécurité. Veuillez rafraîchir la page.',
      [API_ERROR_CODES.CSRF_MISMATCH]: 'Erreur de sécurité. Veuillez rafraîchir la page.',
      [API_ERROR_CODES.CSRF_INVALID]: 'Session expirée. Veuillez rafraîchir la page.',
      [API_ERROR_CODES.RATE_LIMIT]: 'Trop de requêtes. Veuillez patienter quelques minutes.',
      [API_ERROR_CODES.INTERNAL_ERROR]: 'Erreur serveur. Veuillez réessayer plus tard.',
      [API_ERROR_CODES.VALIDATION_ERROR]: 'Données invalides. Veuillez vérifier votre saisie.'
    };
    return messages[this.code] || this.message || 'Une erreur est survenue.';
  }
}

// CSRF Token storage
let csrfToken = null;

/**
 * Fetch CSRF token from server
 */
async function fetchCsrfToken() {
  try {
    const response = await axios.get(`${API_URL}${API_ENDPOINTS.CSRF_TOKEN}`, {
      withCredentials: true
    });
    csrfToken = response.data.token;
    return csrfToken;
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error.message);
    return null;
  }
}

/**
 * Get current CSRF token, fetching if needed
 */
async function getCsrfToken() {
  if (!csrfToken) {
    await fetchCsrfToken();
  }
  return csrfToken;
}

/**
 * Create configured axios instance
 */
function createApiClient(timeout = 60000) {
  const instance = axios.create({
    baseURL: API_URL,
    timeout,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor - add CSRF token
  instance.interceptors.request.use(
    async (config) => {
      // Add CSRF token for state-changing requests
      const unsafeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      if (unsafeMethods.includes(config.method?.toUpperCase())) {
        const token = await getCsrfToken();
        if (token) {
          config.headers['X-CSRF-Token'] = token;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  instance.interceptors.response.use(
    (response) => {
      // Update CSRF token from response header if present
      const newToken = response.headers['x-csrf-token'];
      if (newToken) {
        csrfToken = newToken;
      }
      return response;
    },
    async (error) => {
      // Handle CSRF errors - retry with fresh token
      if (error.response?.data?.code?.startsWith('CSRF_')) {
        csrfToken = null; // Clear cached token
        await fetchCsrfToken();

        // Retry the request once
        if (!error.config._csrfRetried) {
          error.config._csrfRetried = true;
          error.config.headers['X-CSRF-Token'] = csrfToken;
          return instance.request(error.config);
        }
      }

      // Transform to ApiError
      throw transformError(error);
    }
  );

  return instance;
}

/**
 * Transform axios error to ApiError
 */
function transformError(error) {
  // Network error
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError(
        'Request timeout',
        API_ERROR_CODES.TIMEOUT,
        0
      );
    }
    return new ApiError(
      'Network error',
      API_ERROR_CODES.NETWORK_ERROR,
      0
    );
  }

  const { status, data } = error.response;

  // Map status codes to error codes
  let code = data?.code || API_ERROR_CODES.INTERNAL_ERROR;

  if (status === 401) code = API_ERROR_CODES.UNAUTHORIZED;
  if (status === 403) code = data?.code || API_ERROR_CODES.FORBIDDEN;
  if (status === 429) code = API_ERROR_CODES.RATE_LIMIT;
  if (status === 400) code = data?.code || API_ERROR_CODES.VALIDATION_ERROR;

  return new ApiError(
    data?.error || error.message,
    code,
    status,
    data
  );
}

// Main API client instance (60s timeout)
export const api = createApiClient(60000);

// Upload API client instance (2min timeout)
export const uploadApi = createApiClient(120000);

/**
 * Initialize API client - fetch initial CSRF token
 * Call this on app startup
 */
export async function initializeApi() {
  await fetchCsrfToken();
}

/**
 * API helper functions
 */
export const apiHelpers = {
  /**
   * Send chat message
   */
  async chat(message, context = []) {
    const response = await api.post(API_ENDPOINTS.CHAT, { message, context });
    return response.data;
  },

  /**
   * Get available chat agents
   */
  async getChatAgents() {
    const response = await api.get(API_ENDPOINTS.CHAT_AGENTS);
    return response.data;
  },

  /**
   * Get document types
   */
  async getDocumentTypes() {
    const response = await api.get(API_ENDPOINTS.DOCUMENTS_TYPES);
    return response.data;
  },

  /**
   * Detect document type
   */
  async detectDocumentType(file) {
    const formData = new FormData();
    formData.append('document', file);

    const response = await uploadApi.post(API_ENDPOINTS.DOCUMENTS_DETECT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Extract document data
   */
  async extractDocument(file, documentType) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const response = await uploadApi.post(API_ENDPOINTS.DOCUMENTS_EXTRACT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Auto-extract document (detect + extract)
   */
  async autoExtractDocument(file) {
    const formData = new FormData();
    formData.append('document', file);

    const response = await uploadApi.post(API_ENDPOINTS.DOCUMENTS_EXTRACT_AUTO, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Confirm and extract after detection
   */
  async confirmExtract(filePath, documentType) {
    const response = await api.post(API_ENDPOINTS.DOCUMENTS_CONFIRM_EXTRACT, {
      filePath,
      documentType
    });
    return response.data;
  }
};

export default api;
