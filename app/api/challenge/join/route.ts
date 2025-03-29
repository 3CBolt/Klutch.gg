import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get challenge ID from request body
    const { challengeId } = await request.json();
    
    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // Find the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Validate challenge exists
    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Validate challenge is open
    if (challenge.status !== 'Open') {
      return NextResponse.json(
        { error: 'Challenge is not open for joining' },
        { status: 400 }
      );
    }

    // Validate user is not the creator
    if (challenge.creatorId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot join your own challenge' },
        { status: 400 }
      );
    }

    // Update the challenge
    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        opponentId: session.user.id,
        status: 'InProgress'
      },
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

    return NextResponse.json(updatedChallenge, { status: 200 });
  } catch (error) {
    console.error('Failed to join challenge:', error);
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    );
  }
} 