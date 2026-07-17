'use client';
/**
 * AuthContext — authentication state & actions for HRMS.
 * Fixes Issue #2: Proper role types aligned with usePermission hook.
 * Token key unified to 'hrms_access_token'.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setAuthToken, clearAuthToken } from '../lib/api';

export type HRMSRole = 'superAdmin' | 'hrManager' | 'teamLead' | 'employee';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: HRMSRole;
  department?: string;
  avatarUrl?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'hrms_user';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
        const token = document.cookie
          .split('; ')
          .find((r) => r.startsWith('hrms_token='))
          ?.split('=')[1];
        if (token) setAuthToken(token);
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const { access_token, user: loggedInUser } = data;
    setAuthToken(access_token);
    document.cookie = `hrms_token=${access_token}; path=/; max-age=86400; SameSite=Strict`;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    router.push('/dashboard');
  };

  const logout = () => {
    clearAuthToken();
    document.cookie = 'hrms_token=; path=/; max-age=0';
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
