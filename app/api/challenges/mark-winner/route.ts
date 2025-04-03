import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { handleError, Errors } from "@/lib/errors";
import { z } from "zod";
import { ChallengeStatus, ClubEventType } from "@prisma/client";
import { emitToRoom } from "@/lib/server";

const MarkWinnerSchema = z.object({
  challengeId: z.string(),
  winnerId: z.string(),
  notes: z.string().optional(),
  screenshotUrl: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw Errors.Unauthorized;
    }

    const body = await request.json();
    const result = MarkWinnerSchema.safeParse(body);
    
    if (!result.success) {
      throw Errors.ValidationError(result.error.errors[0].message);
    }

    const { challengeId, winnerId, notes, screenshotUrl } = result.data;

    // Fetch challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: true,
        opponent: true,
      },
    });

    if (!challenge) {
      throw Errors.NotFound;
    }

    // Verify user is part of the challenge
    if (challenge.creatorId !== session.user.id && challenge.opponentId !== session.user.id) {
      throw Errors.Forbidden;
    }

    // Verify challenge is in progress
    if (challenge.status !== "IN_PROGRESS") {
      throw Errors.BadRequest("Challenge must be in progress to mark a winner");
    }

    // Verify winner is part of the challenge
    if (winnerId !== challenge.creatorId && winnerId !== challenge.opponentId) {
      throw Errors.BadRequest("Winner must be a participant in the challenge");
    }

    // Update challenge with winner submission
    const updatedChallenge = await prisma.$transaction(async (tx) => {
      // Update challenge
      const updated = await tx.challenge.update({
        where: { id: challengeId },
        data: {
          [session.user.id === challenge.creatorId ? "creatorSubmittedWinnerId" : "opponentSubmittedWinnerId"]: winnerId,
          resultNotes: notes,
          screenshotUrl,
        },
      });

      // If both parties agree on the winner, complete the challenge
      if (
        updated.creatorSubmittedWinnerId &&
        updated.opponentSubmittedWinnerId &&
        updated.creatorSubmittedWinnerId === updated.opponentSubmittedWinnerId
      ) {
        const winnerUpdate = await tx.challenge.update({
          where: { id: challengeId },
          data: {
            status: "COMPLETED",
            winnerId,
          },
        });

        // Transfer winnings
        const totalPrize = challenge.stake * 2;
        await tx.user.update({
          where: { id: winnerId },
          data: {
            balance: { increment: totalPrize },
            wins: { increment: 1 },
          },
        });

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: winnerId,
            amount: totalPrize,
            type: "CHALLENGE_WINNINGS",
            description: `Won challenge ${challengeId}`,
            referenceId: challengeId,
          },
        });

        // Create club event if challenge was part of a club
        if (challenge.clubId) {
          await tx.clubEvent.create({
            data: {
              type: ClubEventType.CHALLENGE_COMPLETED,
              clubId: challenge.clubId,
              userId: winnerId,
              metadata: {
                challengeType: challenge.type,
                stake: challenge.stake,
                challengeId: challenge.id,
                winnings: totalPrize,
              },
            },
          });

          // Emit club event
          emitToRoom(`club:${challenge.clubId}`, "club:update", {
            type: "challenge_completed",
            challengeId: challenge.id,
            winnerId,
            stake: challenge.stake,
            totalPrize,
          });
        }

        return winnerUpdate;
      }

      return updated;
    });

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error, "MarkWinner");
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
