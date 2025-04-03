'use client';

import { useState } from 'react';
import { useSocket } from '@/app/hooks/useSocket';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { ChallengeStatus } from '@prisma/client';

interface MarkWinnerSectionProps {
  challengeId: string;
  isCreator: boolean;
  isOpponent: boolean;
  onWinnerMarked: () => void;
}

export const MarkWinnerSection = ({
  challengeId,
  isCreator,
  isOpponent,
  onWinnerMarked,
}: MarkWinnerSectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();

  const handleMarkWinner = async (winner: 'creator' | 'opponent') => {
    try {
      setIsLoading(true);
      socket?.emit('challenge:winner', {
        challengeId,
        winner,
      });
      toast.success('Winner marked successfully');
      onWinnerMarked();
    } catch (error) {
      console.error('Failed to mark winner:', error);
      toast.error('Failed to mark winner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispute = async () => {
    try {
      setIsLoading(true);
      socket?.emit('challenge:dispute', {
        challengeId,
      });
      toast.success('Challenge disputed');
      onWinnerMarked();
    } catch (error) {
      console.error('Failed to dispute challenge:', error);
      toast.error('Failed to dispute challenge');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCreator && !isOpponent) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mark Winner</h3>
      <div className="flex gap-4">
        {isCreator && (
          <Button
            onClick={() => handleMarkWinner('creator')}
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? 'Marking...' : 'Mark Me as Winner'}
          </Button>
        )}
        {isOpponent && (
          <Button
            onClick={() => handleMarkWinner('opponent')}
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? 'Marking...' : 'Mark Me as Winner'}
          </Button>
        )}
        <Button
          onClick={handleDispute}
          disabled={isLoading}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {isLoading ? 'Disputing...' : 'Dispute Challenge'}
        </Button>
      </div>
    </div>
  );
}; 