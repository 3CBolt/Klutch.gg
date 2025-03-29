import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { ChallengeStatus } from '@prisma/client';
import { releaseFundsToWinner } from '@/app/lib/actions/transactions';

type ConfirmResultRequest = {
  challengeId: string;
  isConfirmed: boolean;
  disputeReason?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ConfirmResultRequest = await request.json();
    const { challengeId, isConfirmed, disputeReason } = body;

    // Validate required fields
    if (!challengeId || isConfirmed === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        status: true,
        creatorId: true,
        opponentId: true,
        creatorSubmittedWinnerId: true,
        opponentSubmittedWinnerId: true,
        winnerId: true,
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Verify user is a participant
    if (session.user.id !== challenge.creatorId && session.user.id !== challenge.opponentId) {
      return NextResponse.json(
        { error: 'You are not a participant in this challenge' },
        { status: 403 }
      );
    }

    // Determine if user is creator or opponent
    const isCreator = session.user.id === challenge.creatorId;
    const submittedWinnerId = isCreator 
      ? challenge.opponentSubmittedWinnerId 
      : challenge.creatorSubmittedWinnerId;

    // Verify there is a result to confirm
    if (!submittedWinnerId) {
      return NextResponse.json(
        { error: 'No result has been submitted to confirm' },
        { status: 400 }
      );
    }

    // Handle confirmation/dispute
    const updateData: any = {
      status: isConfirmed ? ChallengeStatus.COMPLETED : ChallengeStatus.DISPUTED,
      ...(isConfirmed && { winnerId: submittedWinnerId }),
      ...(disputeReason && { disputeReason })
    };

    // Update the challenge in a transaction
    const updatedChallenge = await prisma.$transaction(async (tx) => {
      const updated = await tx.challenge.update({
        where: { id: challengeId },
        data: updateData
      });

      // If challenge is completed, release funds to winner
      if (updated.status === ChallengeStatus.COMPLETED && updated.winnerId) {
        await releaseFundsToWinner(challengeId, updated.winnerId);
      }

      return updated;
    });

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    console.error('Error confirming/disputing result:', error);
    return NextResponse.json(
      { error: 'Failed to confirm/dispute result' },
      { status: 500 }
    );
  }
} 