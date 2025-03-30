'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ChallengeStatus } from '@prisma/client';

interface MarkWinnerProps {
  challenge: {
    id: string;
    status: ChallengeStatus;
    creatorId: string;
    opponentId: string | null;
    creator: {
      id: string;
      name: string | null;
      displayName: string | null;
    };
    opponent: {
      id: string;
      name: string | null;
      displayName: string | null;
    } | null;
    creatorSubmittedWinnerId?: string | null;
    opponentSubmittedWinnerId?: string | null;
  };
  onStatusChange?: () => void;
}

export function MarkWinner({ challenge, onStatusChange }: MarkWinnerProps) {
  const { data: session } = useSession();
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!session?.user?.email || !challenge.opponent) return null;

  const isParticipant = 
    challenge.creatorId === session.user.id || 
    challenge.opponentId === session.user.id;

  const hasAlreadySubmitted = 
    (challenge.creatorId === session.user.id && challenge.creatorSubmittedWinnerId) ||
    (challenge.opponentId === session.user.id && challenge.opponentSubmittedWinnerId);

  if (!isParticipant || hasAlreadySubmitted || 
      challenge.status !== ChallengeStatus.IN_PROGRESS) {
    return null;
  }

  const getWinnerName = (winnerId: string) => {
    if (winnerId === challenge.creatorId) {
      return challenge.creator.displayName || challenge.creator.name;
    }
    return challenge.opponent?.displayName || challenge.opponent?.name;
  };

  const handleSubmit = async () => {
    if (!selectedWinner) {
      toast.error('Please select a winner');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/challenges/mark-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          winnerId: selectedWinner,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark winner');
      }

      if (data.status === 'COMPLETED') {
        toast.success('Challenge completed! Winner has been marked.');
      } else if (data.status === 'DISPUTED') {
        toast.error('Players disagree on the winner. A dispute has been created.');
      } else {
        toast.success('Your selection has been recorded. Waiting for other player.');
      }

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark winner');
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <h3 className="text-lg font-semibold">Mark Winner</h3>
      <div className="flex gap-4">
        <Select
          value={selectedWinner}
          onValueChange={setSelectedWinner}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select winner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={challenge.creatorId}>
              {challenge.creator.displayName || challenge.creator.name}
            </SelectItem>
            <SelectItem value={challenge.opponent.id}>
              {challenge.opponent.displayName || challenge.opponent.name}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            if (!selectedWinner) {
              toast.error('Please select a winner');
              return;
            }
            if (confirm(`Are you sure you want to mark ${getWinnerName(selectedWinner)} as the winner? This action cannot be undone. If the other player disagrees, a dispute will be created.`)) {
              handleSubmit();
            }
          }}
          disabled={isSubmitting || !selectedWinner}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Winner'}
        </Button>
      </div>
    </div>
  );
} 