'use client';

import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  balance?: number;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
}

export function useAuth(): AuthState {
  const { data: session, status } = useSession();

  return {
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    user: session?.user as User | null,
  };
}

export function isAuthenticated(auth: AuthState): auth is AuthState & { user: User } {
  return auth.isAuthenticated && auth.user !== null;
} 