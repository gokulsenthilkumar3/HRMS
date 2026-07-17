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

const AuthContext = createContext<AuthContextValue | null>(null);

// ---- RBAC permission map ----
const PERMISSIONS: Record<UserRole, Record<string, string[]>> = {
  ADMIN: {
    employees: ['read', 'write', 'delete'],
    payroll:   ['read', 'write', 'delete'],
    reports:   ['read', 'write'],
    settings:  ['read', 'write'],
    compliance:['read', 'write'],
    recruitment:['read','write','delete'],
  },
  MANAGER: {
    employees:  ['read', 'write'],
    payroll:    ['read'],
    reports:    ['read'],
    recruitment:['read','write'],
    compliance: ['read'],
  },
  USER: {
    employees:  ['read'],
    payroll:    ['read'],
  },
};

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
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
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
      throw new Error(err.message || 'Invalid email or password');
    }

    const data = await res.json();
    const { access_token, refresh_token, user: authUser } = data;

    localStorage.setItem('hrms_access_token', access_token);
    localStorage.setItem('hrms_refresh_token', refresh_token);
    localStorage.setItem('hrms_user', JSON.stringify(authUser));

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
