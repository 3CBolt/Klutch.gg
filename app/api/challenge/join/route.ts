import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { ChallengeStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get challenge ID from request body
    const { challengeId } = await request.json();

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required" },
        { status: 400 },
      );
    }

    // Find the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Validate challenge exists
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 },
      );
    }

    // Validate challenge is open
    if (challenge.status !== ChallengeStatus.OPEN) {
      return NextResponse.json(
        { error: "Challenge is not open for joining" },
        { status: 400 },
      );
    }

    // Validate user is not the creator
    if (challenge.creatorId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot join your own challenge" },
        { status: 400 },
      );
    }

    // Get the joining user's current balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has sufficient balance
    if (user.balance < challenge.stake) {
      return NextResponse.json(
        { error: "Insufficient balance to join challenge" },
        { status: 400 },
      );
    }

    // Update the challenge and handle balance in a transaction
    const updatedChallenge = await prisma.$transaction(async (tx) => {
      // Update challenge status
      const updatedChallenge = await tx.challenge.update({
        where: { id: challengeId },
        data: {
          opponentId: session.user.id,
          status: ChallengeStatus.IN_PROGRESS,
          lockedFunds: challenge.stake * 2, // Lock stakes from both players
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              displayName: true,
              image: true,
            },
          },
          opponent: {
            select: {
              id: true,
              name: true,
              email: true,
              displayName: true,
              image: true,
            },
          },
        },
      });

      // Deduct stake from opponent's balance
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          balance: {
            decrement: challenge.stake,
          },
        },
      });

      // Log opponent's stake deduction transaction
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount: -challenge.stake,
          type: "CHALLENGE_ENTRY",
          description: `Stake for ${challenge.type} challenge`,
          referenceId: challengeId,
          metadata: {
            challengeType: challenge.type,
            role: "opponent",
          },
        },
      });

      return updatedChallenge;
    });

    // Return the opponent data in the format expected by the Socket.IO client
    return NextResponse.json(
      {
        challenge: updatedChallenge,
        opponent: updatedChallenge.opponent,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to join challenge:", error);
    return NextResponse.json(
      { error: "Failed to join challenge" },
      { status: 500 },
    );
  }
}
