'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/'
      });
      
      // Clear any local storage or other client-side data here if needed
      localStorage.clear();
      sessionStorage.clear();
      
      // Force a hard reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback to basic redirect if something goes wrong
      router.push('/');
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
    >
      Sign Out
    </button>
  );
} 