import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { AuthValueContext, type AuthContextValue } from './AuthValueContext';
import { login as loginRequest } from '../services/authService';
import type { AuthUser } from '../types/auth';

const AUTH_STORAGE_KEY = 'folio.auth.user';

function readStoredUser(): AuthUser | null {
  const value = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginRequest({ username, password });

    setUser(response.user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [login, logout, user],
  );

  return (
    <AuthValueContext.Provider value={value}>
      {children}
    </AuthValueContext.Provider>
  );
}
