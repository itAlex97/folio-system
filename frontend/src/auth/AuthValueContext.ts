import { createContext } from 'react';

import type { AuthUser } from '../types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthValueContext = createContext<AuthContextValue | undefined>(
  undefined,
);
