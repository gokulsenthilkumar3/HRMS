const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 15000,
): Promise<T> {
  const url = `${API_BASE}${path}`;

  // Attach Authorization header from session token if available
  const token = typeof window !== 'undefined' ? (window as any).__vaultiq_token : undefined;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as object) || {}),
  };

  // Abort after timeoutMs to prevent hanging forever
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        // Token expired or invalid backend secret - force logout
        delete (window as any).__vaultiq_token;
        document.cookie = 'vaultiq_token=; path=/; max-age=0';
        localStorage.removeItem('vaultiq_user');
        window.location.href = '/login';
        return undefined as T;
      }

      let errMsg = `API Error ${res.status}: ${res.statusText}`;
      try {
        const body = await res.json();
        errMsg = body?.message || errMsg;
      } catch (_) {}
      const err = new Error(errMsg) as any;
      err.status = res.status;
      throw err;
    }

    // 204 No Content
    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
  } catch (err: any) {
    clearTimeout(timer);
    // Re-throw so callers can handle (mock fallback in AuthContext)
    throw err;
  }
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    (window as any).__vaultiq_token = token;
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    delete (window as any).__vaultiq_token;
  }
}
