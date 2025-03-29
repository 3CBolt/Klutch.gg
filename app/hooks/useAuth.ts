'use client';

import { useSession } from 'next-auth/react';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user as User | null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    // Type guard function
    isUser: (user: any): user is User => {
      return user && typeof user === 'object' && 'email' in user;
    }
  };
}

// Type guard to check if user is authenticated
export function isAuthenticated(auth: ReturnType<typeof useAuth>): auth is ReturnType<typeof useAuth> & { user: User } {
  return auth.isAuthenticated && auth.user !== null;
} 