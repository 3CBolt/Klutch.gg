import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { handleError, Errors } from "@/lib/errors";
import { emitToRoom } from "@/lib/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw Errors.Unauthorized;
    }

    const challengeId = params.id;

    // Fetch challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });

    if (!challenge) {
      throw Errors.NotFound;
    }

    // Verify challenge is open
    if (challenge.status !== "OPEN") {
      throw Errors.BadRequest("Challenge is not open for joining");
    }

    // Verify user is not the creator
    if (challenge.creatorId === session.user.id) {
      throw Errors.BadRequest("Cannot join your own challenge");
    }

    // Check user balance and get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        balance: true,
        name: true,
        displayName: true,
      },
    });

    if (!user || user.balance < challenge.stake) {
      throw Errors.BadRequest("Insufficient balance to join challenge");
    }

    // Join challenge and handle funds in a transaction
    const updatedChallenge = await prisma.$transaction(async (tx) => {
      // Update challenge
      const updated = await tx.challenge.update({
        where: { id: challengeId },
        data: {
          status: "IN_PROGRESS",
          opponentId: session.user.id,
          lockedFunds: { increment: challenge.stake },
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
          opponent: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      });

      // Lock opponent's funds
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          balance: { decrement: challenge.stake },
        },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount: -challenge.stake,
          type: "CHALLENGE_ENTRY",
          description: `Joined challenge ${challengeId}`,
          referenceId: challengeId,
        },
      });

      // Create club event if challenge was part of a club
      if (challenge.clubId) {
        await tx.clubEvent.create({
          data: {
            type: "CHALLENGE_CREATED",
            clubId: challenge.clubId,
            userId: session.user.id,
            metadata: {
              challengeType: challenge.type,
              stake: challenge.stake,
              challengeId: challenge.id,
            },
          },
        });

        // Emit club event
        emitToRoom(`club:${challenge.clubId}`, "club:update", {
          type: "challenge_joined",
          challengeId: challenge.id,
          opponent: {
            id: session.user.id,
            name: user.name,
            displayName: user.displayName,
          },
          stake: challenge.stake,
        });
      }

      return updated;
    });

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error, "JoinChallenge");
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
