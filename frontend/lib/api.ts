/**
 * HRMS API client
 * Automatically attaches Authorization header from localStorage.
 * Handles 401 by clearing session and redirecting to /login.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hrms_access_token');
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refresh = localStorage.getItem('hrms_refresh_token');
    if (!refresh) return null;
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem('hrms_access_token', data.access_token);
    localStorage.setItem('hrms_refresh_token', data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem('hrms_access_token');
  localStorage.removeItem('hrms_refresh_token');
  localStorage.removeItem('hrms_user');
  window.location.href = '/login';
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let token = getToken();

  const makeRequest = (t: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(options.headers ?? {}),
      },
    });

  let res = await makeRequest(token);

  // Try to refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) { clearSession(); throw new Error('Session expired'); }
    res = await makeRequest(newToken);
    if (res.status === 401) { clearSession(); throw new Error('Session expired'); }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err.message || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                  => apiFetch<T>(path),
  post:   <T>(path: string, body: unknown)   => apiFetch<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)   => apiFetch<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)   => apiFetch<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                  => apiFetch<T>(path, { method: 'DELETE' }),
};
