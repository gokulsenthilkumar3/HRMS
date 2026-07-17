/**
 * Centralized Axios instance with JWT auth interceptor.
 * All API calls should use this instance — never raw fetch().
 * Resolves Issue #8: Replace raw fetch() with Axios + interceptors
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT access token from localStorage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hrms_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (silent refresh) and 403 (RBAC denied)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;
        localStorage.setItem('hrms_access_token', newToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch {
        localStorage.removeItem('hrms_access_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    if (error.response?.status === 403) {
      // Forbidden — user lacks permission for this action
      console.warn('[HRMS] Access denied:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;
