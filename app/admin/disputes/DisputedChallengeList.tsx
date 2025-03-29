'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Challenge, User } from '@prisma/client';

type DisputedChallenge = Challenge & {
  creator: {
    name: string | null;
    email: string;
  };
  opponent: {
    name: string | null;
    email: string;
  } | null;
};

type Props = {
  challenges: DisputedChallenge[];
};

export default function DisputedChallengeList({ challenges }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolveDispute = async (challengeId: string, winnerId: string) => {
    try {
      setIsLoading(challengeId);
      setError(null);

      const response = await fetch('/api/admin/resolve-dispute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          winnerId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve dispute');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setIsLoading(null);
    }
  };

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No disputed challenges found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Challenge ID
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Creator
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Opponent
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Stake
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Dispute Reason
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {challenges.map((challenge) => (
              <tr key={challenge.id}>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {challenge.id}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {challenge.creator.name || challenge.creator.email}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {challenge.opponent?.name || challenge.opponent?.email}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  ${challenge.stake.toFixed(2)}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {challenge.disputeReason || 'No reason provided'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => resolveDispute(challenge.id, challenge.creatorId)}
                      disabled={isLoading === challenge.id}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isLoading === challenge.id ? 'Processing...' : 'Creator Won'}
                    </button>
                    <button
                      onClick={() => resolveDispute(challenge.id, challenge.opponentId!)}
                      disabled={isLoading === challenge.id}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isLoading === challenge.id ? 'Processing...' : 'Opponent Won'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 