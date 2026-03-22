import { useContext } from 'react';

import { AuthValueContext, type AuthContextValue } from './AuthValueContext';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthValueContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
