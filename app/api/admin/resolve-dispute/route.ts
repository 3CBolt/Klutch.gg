import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/app/lib/prisma";
import { ChallengeStatus } from "@prisma/client";
import { releaseFundsToWinner } from "@/app/lib/actions/transactions";

// List of admin emails that have access to this endpoint
const ADMIN_EMAILS = ["test.creator@example.com"]; // Replace with your admin emails

type ResolveDisputeRequest = {
  challengeId: string;
  winnerId: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin status
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ResolveDisputeRequest = await request.json();
    const { challengeId, winnerId } = body;

    // Validate required fields
    if (!challengeId || !winnerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        status: true,
        creatorId: true,
        opponentId: true,
        lockedFunds: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 },
      );
    }

    // Verify challenge is disputed
    if (challenge.status !== ChallengeStatus.DISPUTED) {
      return NextResponse.json(
        { error: "Challenge is not disputed" },
        { status: 400 },
      );
    }

    // Verify winner is either creator or opponent
    if (winnerId !== challenge.creatorId && winnerId !== challenge.opponentId) {
      return NextResponse.json({ error: "Invalid winner ID" }, { status: 400 });
    }

    // Update challenge and release funds in a transaction
    const updatedChallenge = await prisma.$transaction(async (tx) => {
      // First mark the challenge as completed and set the winner
      const updated = await tx.challenge.update({
        where: { id: challengeId },
        data: {
          status: ChallengeStatus.COMPLETED,
          winnerId: winnerId,
        },
      });

      // Release funds to winner
      await releaseFundsToWinner(challengeId, winnerId);

      return updated;
    });

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    console.error("Error resolving dispute:", error);
    return NextResponse.json(
      { error: "Failed to resolve dispute" },
      { status: 500 },
    );
  }
}
