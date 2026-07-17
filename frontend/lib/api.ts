import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────

axiosInstance.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hrms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401/403 ──────────────────────────────

axiosInstance.interceptors.response.use(
  res => res,
  async err => {
    const status = err.response?.status;
    if (status === 401) {
      // Try refresh
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('hrms_refresh') : null;
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh });
          localStorage.setItem('hrms_token',   data.access_token);
          localStorage.setItem('hrms_refresh',  data.refresh_token);
          err.config.headers.Authorization = `Bearer ${data.access_token}`;
          return axiosInstance.request(err.config);
        } catch {
          localStorage.removeItem('hrms_token');
          localStorage.removeItem('hrms_refresh');
          window.location.href = '/auth/login';
        }
      } else {
        window.location.href = '/auth/login';
      }
    }
    if (status === 403) {
      console.warn('[API] 403 Forbidden — insufficient permissions');
    }
    return Promise.reject(err.response?.data ?? err);
  },
);

// ── Typed helpers ──────────────────────────────────────────────────────────────

export const api = {
  get:    <T>(url: string, params?: Record<string,any>)                   => axiosInstance.get<T>(url,{params}).then((r:AxiosResponse<T>)=>r.data),
  post:   <T>(url: string, data: unknown)                                 => axiosInstance.post<T>(url,data).then((r:AxiosResponse<T>)=>r.data),
  put:    <T>(url: string, data: unknown)                                 => axiosInstance.put<T>(url,data).then((r:AxiosResponse<T>)=>r.data),
  patch:  <T>(url: string, data: unknown)                                 => axiosInstance.patch<T>(url,data).then((r:AxiosResponse<T>)=>r.data),
  delete: <T>(url: string)                                                => axiosInstance.delete<T>(url).then((r:AxiosResponse<T>)=>r.data),
};

export default axiosInstance;
