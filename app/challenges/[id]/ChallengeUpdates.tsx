'use client';

import { useEffect } from 'react';
import { useSocket } from '@/app/hooks/useSocket';
import { toast } from 'sonner';

interface ChallengeUpdatesProps {
  challengeId: string;
  onUpdate: (data: any) => void;
}

export const ChallengeUpdates = ({ challengeId, onUpdate }: ChallengeUpdatesProps) => {
  const { subscribeToChallenge, onChallengeUpdate } = useSocket();

  useEffect(() => {
    // Subscribe to challenge updates
    subscribeToChallenge(challengeId);

    // Set up event listeners
    const cleanup = onChallengeUpdate((data) => {
      switch (data.type) {
        case 'challenge:update':
          onUpdate(data.data);
          break;
        case 'challenge:winner':
          toast.success('Winner has been marked');
          onUpdate(data.data);
          break;
        case 'challenge:dispute':
          toast.warning('Challenge has been disputed');
          onUpdate(data.data);
          break;
      }
    });

    // Cleanup on unmount
    return () => {
      cleanup?.();
    };
  }, [challengeId, onUpdate]);

  return null;
}; 