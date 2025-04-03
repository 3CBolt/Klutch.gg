import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { handleError, Errors } from "@/lib/errors";
import { z } from "zod";

const CreateChallengeSchema = z.object({
  stake: z.number().min(0, "Stake must be non-negative"),
  type: z.enum(["KillRace", "OverUnder", "Survival"]),
  clubId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw Errors.Unauthorized;
    }

    const body = await request.json();
    const result = CreateChallengeSchema.safeParse(body);
    
    if (!result.success) {
      throw Errors.ValidationError(result.error.errors[0].message);
    }

    const { stake, type, clubId } = result.data;

    // Check user balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true },
    });

    if (!user || user.balance < stake) {
      throw Errors.BadRequest("Insufficient balance");
    }

    // Create challenge
    const challenge = await prisma.challenge.create({
      data: {
        creatorId: session.user.id,
        stake,
        type,
        clubId,
        lockedFunds: stake,
      },
    });

    // Update user balance
    await prisma.user.update({
      where: { id: session.user.id },
      data: { balance: { decrement: stake } },
    });

    return NextResponse.json(challenge, { status: 201 });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error, "CreateChallenge");
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw Errors.Unauthorized;
    }

    const challenges = await prisma.challenge.findMany({
      where: {
        status: "OPEN",
        creatorId: { not: session.user.id },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(challenges);
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error, "GetChallenges");
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
