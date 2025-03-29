import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { lockFundsForChallenge, InsufficientBalanceError } from '@/app/lib/actions/transactions';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challengeId = params.id;

    // Join challenge and lock funds in a transaction
    const challenge = await prisma.$transaction(async (tx) => {
      const challenge = await tx.challenge.findUnique({
        where: { id: challengeId },
        select: {
          id: true,
          status: true,
          stake: true,
          creatorId: true,
          opponentId: true
        }
      });

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      if (challenge.status !== 'OPEN') {
        throw new Error('Challenge is not open');
      }

      if (challenge.creatorId === session.user.id) {
        throw new Error('Cannot join your own challenge');
      }

      if (challenge.opponentId) {
        throw new Error('Challenge already has an opponent');
      }

      // Lock the funds first
      await lockFundsForChallenge(session.user.id, challengeId, challenge.stake);

      // Update the challenge with the opponent
      const updatedChallenge = await tx.challenge.update({
        where: { id: challengeId },
        data: {
          opponentId: session.user.id,
          status: 'IN_PROGRESS'
        }
      });

      return updatedChallenge;
    });

    return NextResponse.json(challenge);
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: 'Insufficient balance to join challenge' },
        { status: 400 }
      );
    }

    console.error('Error joining challenge:', error);
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    );
  }
} 