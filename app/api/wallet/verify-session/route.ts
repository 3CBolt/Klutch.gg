import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { stripe } from '@/app/lib/stripe';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the session ID from the URL
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve the Stripe session
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify that this session belongs to the current user
    if (stripeSession.client_reference_id !== session.user.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 });
    }

    // Check if payment was successful
    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json({ success: false, status: stripeSession.payment_status });
    }

    // Get the amount from the session
    const amount = stripeSession.amount_total ? stripeSession.amount_total / 100 : 0;

    // Update user's wallet balance
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      amount,
      status: stripeSession.payment_status 
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
} 