import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { TransactionType, ChallengeStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId, winnerId } = await request.json();

    if (!challengeId || !winnerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the challenge exists and user is a participant
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: true,
        opponent: true,
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Verify user is a participant in the challenge
    if (challenge.creatorId !== user.id && challenge.opponentId !== user.id) {
      return NextResponse.json(
        { error: 'Only challenge participants can mark winners' },
        { status: 403 }
      );
    }

    // Verify the marked winner is a participant
    if (winnerId !== challenge.creatorId && winnerId !== challenge.opponentId) {
      return NextResponse.json(
        { error: 'Selected winner must be a challenge participant' },
        { status: 400 }
      );
    }

    // Update the challenge with the user's winner submission
    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: user.id === challenge.creatorId
        ? { creatorSubmittedWinnerId: winnerId }
        : { opponentSubmittedWinnerId: winnerId },
    });

    // If both players have submitted and agree on the winner
    if (
      updatedChallenge.creatorSubmittedWinnerId &&
      updatedChallenge.opponentSubmittedWinnerId &&
      updatedChallenge.creatorSubmittedWinnerId === updatedChallenge.opponentSubmittedWinnerId
    ) {
      // Handle completion and payout in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Calculate total payout (combined stakes)
        const totalPayout = challenge.lockedFunds;

        // Update winner's balance
        await tx.user.update({
          where: { id: winnerId },
          data: {
            balance: {
              increment: totalPayout,
            },
          },
        });

        // Log winner's payout transaction
        await tx.transaction.create({
          data: {
            userId: winnerId,
            amount: totalPayout,
            type: TransactionType.CHALLENGE_WINNINGS,
            description: `Winnings from ${challenge.type} challenge`,
            referenceId: challenge.id,
            metadata: {
              challengeType: challenge.type,
              totalStake: totalPayout,
              role: winnerId === challenge.creatorId ? 'creator' : 'opponent'
            }
          }
        });

        // Mark challenge as completed and set the winner
        const completedChallenge = await tx.challenge.update({
          where: { id: challengeId },
          data: {
            status: ChallengeStatus.COMPLETED,
            winnerId: updatedChallenge.creatorSubmittedWinnerId,
            lockedFunds: 0, // Release locked funds
          },
          include: {
            winner: {
              select: {
                name: true,
                email: true,
                displayName: true,
              }
            }
          }
        });

        return completedChallenge;
      });

      return NextResponse.json({ 
        status: 'COMPLETED', 
        winnerId,
        winner: result.winner,
        payout: challenge.lockedFunds
      });
    }

    // If both players have submitted but disagree
    if (
      updatedChallenge.creatorSubmittedWinnerId &&
      updatedChallenge.opponentSubmittedWinnerId &&
      updatedChallenge.creatorSubmittedWinnerId !== updatedChallenge.opponentSubmittedWinnerId
    ) {
      // Create a dispute
      await prisma.dispute.create({
        data: {
          challengeId,
          reason: 'Players disagree on the winner',
          users: {
            connect: [
              { id: challenge.creatorId },
              { id: challenge.opponentId! },
            ],
          },
        },
      });

      // Update challenge status to DISPUTED
      await prisma.challenge.update({
        where: { id: challengeId },
        data: { status: 'DISPUTED' },
      });

      return NextResponse.json({ status: 'DISPUTED' });
    }

    // If waiting for the other player
    return NextResponse.json({ status: 'PENDING_OTHER_PLAYER' });
  } catch (error) {
    console.error('Error marking winner:', error);
    return NextResponse.json(
      { error: 'Failed to mark winner' },
      { status: 500 }
    );
  }
} 