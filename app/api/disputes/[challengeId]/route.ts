import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { challengeId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId } = params;

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the challenge exists and user is a participant
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: true,
        opponent: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 },
      );
    }

    // Verify user is a participant in the challenge
    if (challenge.creatorId !== user.id && challenge.opponentId !== user.id) {
      return NextResponse.json(
        { error: "Only challenge participants can view disputes" },
        { status: 403 },
      );
    }

    // Get all disputes for the challenge
    const disputes = await prisma.dispute.findMany({
      where: { challengeId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(disputes);
  } catch (error) {
    console.error("Error fetching disputes:", error);
    return NextResponse.json(
      { error: "Failed to fetch disputes" },
      { status: 500 },
    );
  }
}
