'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { Challenge } from '@/types';

export default function JoinChallengePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Fetch challenge details
    const fetchChallenge = async () => {
      try {
        const response = await fetch(`/api/challenge/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch challenge');
        }

        setChallenge(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch challenge');
      }
    };

    fetchChallenge();
  }, [params.id, user, authLoading, router]);

  const handleJoinChallenge = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/challenge/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: params.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join challenge');
      }

      // Redirect to challenge details page after successful join
      router.push('/challenges');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join challenge');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !challenge) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Join Challenge</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Challenge Details</h2>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-500">
                  Type: {challenge.type}
                </p>
                <p className="text-sm text-gray-500">
                  Created by: {challenge.creator.name || challenge.creator.email}
                </p>
                <p className="text-sm text-gray-500">
                  Stake: ${challenge.stake}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to join this challenge? This will commit you to the stake amount.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={handleJoinChallenge}
                  disabled={isLoading}
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Joining...' : 'Join Challenge'}
                </button>
                <button
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 