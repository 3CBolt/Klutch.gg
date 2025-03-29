'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Challenge, ChallengeType } from '@prisma/client';
import toast from 'react-hot-toast';

interface EditChallengeFormProps {
  challenge: Challenge & {
    creator: {
      name: string | null;
      email: string;
    };
  };
}

export default function EditChallengeForm({ challenge }: EditChallengeFormProps) {
  const router = useRouter();
  const [stake, setStake] = useState(challenge.stake.toString());
  const [type, setType] = useState<ChallengeType>(challenge.type);
  const [opponentUsername, setOpponentUsername] = useState(challenge.opponentId || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate stake
      const stakeAmount = parseFloat(stake);
      if (isNaN(stakeAmount) || stakeAmount <= 0) {
        toast.error('Stake must be a positive number');
        return;
      }

      const response = await fetch(`/api/challenge/${challenge.id}`, {
        method: 'PATCH',
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
        throw new Error(data.error || 'Failed to update challenge');
      }

      toast.success('Challenge updated successfully');
      
      // Refresh the challenges list before redirecting
      router.refresh();
      
      // Redirect to the challenge details page
      router.push(`/challenges/${challenge.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update challenge');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 