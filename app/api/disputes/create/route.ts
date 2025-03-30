import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId, reason } = await request.json();

    if (!challengeId || !reason) {
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
        { error: 'Only challenge participants can create disputes' },
        { status: 403 }
      );
    }

    // Create the dispute
    const dispute = await prisma.dispute.create({
      data: {
        challengeId,
        reason,
        users: {
          connect: [{ id: user.id }],
        },
      },
    });

    // Update challenge status to DISPUTED
    await prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'DISPUTED' },
    });

    return NextResponse.json(dispute);
  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to create dispute' },
      { status: 500 }
    );
  }
} 