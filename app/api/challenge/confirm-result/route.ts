import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/app/lib/prisma";
import { ChallengeStatus } from "@prisma/client";
import { releaseFundsToWinner } from "@/app/lib/actions/transactions";
import { handleError, Errors } from "@/lib/errors";
import { z } from "zod";

const ConfirmResultSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required"),
  isConfirmed: z.boolean(),
  disputeReason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw Errors.Unauthorized;
    }

    const body = await request.json();
    const result = ConfirmResultSchema.safeParse(body);
    
    if (!result.success) {
      throw Errors.ValidationError(result.error.errors[0].message);
    }

    const { challengeId, isConfirmed, disputeReason } = result.data;

    // Get the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        status: true,
        creatorId: true,
        opponentId: true,
        creatorSubmittedWinnerId: true,
        opponentSubmittedWinnerId: true,
        winnerId: true,
      },
    });

    if (!challenge) {
      throw Errors.NotFound;
    }

    // Verify user is a participant
    if (
      session.user.id !== challenge.creatorId &&
      session.user.id !== challenge.opponentId
    ) {
      throw Errors.Forbidden;
    }

    // Determine if user is creator or opponent
    const isCreator = session.user.id === challenge.creatorId;
    const submittedWinnerId = isCreator
      ? challenge.opponentSubmittedWinnerId
      : challenge.creatorSubmittedWinnerId;

    // Verify there is a result to confirm
    if (!submittedWinnerId) {
      throw Errors.BadRequest("No result has been submitted to confirm");
    }

    // Handle confirmation/dispute
    const updateData: any = {
      status: isConfirmed
        ? ChallengeStatus.COMPLETED
        : ChallengeStatus.DISPUTED,
      ...(isConfirmed && { winnerId: submittedWinnerId }),
      ...(disputeReason && { disputeReason }),
    };

    // Update the challenge in a transaction
    const updatedChallenge = await prisma.$transaction(async (tx) => {
      const updated = await tx.challenge.update({
        where: { id: challengeId },
        data: updateData,
      });

      // If challenge is completed, release funds to winner
      if (updated.status === ChallengeStatus.COMPLETED && updated.winnerId) {
        await releaseFundsToWinner(challengeId, updated.winnerId);
      }

      return updated;
    });

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error, "ConfirmResult");
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
