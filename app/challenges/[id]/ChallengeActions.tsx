'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChallengeStatus } from '@prisma/client';
import toast from 'react-hot-toast';

interface ChallengeActionsProps {
  challengeId: string;
  canEdit: boolean;
  canDelete: boolean;
  canJoin: boolean;
  status: ChallengeStatus;
}

export default function ChallengeActions({
  challengeId,
  canEdit,
  canDelete,
  canJoin,
  status
}: ChallengeActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    router.push(`/challenges/${challengeId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this challenge?')) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/challenge/${challengeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete challenge');
      }

      toast.success('Challenge deleted successfully');
      router.push('/challenges');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = () => {
    router.push(`/challenges/${challengeId}/join`);
  };

  return (
    <div className="flex space-x-3">
      {canEdit && (
        <button
          onClick={handleEdit}
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Edit Challenge
        </button>
      )}

      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {isLoading ? 'Deleting...' : 'Delete Challenge'}
        </button>
      )}

      {canJoin && (
        <button
          onClick={handleJoin}
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          Join Challenge
        </button>
      )}

      <button
        onClick={() => router.back()}
        disabled={isLoading}
        className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Back
      </button>
    </div>
  );
} 