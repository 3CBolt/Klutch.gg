'use client';

import { MarkWinner } from '@/app/components/challenges/MarkWinner';
import { Challenge, ChallengeStatus } from '@prisma/client';

interface MarkWinnerSectionProps {
  challenge: Challenge & {
    creator: {
      id: string;
      name: string | null;
      displayName: string | null;
      email: string | null;
    };
    opponent: {
      id: string;
      name: string | null;
      displayName: string | null;
      email: string | null;
    } | null;
  };
  isParticipant: boolean;
}

export function MarkWinnerSection({ challenge, isParticipant }: MarkWinnerSectionProps) {
  if (challenge.status !== ChallengeStatus.IN_PROGRESS || !isParticipant) {
    return null;
  }

  return (
    <div className="mt-8">
      <MarkWinner
        challenge={challenge}
        onStatusChange={() => {
          window.location.reload();
        }}
      />
    </div>
  );
} 