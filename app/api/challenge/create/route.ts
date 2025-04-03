import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { ChallengeType, ChallengeStatus, ClubEventType } from "@prisma/client";
import { emitToRoom } from "@/app/lib/server";
import { handleError, Errors } from "@/lib/errors";
import { z } from "zod";

const CreateChallengeSchema = z.object({
  stake: z.number().positive("Stake must be a positive number"),
  type: z.nativeEnum(ChallengeType, {
    errorMap: () => ({ message: "Invalid challenge type" }),
  }),
  opponentUsername: z.string().email().optional(),
  clubId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw Errors.Unauthorized;
    }

    const body = await request.json();
    const result = CreateChallengeSchema.safeParse(body);
    
    if (!result.success) {
      throw Errors.ValidationError(result.error.errors[0].message);
    }

    const { stake, type, opponentUsername, clubId } = result.data;

    // Validate opponent email if provided
    if (opponentUsername && opponentUsername === session.user.email) {
      throw Errors.BadRequest("You cannot challenge yourself");
    }

    // Get the creator user
    const creator = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!creator) {
      throw Errors.NotFound;
    }

    // Check if creator has sufficient balance
    if (creator.balance < stake) {
      throw Errors.BadRequest("Insufficient balance to create challenge");
    }

    // If opponent is specified, ensure they exist and have sufficient balance
    let opponent = null;
    if (opponentUsername) {
      opponent = await prisma.user.findUnique({
        where: { email: opponentUsername },
      });

      if (!opponent) {
        throw Errors.NotFound;
      }

      if (opponent.balance < stake) {
        throw Errors.BadRequest("Opponent has insufficient balance");
      }
    }

    // Create the challenge
    const challenge = await prisma.challenge.create({
      data: {
        stake,
        type,
        status: ChallengeStatus.OPEN,
        creatorId: creator.id,
        opponentId: opponent?.id,
        clubId,
      },
    });

    // If this is a club challenge, emit an event
    if (clubId) {
      emitToRoom(clubId, "club:update", {
        type: "challenge_created",
        challenge,
        creator: {
          id: creator.id,
          name: creator.name,
          displayName: creator.displayName,
        },
        opponent: opponent
          ? {
              id: opponent.id,
              name: opponent.name,
              displayName: opponent.displayName,
            }
          : null,
      });
    }

    return NextResponse.json(challenge);
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error, "CreateChallenge");
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
