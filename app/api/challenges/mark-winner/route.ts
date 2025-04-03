import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { ChallengeStatus, ClubEventType } from '@prisma/client';
import { initSocket } from '@/app/lib/socket';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to mark a winner' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { challengeId, winnerId } = body;

    if (!challengeId || !winnerId) {
      return NextResponse.json(
        { error: 'Challenge ID and winner ID are required' },
        { status: 400 }
      );
    }

    // Get the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        opponent: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Verify challenge is in progress
    if (challenge.status !== ChallengeStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: 'Challenge must be in progress to mark a winner' },
        { status: 400 }
      );
    }

    // Verify user is a participant
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.id !== challenge.creatorId && user.id !== challenge.opponentId) {
      return NextResponse.json(
        { error: 'Only challenge participants can mark a winner' },
        { status: 403 }
      );
    }

    // Verify winner is a participant
    if (winnerId !== challenge.creatorId && winnerId !== challenge.opponentId) {
      return NextResponse.json(
        { error: 'Winner must be a challenge participant' },
        { status: 400 }
      );
    }

    // Update challenge and handle payouts in a transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Update challenge status and winner
      const updatedChallenge = await tx.challenge.update({
        where: { id: challengeId },
        data: {
          status: ChallengeStatus.COMPLETED,
          winnerId,
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          opponent: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      // Calculate winnings (stake * 2)
      const winnings = challenge.stake * 2;

      // Update winner's balance
      await tx.user.update({
        where: { id: winnerId },
        data: {
          balance: {
            increment: winnings,
          },
        },
      });

      // Log winner's transaction
      await tx.transaction.create({
        data: {
          userId: winnerId,
          amount: winnings,
          type: 'CHALLENGE_WINNINGS',
          description: `Winnings from ${challenge.type} challenge`,
          referenceId: challengeId,
          metadata: {
            challengeType: challenge.type,
          },
        },
      });

      // If challenge was part of a club, create a timeline event
      let clubEvent = null;
      if (challenge.clubId) {
        clubEvent = await tx.clubEvent.create({
          data: {
            type: ClubEventType.CHALLENGE_COMPLETED,
            clubId: challenge.clubId,
            userId: winnerId,
            metadata: {
              type: challenge.type,
              stake: challenge.stake,
              challengeId: challenge.id,
              winnings,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });
      }

      return { challenge: updatedChallenge, clubEvent };
    });

    // If challenge was part of a club, emit timeline event
    if (challenge.clubId && transactionResult.clubEvent) {
      const res = new NextResponse();
      const io = await initSocket(res as any);
      io.to(`club:${challenge.clubId}`).emit('club:update', {
        type: 'timeline_event',
        event: {
          id: transactionResult.clubEvent.id,
          type: transactionResult.clubEvent.type,
          userId: transactionResult.clubEvent.userId,
          userEmail: transactionResult.clubEvent.user.email,
          userName: transactionResult.clubEvent.user.name,
          timestamp: transactionResult.clubEvent.timestamp,
          metadata: transactionResult.clubEvent.metadata,
        },
      });
    }

    return NextResponse.json(transactionResult.challenge);
  } catch (error) {
    console.error('Error marking winner:', error);
    return NextResponse.json(
      { error: 'Failed to mark winner' },
      { status: 500 }
    );
  }
} 