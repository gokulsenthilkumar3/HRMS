'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string | null;
  employeeId?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  can: (action: 'read' | 'write' | 'delete', resource: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// ---- RBAC permission map ----
const PERMISSIONS: Record<UserRole, Record<string, string[]>> = {
  ADMIN: {
    employees:   ['read', 'write', 'delete'],
    payroll:     ['read', 'write', 'delete'],
    reports:     ['read', 'write'],
    settings:    ['read', 'write'],
    compliance:  ['read', 'write'],
    recruitment: ['read', 'write', 'delete'],
    attendance:  ['read', 'write', 'delete'],
    performance: ['read', 'write', 'delete'],
    training:    ['read', 'write', 'delete'],
    helpdesk:    ['read', 'write', 'delete'],
  },
  MANAGER: {
    employees:   ['read', 'write'],
    payroll:     ['read'],
    reports:     ['read'],
    recruitment: ['read', 'write'],
    compliance:  ['read'],
    attendance:  ['read', 'write'],
    performance: ['read', 'write'],
    training:    ['read', 'write'],
    helpdesk:    ['read', 'write'],
  },
  USER: {
    employees:   ['read'],
    payroll:     ['read'],
    attendance:  ['read', 'write'],
    performance: ['read'],
    training:    ['read'],
    helpdesk:    ['read', 'write'],
  },
};

/** Maps AuthContext UserRole to usePermission hook Role strings */
export function mapRoleToPermissionRole(role: UserRole): string {
  const map: Record<UserRole, string> = {
    ADMIN:   'superAdmin',
    MANAGER: 'hrManager',
    USER:    'employee',
  };
  return map[role] ?? 'guest';
}

function setCookie(name: string, value: string, days = 1) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('hrms_access_token');
      const storedUser  = localStorage.getItem('hrms_user');
      if (storedToken && storedUser) {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // Keep middleware cookies in sync
        setCookie('hrms_token', storedToken);
        setCookie('hrms_role', parsedUser.role);
      }
    } catch {
      /* ignore parse errors */
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Invalid email or password');
    }

    const data = await res.json() as {
      access_token: string;
      refresh_token: string;
      user: AuthUser;
    };
    const { access_token, refresh_token, user: authUser } = data;

    localStorage.setItem('hrms_access_token', access_token);
    localStorage.setItem('hrms_refresh_token', refresh_token);
    localStorage.setItem('hrms_user', JSON.stringify(authUser));

    // Set cookies for middleware route guards
    setCookie('hrms_token', access_token);
    setCookie('hrms_role', authUser.role);

    setToken(access_token);
    setUser(authUser);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* ignore */ } finally {
      localStorage.removeItem('hrms_access_token');
      localStorage.removeItem('hrms_refresh_token');
      localStorage.removeItem('hrms_user');
      deleteCookie('hrms_token');
      deleteCookie('hrms_role');
      setUser(null);
      setToken(null);
      router.push('/login');
    }
  }, [token, router]);

  const can = useCallback(
    (action: 'read' | 'write' | 'delete', resource: string): boolean => {
      if (!user) return false;
      const perms = PERMISSIONS[user.role]?.[resource] ?? [];
      return perms.includes(action);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin:   user?.role === 'ADMIN',
        isManager: user?.role === 'MANAGER' || user?.role === 'ADMIN',
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
