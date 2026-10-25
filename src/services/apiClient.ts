/**
 * Universal API Client for HR Management System
 * Configured to connect seamlessly to any backend (Node.js / Express, Python / FastAPI, Go, PHP / Laravel, C# .NET)
 * Supports graceful fallback to in-memory mock data when backend server is offline or in development mode.
 */

const getDefaultApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://hr-management-backend-ud5v.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getDefaultApiUrl();
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  signal?: AbortSignal;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private inFlightRequests: Map<string, Promise<any>> = new Map();
  private responseCache: Map<string, { data: any; expiry: number }> = new Map();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load persisted token if present
    try {
      this.token = localStorage.getItem('auth_token');
    } catch {
      this.token = null;
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    this.clearCache();
  }

  public getToken(): string | null {
    return this.token;
  }

  public isBackendAvailable(): boolean {
    return !FORCE_MOCK;
  }

  public clearCache(): void {
    this.responseCache.clear();
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const base = this.baseURL.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${base}${cleanEndpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const cacheKey = url;

    // 1. Return cached response if within TTL (2.5 seconds to suppress duplicate render bursts & StrictMode)
    const now = Date.now();
    const cached = this.responseCache.get(cacheKey);
    if (cached && cached.expiry > now) {
      return cached.data as T;
    }

    // 2. In-flight request deduplication: if exact same GET is currently executing, reuse its Promise
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)! as Promise<T>;
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { ...this.getDefaultHeaders(), ...options.headers },
          signal: options.signal,
        });
        const result = await this.handleResponse<T>(response);
        this.responseCache.set(cacheKey, { data: result, expiry: Date.now() + 2500 });
        return result;
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    this.inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async post<T = any>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    this.clearCache();
    const url = this.buildUrl(endpoint, options.params);
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const defaultHeaders = this.getDefaultHeaders();
    if (isFormData) {
      delete defaultHeaders['Content-Type'];
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...defaultHeaders, ...options.headers },
      body: isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined),
      signal: options.signal,
    });
    return this.handleResponse<T>(response);
  }

  async put<T = any>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    this.clearCache();
    const url = this.buildUrl(endpoint, options.params);
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const defaultHeaders = this.getDefaultHeaders();
    if (isFormData) {
      delete defaultHeaders['Content-Type'];
    }
    const response = await fetch(url, {
      method: 'PUT',
      headers: { ...defaultHeaders, ...options.headers },
      body: isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined),
      signal: options.signal,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T = any>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    this.clearCache();
    const url = this.buildUrl(endpoint, options.params);
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const defaultHeaders = this.getDefaultHeaders();
    if (isFormData) {
      delete defaultHeaders['Content-Type'];
    }
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { ...defaultHeaders, ...options.headers },
      body: isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined),
      signal: options.signal,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    this.clearCache();
    const url = this.buildUrl(endpoint, options.params);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { ...this.getDefaultHeaders(), ...options.headers },
      signal: options.signal,
    });
    return this.handleResponse<T>(response);
  }

  async upload<T = any>(endpoint: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const headers: Record<string, string> = { ...options.headers };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    // Note: Do not set Content-Type header so browser calculates multipart boundary automatically
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: options.signal,
    });
    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        try {
          localStorage.removeItem('hr_auth_user');
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // ignore json parse error on non-json error responses
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json();
    if (json && json.total !== undefined) { return json; } return json.data !== undefined ? json.data : json;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
