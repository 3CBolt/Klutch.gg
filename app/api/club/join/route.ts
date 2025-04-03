import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getIO } from "@/app/lib/server";
import { ClubEventType } from "@prisma/client";

const joinClubSchema = z.object({
  clubId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to join a club" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validation = joinClubSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { clubId } = validation.data;

    // Get or create user
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        email: session.user.email,
        balance: 100, // Default balance for new users
      },
    });

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Check if user is already a member
    const isMember = club.members.some((member) => member.id === user.id);
    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this club" },
        { status: 400 },
      );
    }

    // Add user to club and create timeline event in a transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Add user to club
      const updatedClub = await tx.club.update({
        where: { id: clubId },
        data: {
          members: {
            connect: { id: user.id },
          },
        },
        include: {
          members: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      // Create timeline event
      const event = await tx.clubEvent.create({
        data: {
          type: ClubEventType.MEMBER_JOINED,
          clubId,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return { club: updatedClub, event };
    });

    try {
      // Try to emit Socket.IO event if available
      const io = getIO();
      io.to(`club:${clubId}`).emit("club:update", {
        type: "timeline_event",
        event: {
          id: transactionResult.event.id,
          type: transactionResult.event.type,
          userId: transactionResult.event.userId,
          userEmail: transactionResult.event.user.email,
          userName: transactionResult.event.user.name,
          timestamp: transactionResult.event.timestamp,
        },
      });
    } catch (error) {
      // Log Socket.IO error but don't fail the request
      console.warn("Socket.IO emit failed:", error);
    }

    return NextResponse.json({
      message: "Successfully joined club",
      club: transactionResult.club,
      event: transactionResult.event,
    });
  } catch (error) {
    console.error("Error joining club:", error);
    return NextResponse.json({ error: "Failed to join club" }, { status: 500 });
  }
}
