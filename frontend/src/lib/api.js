import axios from 'axios';

// API URL from environment variable with fallback
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds timeout (long for AI operations)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging in development
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
