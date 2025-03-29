import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { lockFundsForChallenge, InsufficientBalanceError } from '@/app/lib/actions/transactions';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stake, type } = await request.json();

    // Create challenge and lock funds in a transaction
    const challenge = await prisma.$transaction(async (tx) => {
      // Create the challenge first
      const challenge = await tx.challenge.create({
        data: {
          creatorId: session.user.id,
          stake,
          type,
          status: 'OPEN'
        }
      });

      // Lock the funds
      await lockFundsForChallenge(session.user.id, challenge.id, stake);

      return challenge;
    });

    return NextResponse.json(challenge);
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: 'Insufficient balance to create challenge' },
        { status: 400 }
      );
    }
    
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
} 