import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { ChallengeType, ChallengeStatus } from '@prisma/client';

// Input validation type
type CreateChallengeInput = {
  stake: number;
  type: ChallengeType;
  opponentUsername?: string;
};

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

    const { stake, type, opponentUsername } = body as CreateChallengeInput;

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
          { error: 'Specified opponent does not exist' },
          { status: 400 }
        );
      }

      // Check opponent's balance
      if (opponent.balance < stake) {
        return NextResponse.json(
          { error: 'Opponent has insufficient balance for this challenge' },
          { status: 400 }
        );
      }
    }

    // Create challenge and handle balance in a transaction
    const challenge = await prisma.$transaction(async (tx) => {
      // Create the challenge first to get the ID
      const challenge = await tx.challenge.create({
        data: {
          creatorId: creator.id,
          opponentId: opponent?.id || null,
          stake,
          type,
          status: opponent ? ChallengeStatus.IN_PROGRESS : ChallengeStatus.OPEN,
          lockedFunds: opponent ? stake * 2 : stake, // Lock stakes from both players if opponent exists
        },
        include: {
          creator: {
            select: {
              name: true,
              email: true,
              displayName: true,
            }
          },
          opponent: {
            select: {
              name: true,
              email: true,
              displayName: true,
            }
          }
        }
      });

      // Deduct stake from creator's balance
      await tx.user.update({
        where: { id: creator.id },
        data: {
          balance: {
            decrement: stake,
          },
        },
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

      // If there's a direct opponent, deduct their stake too
      if (opponent) {
        await tx.user.update({
          where: { id: opponent.id },
          data: {
            balance: {
              decrement: stake,
            },
          },
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

      return challenge;
    });

    return NextResponse.json({ 
      success: true,
      challenge,
      redirect: '/challenges'
    });
  } catch (error: any) {
    console.error('Error creating challenge:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A similar challenge already exists' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create challenge. Please try again later.' },
      { status: 500 }
    );
  }
} 