import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { ChallengeType, ChallengeStatus, ClubEventType } from '@prisma/client';
import { initSocket } from '@/app/lib/socket';

interface CreateChallengeInput {
  stake: number;
  type: ChallengeType;
  opponentUsername?: string;
  clubId?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to create a challenge' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.stake || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: stake and type are required' },
        { status: 400 }
      );
    }

    const { stake, type, opponentUsername, clubId } = body as CreateChallengeInput;

    // Validate stake is a positive number
    if (typeof stake !== 'number' || isNaN(stake) || stake <= 0) {
      return NextResponse.json(
        { error: 'Stake must be a positive number' },
        { status: 400 }
      );
    }

    // Validate challenge type
    if (!Object.values(ChallengeType).includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid challenge type. Must be one of: ${Object.values(ChallengeType).join(
            ', '
          )}`,
        },
        { status: 400 }
      );
    }

    // Validate opponent email if provided
    if (opponentUsername) {
      if (opponentUsername === session.user.email) {
        return NextResponse.json(
          { error: 'You cannot challenge yourself' },
          { status: 400 }
        );
      }
    }

    // Get the creator user
    const creator = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator account not found' },
        { status: 404 }
      );
    }

    // Check if creator has sufficient balance
    if (creator.balance < stake) {
      return NextResponse.json(
        { error: 'Insufficient balance to create challenge' },
        { status: 400 }
      );
    }

    // If opponent is specified, ensure they exist and have sufficient balance
    let opponent = null;
    if (opponentUsername) {
      opponent = await prisma.user.findUnique({
        where: { email: opponentUsername },
      });

      if (!opponent) {
        return NextResponse.json(
          { error: 'Opponent not found' },
          { status: 404 }
        );
      }

      if (opponent.balance < stake) {
        return NextResponse.json(
          { error: 'Opponent has insufficient balance' },
          { status: 400 }
        );
      }
    }

    // If clubId is provided, verify it exists and creator is a member
    if (clubId) {
      const club = await prisma.club.findUnique({
        where: { id: clubId },
        include: {
          members: {
            select: { id: true },
          },
        },
      });

      if (!club) {
        return NextResponse.json(
          { error: 'Club not found' },
          { status: 404 }
        );
      }

      const isMember = club.members.some(member => member.id === creator.id);
      if (!isMember) {
        return NextResponse.json(
          { error: 'You must be a member of the club to create a challenge' },
          { status: 403 }
        );
      }
    }

    // Create challenge and handle balance in a transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Create challenge
      const challenge = await tx.challenge.create({
        data: {
          type,
          stake,
          status: opponent ? ChallengeStatus.IN_PROGRESS : ChallengeStatus.OPEN,
          creatorId: creator.id,
          opponentId: opponent?.id,
          clubId,
          lockedFunds: opponent ? stake * 2 : stake, // Lock stakes from both players if opponent is specified
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              displayName: true,
              image: true,
            }
          },
          opponent: {
            select: {
              id: true,
              name: true,
              email: true,
              displayName: true,
              image: true,
            }
          }
        }
      });

      // Deduct stake from creator's balance
      await tx.user.update({
        where: { id: creator.id },
        data: {
          balance: {
            decrement: stake
          }
        }
      });

      // Log creator's stake deduction transaction
      await tx.transaction.create({
        data: {
          userId: creator.id,
          amount: -stake,
          type: 'CHALLENGE_ENTRY',
          description: `Stake for ${type} challenge`,
          referenceId: challenge.id,
          metadata: {
            challengeType: type,
            role: 'creator'
          }
        }
      });

      // If opponent is specified, deduct their stake too
      if (opponent) {
        await tx.user.update({
          where: { id: opponent.id },
          data: {
            balance: {
              decrement: stake
            }
          }
        });

        // Log opponent's stake deduction transaction
        await tx.transaction.create({
          data: {
            userId: opponent.id,
            amount: -stake,
            type: 'CHALLENGE_ENTRY',
            description: `Stake for ${type} challenge`,
            referenceId: challenge.id,
            metadata: {
              challengeType: type,
              role: 'opponent'
            }
          }
        });
      }

      // If challenge is created within a club, create a timeline event
      let clubEvent = null;
      if (clubId) {
        clubEvent = await tx.clubEvent.create({
          data: {
            type: ClubEventType.CHALLENGE_CREATED,
            clubId,
            userId: creator.id,
            metadata: {
              type,
              stake,
              challengeId: challenge.id,
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

      return { challenge, clubEvent };
    });

    // If challenge was created within a club, emit timeline event
    if (clubId && transactionResult.clubEvent) {
      const res = new NextResponse();
      const io = await initSocket(res as any);
      io.to(`club:${clubId}`).emit('club:update', {
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
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
} 