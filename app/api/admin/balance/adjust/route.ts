import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get request body
    const { userId, amount, reason } = await request.json();

    // Validate required fields
    if (!userId || amount === undefined || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, and reason are required' },
        { status: 400 }
      );
    }

    // Validate amount is a number
    if (typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Amount must be a valid number' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate new balance
    const newBalance = user.balance + amount;

    // Prevent negative balance
    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Cannot set balance below zero' },
        { status: 400 }
      );
    }

    // Update user balance and create transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: newBalance,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          amount,
          type: amount > 0 ? 'DEPOSIT' : 'CHALLENGE_REFUND',
          description: `Admin adjustment: ${reason}`,
          metadata: {
            adjustedBy: session.user.id,
            reason,
          },
        },
      });

      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      user: result,
      message: 'Balance adjusted successfully',
    });
  } catch (error) {
    console.error('Failed to adjust balance:', error);
    return NextResponse.json(
      { error: 'Failed to adjust balance' },
      { status: 500 }
    );
  }
} 