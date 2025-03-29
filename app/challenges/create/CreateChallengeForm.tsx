'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChallengeType } from '@prisma/client';

export default function CreateChallengeForm() {
  const router = useRouter();
  const [stake, setStake] = useState('');
  const [type, setType] = useState<ChallengeType>(ChallengeType.KillRace);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate stake
      const stakeAmount = parseFloat(stake);
      if (isNaN(stakeAmount) || stakeAmount <= 0) {
        setError('Stake must be a positive number');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/challenge/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stake: stakeAmount,
          type,
          opponentUsername: opponentUsername.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create challenge');
      }

      // Refresh the challenges list before redirecting
      router.refresh();
      
      // Redirect to the challenges page
      router.push('/challenges');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="stake" className="block text-sm font-medium text-gray-700">
          Stake Amount ($)
        </label>
        <div className="mt-1">
          <input
            type="number"
            name="stake"
            id="stake"
            required
            min="1"
            step="0.01"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter stake amount"
          />
        </div>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Challenge Type
        </label>
        <div className="mt-1">
          <select
            id="type"
            name="type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as ChallengeType)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value={ChallengeType.KillRace}>Kill Race</option>
            <option value={ChallengeType.OverUnder}>Over/Under</option>
            <option value={ChallengeType.Survival}>Survival</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="opponentUsername" className="block text-sm font-medium text-gray-700">
          Opponent Email (Optional)
        </label>
        <div className="mt-1">
          <input
            type="email"
            name="opponentUsername"
            id="opponentUsername"
            value={opponentUsername}
            onChange={(e) => setOpponentUsername(e.target.value)}
            placeholder="Enter opponent's email"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Challenge'}
        </button>
      </div>
    </form>
  );
} 