'use client';

import { useState, useEffect } from 'react';
import { DisputeStatus } from '@prisma/client';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  displayName: string | null;
}

interface Challenge {
  id: string;
  stake: number;
  status: string;
  creator: User;
  opponent: User | null;
  winner: User | null;
}

interface Dispute {
  id: string;
  reason: string;
  status: DisputeStatus;
  createdAt: string;
  challenge: Challenge;
  users: User[];
}

export default function AdminDisputeList() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await fetch('/api/admin/disputes');
      if (!response.ok) {
        throw new Error('Failed to fetch disputes');
      }
      const data = await response.json();
      setDisputes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (disputeId: string, winnerId: string | null) => {
    try {
      const response = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ disputeId, winnerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve dispute');
      }

      // Refresh disputes list
      await fetchDisputes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading disputes...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (!disputes.length) {
    return <div className="text-center py-8">No disputes found.</div>;
  }

  return (
    <div className="space-y-6">
      {disputes.map((dispute) => (
        <div
          key={dispute.id}
          className="bg-white shadow rounded-lg p-6 border border-gray-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                Dispute ID: {dispute.id}
              </h3>
              <p className="text-sm text-gray-500">
                Created: {new Date(dispute.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                dispute.status === DisputeStatus.PENDING
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {dispute.status}
            </span>
          </div>

          <div className="mb-4">
            <h4 className="font-medium mb-2">Challenge Details:</h4>
            <p>Stake: ${dispute.challenge.stake}</p>
            <p>Creator: {dispute.challenge.creator.displayName || dispute.challenge.creator.name}</p>
            {dispute.challenge.opponent && (
              <p>Opponent: {dispute.challenge.opponent.displayName || dispute.challenge.opponent.name}</p>
            )}
            {dispute.challenge.winner && (
              <p>Current Winner: {dispute.challenge.winner.displayName || dispute.challenge.winner.name}</p>
            )}
          </div>

          <div className="mb-4">
            <h4 className="font-medium mb-2">Dispute Reason:</h4>
            <p className="text-gray-700">{dispute.reason}</p>
          </div>

          {dispute.status === DisputeStatus.PENDING && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium mb-2">Resolve Dispute:</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => resolveDispute(dispute.id, dispute.challenge.creator.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  Creator Wins
                </button>
                {dispute.challenge.opponent && (
                  <button
                    onClick={() => resolveDispute(dispute.id, dispute.challenge.opponent.id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  >
                    Opponent Wins
                  </button>
                )}
                <button
                  onClick={() => resolveDispute(dispute.id, null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                >
                  No Winner (Draw)
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 