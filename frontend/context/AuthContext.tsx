'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setAuthToken, clearAuthToken } from '../lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'vaultiq_user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
        // Retrieve token from cookie to set on apiFetch if we want it in memory too
        const token = document.cookie.split('; ').find(row => row.startsWith('vaultiq_token='))?.split('=')[1];
        if (token) setAuthToken(token);
      }
    } catch {}
    setLoading(false);
  }, []);

  const login = async (email: string) => {
    try {
      const data = await apiFetch('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      const { access_token, user: loggedInUser } = data;
      setAuthToken(access_token);
      document.cookie = `vaultiq_token=${access_token}; path=/; max-age=86400`;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Login failed');
    }
  };

  const logout = () => {
    clearAuthToken();
    document.cookie = 'vaultiq_token=; path=/; max-age=0';
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
