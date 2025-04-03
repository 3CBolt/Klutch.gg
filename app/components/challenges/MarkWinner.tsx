'use client';

import { useState } from 'react';
import { Challenge, ChallengeStatus, User } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface MarkWinnerProps {
  challenge: Challenge & {
    creator: User;
    opponent: User | null;
  };
  onStatusChange: (newStatus: ChallengeStatus, winner?: User, disputeReason?: string) => void;
}

export function MarkWinner({ challenge, onStatusChange }: MarkWinnerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const isCreator = session?.user?.id === challenge.creatorId;
  const isOpponent = session?.user?.id === challenge.opponentId;

  const handleMarkWinner = async (winnerId: string) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/challenges/mark-winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          winnerId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark winner');
      }

      const winner = winnerId === challenge.creatorId ? challenge.creator : challenge.opponent || undefined;
      onStatusChange(ChallengeStatus.COMPLETED, winner);
      toast.success('Winner marked successfully');
      router.refresh();
    } catch (error) {
      console.error('Error marking winner:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark winner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/challenges/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          reason: disputeReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit dispute');
      }

      onStatusChange(ChallengeStatus.DISPUTED, undefined, disputeReason);
      setShowDisputeDialog(false);
      toast.success('Dispute submitted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error submitting dispute:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Mark Winner</h3>
        <p className="text-sm text-gray-500">
          Select who won the challenge. This action cannot be undone.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => handleMarkWinner(challenge.creatorId)}
          disabled={isSubmitting}
          className="flex-1 min-h-[44px]"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin mr-2">⌛</span>
          ) : null}
          {challenge.creator.displayName || challenge.creator.name || 'Creator'}
        </Button>
        <Button
          onClick={() => handleMarkWinner(challenge.opponentId!)}
          disabled={isSubmitting}
          className="flex-1 min-h-[44px]"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin mr-2">⌛</span>
          ) : null}
          {challenge.opponent?.displayName || challenge.opponent?.name || 'Opponent'}
        </Button>
      </div>

      <div className="pt-2">
        <Button
          className="w-full min-h-[44px] bg-red-500 hover:bg-red-600 text-white"
          onClick={() => setShowDisputeDialog(true)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin mr-2">⌛</span>
          ) : null}
          Submit Dispute
        </Button>
      </div>

      {showDisputeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Submit Dispute</h3>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Please explain why you are disputing this challenge..."
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              disabled={isSubmitting}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                className="min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-900"
                onClick={() => setShowDisputeDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDispute}
                disabled={isSubmitting || !disputeReason.trim()}
                className="min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 animate-spin mr-2">⌛</span>
                ) : null}
                Submit Dispute
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 