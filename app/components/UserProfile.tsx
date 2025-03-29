'use client';

import { useAuth, isAuthenticated } from '@/app/hooks/useAuth';

export default function UserProfile() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="animate-pulse p-4 bg-gray-100 rounded-md">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!isAuthenticated(auth)) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
        Please sign in to view your profile
      </div>
    );
  }

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Your Profile</h2>
        <div className="text-gray-600">
          <p>Name: {auth.user.name || 'Not set'}</p>
          <p>Email: {auth.user.email}</p>
        </div>
      </div>
    </div>
  );
} 