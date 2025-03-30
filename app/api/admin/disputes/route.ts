import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { DisputeStatus, ChallengeStatus, TransactionType } from '@prisma/client';

// GET - List all disputes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const disputes = await prisma.dispute.findMany({
      include: {
        challenge: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                displayName: true
              }
            },
            opponent: {
              select: {
                id: true,
                name: true,
                email: true,
                displayName: true
              }
            },
            winner: {
              select: {
                id: true,
                name: true,
                email: true,
                displayName: true
              }
            }
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(disputes);
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}

// POST - Resolve dispute
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { disputeId, winnerId } = await request.json();

    if (!disputeId) {
      return NextResponse.json(
        { error: 'Dispute ID is required' },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { challenge: true }
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Update dispute and challenge in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update dispute status
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: { status: DisputeStatus.RESOLVED }
      });

      // Get the challenge to access locked funds
      const challenge = await tx.challenge.findUnique({
        where: { id: dispute.challengeId },
        select: { lockedFunds: true }
      });

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // If there's a winner, transfer the locked funds to them
      if (winnerId) {
        await tx.user.update({
          where: { id: winnerId },
          data: {
            balance: {
              increment: challenge.lockedFunds
            }
          }
        });

        // Log winner's payout transaction
        await tx.transaction.create({
          data: {
            userId: winnerId,
            amount: challenge.lockedFunds,
            type: TransactionType.CHALLENGE_WINNINGS,
            description: 'Challenge winnings awarded by admin after dispute resolution',
            referenceId: dispute.challengeId,
            metadata: {
              disputeId,
              totalStake: challenge.lockedFunds,
              resolutionType: 'winner_selected'
            }
          }
        });
      } else {
        // If no winner (draw), split the funds between creator and opponent
        const halfFunds = challenge.lockedFunds / 2;
        
        // Update creator's balance and log transaction
        await tx.user.update({
          where: { id: dispute.challenge.creatorId },
          data: {
            balance: {
              increment: halfFunds
            }
          }
        });

        await tx.transaction.create({
          data: {
            userId: dispute.challenge.creatorId,
            amount: halfFunds,
            type: TransactionType.CHALLENGE_REFUND,
            description: 'Challenge stake refunded after dispute resolution (draw)',
            referenceId: dispute.challengeId,
            metadata: {
              disputeId,
              totalStake: challenge.lockedFunds,
              resolutionType: 'draw',
              role: 'creator'
            }
          }
        });

        // Update opponent's balance and log transaction
        await tx.user.update({
          where: { id: dispute.challenge.opponentId! },
          data: {
            balance: {
              increment: halfFunds
            }
          }
        });

        await tx.transaction.create({
          data: {
            userId: dispute.challenge.opponentId!,
            amount: halfFunds,
            type: TransactionType.CHALLENGE_REFUND,
            description: 'Challenge stake refunded after dispute resolution (draw)',
            referenceId: dispute.challengeId,
            metadata: {
              disputeId,
              totalStake: challenge.lockedFunds,
              resolutionType: 'draw',
              role: 'opponent'
            }
          }
        });
      }

      // Update challenge status and winner
      const updatedChallenge = await tx.challenge.update({
        where: { id: dispute.challengeId },
        data: {
          status: ChallengeStatus.COMPLETED,
          winnerId: winnerId || null,
          lockedFunds: 0 // Release locked funds
        },
        include: {
          creator: {
            select: {
              name: true,
              email: true,
              displayName: true
            }
          },
          opponent: {
            select: {
              name: true,
              email: true,
              displayName: true
            }
          },
          winner: {
            select: {
              name: true,
              email: true,
              displayName: true
            }
          }
        }
      });

      return {
        dispute: updatedDispute,
        challenge: updatedChallenge
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json(
      { error: 'Failed to resolve dispute' },
      { status: 500 }
    );
  }
} 