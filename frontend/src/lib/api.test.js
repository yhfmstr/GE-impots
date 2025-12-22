import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios before importing api module
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('api.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache to get fresh axios mock
    vi.resetModules();
  });

  it('should export API_URL constant', async () => {
    const { API_URL } = await import('./api');
    expect(API_URL).toBeDefined();
    expect(typeof API_URL).toBe('string');
  });

  it('should create axios instance with correct base config', async () => {
    await import('./api');

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should create uploadApi with longer timeout', async () => {
    await import('./api');

    // Second call should be for uploadApi
    expect(axios.create).toHaveBeenCalledTimes(2);
    expect(axios.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        timeout: 120000,
      })
    );
  });

  it('should register request interceptor', async () => {
    const { api } = await import('./api');

    expect(api.interceptors.request.use).toHaveBeenCalled();
  });

  it('should register response interceptor', async () => {
    const { api } = await import('./api');

    expect(api.interceptors.response.use).toHaveBeenCalled();
  });

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      const { api } = await import('./api');

      // Get the error handler from interceptor
      const responseInterceptorCall = api.interceptors.response.use.mock.calls[0];
      const errorHandler = responseInterceptorCall[1];

      const timeoutError = { code: 'ECONNABORTED', message: '' };

      try {
        await errorHandler(timeoutError);
      } catch (error) {
        expect(error.message).toContain('trop de temps');
      }
    });

    it('should handle network errors', async () => {
      const { api } = await import('./api');

      const responseInterceptorCall = api.interceptors.response.use.mock.calls[0];
      const errorHandler = responseInterceptorCall[1];

      const networkError = { message: '', response: undefined };

      try {
        await errorHandler(networkError);
      } catch (error) {
        expect(error.message).toContain('contacter le serveur');
      }
    });

    it('should handle rate limit errors (429)', async () => {
      const { api } = await import('./api');

      const responseInterceptorCall = api.interceptors.response.use.mock.calls[0];
      const errorHandler = responseInterceptorCall[1];

      const rateLimitError = { message: '', response: { status: 429 } };

      try {
        await errorHandler(rateLimitError);
      } catch (error) {
        expect(error.message).toContain('Trop de requêtes');
      }
    });

    it('should handle server errors (5xx)', async () => {
      const { api } = await import('./api');

      const responseInterceptorCall = api.interceptors.response.use.mock.calls[0];
      const errorHandler = responseInterceptorCall[1];

      const serverError = { message: '', response: { status: 500 } };

      try {
        await errorHandler(serverError);
      } catch (error) {
        expect(error.message).toContain('Erreur serveur');
      }
    });
  });
});
