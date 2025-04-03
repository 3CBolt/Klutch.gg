import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(50).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  kills: z.number().int().min(0).optional(),
  deaths: z.number().int().min(0).optional(),
  wins: z.number().int().min(0).optional(),
  gamesPlayed: z.number().int().min(0).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        email: true,
        image: true,
        kills: true,
        deaths: true,
        wins: true,
        gamesPlayed: true,
        kdRatio: true,
        winRate: true,
      },
    });

    if (!profile) {
      return new NextResponse("Profile not found", { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== params.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Calculate derived stats
    const kdRatio =
      validatedData.deaths && validatedData.deaths > 0
        ? validatedData.kills! / validatedData.deaths
        : validatedData.kills || 0;

    const winRate =
      validatedData.gamesPlayed && validatedData.gamesPlayed > 0
        ? (validatedData.wins! / validatedData.gamesPlayed) * 100
        : 0;

    const updatedProfile = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        kdRatio,
        winRate,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid data", errors: error.errors }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.error("Error updating profile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
