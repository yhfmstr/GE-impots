import axios from 'axios';

// API URL: In production (Vercel), use relative /api path
// In development, use VITE_API_URL or fallback to Express server
const isProduction = import.meta.env.PROD;
export const API_URL = isProduction
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3002/api');

// CSRF token storage
let csrfToken = null;

// Fetch CSRF token from server
async function fetchCsrfToken() {
  try {
    const response = await axios.get(`${API_URL}/csrf-token`, {
      withCredentials: true
    });
    csrfToken = response.data.token;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds timeout (long for AI operations)
  withCredentials: true, // Include cookies for CSRF
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add CSRF token for state-changing requests
api.interceptors.request.use(
  async (config) => {
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
      // Fetch CSRF token if not already present
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle CSRF token errors - retry once with a fresh token
    if (error.response?.status === 403 &&
        error.response?.data?.code === 'CSRF_MISSING' &&
        !originalRequest._retry) {
      originalRequest._retry = true;
      csrfToken = null; // Clear the old token
      await fetchCsrfToken(); // Fetch a new one
      if (csrfToken) {
        originalRequest.headers['X-CSRF-Token'] = csrfToken;
        return api(originalRequest);
      }
    }

    if (error.code === 'ECONNABORTED') {
      error.message = 'La requête a pris trop de temps. Veuillez réessayer.';
    } else if (!error.response) {
      error.message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    } else if (error.response.status === 429) {
      error.message = 'Trop de requêtes. Veuillez patienter quelques minutes.';
    } else if (error.response.status >= 500) {
      error.message = 'Erreur serveur. Veuillez réessayer plus tard.';
    }
    return Promise.reject(error);
  }
);

// Upload-specific axios instance with longer timeout
export const uploadApi = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minutes for file uploads + AI processing
});

export default api;
