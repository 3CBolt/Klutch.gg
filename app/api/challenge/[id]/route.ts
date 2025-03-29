import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { ChallengeStatus, ChallengeType } from '@prisma/client';

// Input validation type for update
type UpdateChallengeInput = {
  stake?: number;
  type?: ChallengeType;
  opponentUsername?: string;
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        opponent: {
          select: {
            name: true,
            email: true
          }
        },
        winner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Failed to fetch challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            email: true
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Verify user is the creator
    if (challenge.creator.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the creator can edit this challenge' },
        { status: 403 }
      );
    }

    // Verify challenge is still open
    if (challenge.status !== ChallengeStatus.OPEN) {
      return NextResponse.json(
        { error: 'Only open challenges can be edited' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { stake, type, opponentUsername } = body as UpdateChallengeInput;

    // Validate stake if provided
    if (stake !== undefined) {
      if (typeof stake !== 'number' || isNaN(stake) || stake <= 0) {
        return NextResponse.json(
          { error: 'Stake must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Validate type if provided
    if (type !== undefined && !Object.values(ChallengeType).includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid challenge type. Must be one of: ${Object.values(ChallengeType).join(
            ', '
          )}`,
        },
        { status: 400 }
      );
    }

    // Validate opponent if provided
    let opponentId: string | undefined = undefined;
    if (opponentUsername) {
      if (opponentUsername === session.user.email) {
        return NextResponse.json(
          { error: 'You cannot challenge yourself' },
          { status: 400 }
        );
      }

      const opponent = await prisma.user.findUnique({
        where: { email: opponentUsername }
      });

      if (!opponent) {
        return NextResponse.json(
          { error: 'Specified opponent does not exist' },
          { status: 400 }
        );
      }

      opponentId = opponent.id;
    }

    // Update the challenge
    const updateData: {
      stake?: number;
      type?: ChallengeType;
      opponentId?: string | null;
    } = {};

    if (stake !== undefined) updateData.stake = stake;
    if (type !== undefined) updateData.type = type;
    updateData.opponentId = opponentId ?? null;

    const updatedChallenge = await prisma.challenge.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        opponent: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    console.error('Failed to update challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            email: true
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Verify user is the creator
    if (challenge.creator.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the creator can delete this challenge' },
        { status: 403 }
      );
    }

    // Verify challenge is still open
    if (challenge.status !== ChallengeStatus.OPEN) {
      return NextResponse.json(
        { error: 'Only open challenges can be deleted' },
        { status: 400 }
      );
    }

    // Delete the challenge and refund the stake
    await prisma.$transaction(async (tx) => {
      // Delete the challenge
      await tx.challenge.delete({
        where: { id: params.id }
      });

      // Refund the stake to the creator
      await tx.user.update({
        where: { email: session.user.email },
        data: {
          balance: {
            increment: challenge.stake
          }
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete challenge:', error);
    return NextResponse.json(
      { error: 'Failed to delete challenge' },
      { status: 500 }
    );
  }
} 