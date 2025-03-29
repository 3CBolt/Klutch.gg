import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { releaseFundsToWinner } from '@/app/lib/actions/transactions';
import { ChallengeStatus } from '@prisma/client';

type SubmitResultRequest = {
  challengeId: string;
  winnerId: string;
  notes?: string;
  screenshotUrl?: string;
  disputeReason?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: SubmitResultRequest;

    // Check if the request is multipart form data
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        challengeId: formData.get('challengeId') as string,
        winnerId: formData.get('winnerId') as string,
        notes: formData.get('notes') as string || undefined,
        disputeReason: formData.get('disputeReason') as string || undefined,
        // Handle screenshot file upload here in the future
        screenshotUrl: undefined
      };
    } else {
      body = await request.json();
    }

    const { challengeId, winnerId, notes, screenshotUrl, disputeReason } = body;

    // Validate required fields
    if (!challengeId || !winnerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the challenge and verify the user is a participant
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        status: true,
        creatorId: true,
        opponentId: true,
        creatorSubmittedWinnerId: true,
        opponentSubmittedWinnerId: true,
        resultNotes: true,
        screenshotUrl: true,
        disputeReason: true,
        winnerId: true
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Verify user is a participant
    if (session.user.id !== challenge.creatorId && session.user.id !== challenge.opponentId) {
      return NextResponse.json(
        { error: 'You are not a participant in this challenge' },
        { status: 403 }
      );
    }

    // Verify challenge is in progress
    if (challenge.status !== ChallengeStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: 'Challenge is not in progress' },
        { status: 400 }
      );
    }

    // Determine if user is creator or opponent
    const isCreator = session.user.id === challenge.creatorId;

    // Update the challenge with the result submission
    const updateData: any = {
      ...(isCreator 
        ? { creatorSubmittedWinnerId: winnerId }
        : { opponentSubmittedWinnerId: winnerId }
      ),
      ...(notes && { resultNotes: notes }),
      ...(screenshotUrl && { screenshotUrl }),
      ...(disputeReason && { disputeReason })
    };

    // Check if this is the second submission and determine final status
    const otherSubmission = isCreator 
      ? challenge.opponentSubmittedWinnerId 
      : challenge.creatorSubmittedWinnerId;

    if (otherSubmission) {
      // Both players have submitted
      if (otherSubmission === winnerId) {
        // Agreement on winner
        updateData.status = ChallengeStatus.COMPLETED;
        updateData.winnerId = winnerId;
      } else {
        // Disagreement - mark as disputed
        updateData.status = ChallengeStatus.DISPUTED;
      }
    }

    // Update the challenge
    const updatedChallenge = await prisma.$transaction(async (tx) => {
      const updated = await tx.challenge.update({
        where: { id: challengeId },
        data: updateData
      });

      // If challenge is completed, release funds to winner
      if (updated.status === ChallengeStatus.COMPLETED) {
        await releaseFundsToWinner(challengeId, winnerId);
      }

      return updated;
    });

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    console.error('Error submitting challenge result:', error);
    return NextResponse.json(
      { error: 'Failed to submit challenge result' },
      { status: 500 }
    );
  }
} 