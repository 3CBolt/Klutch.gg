import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ChallengeType, ChallengeStatus } from "@prisma/client";

export async function GET() {
  try {
    // Create test users
    const creator = await prisma.user.upsert({
      where: { email: "test.creator@example.com" },
      update: {},
      create: {
        email: "test.creator@example.com",
        name: "Test Creator",
        balance: 100,
      },
    });

    const opponent = await prisma.user.upsert({
      where: { email: "test.opponent@example.com" },
      update: {},
      create: {
        email: "test.opponent@example.com",
        name: "Test Opponent",
        balance: 100,
      },
    });

    // Create a challenge
    const challenge = await prisma.challenge.create({
      data: {
        creatorId: creator.id,
        opponentId: opponent.id,
        stake: 10,
        type: ChallengeType.KillRace,
        status: ChallengeStatus.IN_PROGRESS,
        lockedFunds: 20, // Both players' stakes
      },
    });

    return NextResponse.json({
      message: "Test data created successfully",
      data: {
        creator,
        opponent,
        challenge,
      },
    });
  } catch (error) {
    console.error("Error creating test data:", error);
    return NextResponse.json(
      { error: "Failed to create test data" },
      { status: 500 },
    );
  }
}
