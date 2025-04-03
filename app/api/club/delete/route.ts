import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { initSocket } from '@/app/lib/socket';
import { ClubEventType } from '@prisma/client';

const deleteClubSchema = z.object({
  clubId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a club' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = deleteClubSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { clubId } = validation.data;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if club exists and user is the owner
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        owner: {
          select: {
            id: true,
          },
        },
        members: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    if (club.owner.id !== user.id) {
      return NextResponse.json(
        { error: 'Only the club owner can delete the club' },
        { status: 403 }
      );
    }

    // Create timeline events for all members leaving and then delete the club in a transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Create timeline events for all members
      const events = await Promise.all(
        club.members.map(member =>
          tx.clubEvent.create({
            data: {
              type: ClubEventType.MEMBER_LEFT,
              clubId,
              userId: member.id,
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
          })
        )
      );

      // Delete club
      await tx.club.delete({
        where: { id: clubId },
      });

      return { events };
    });

    // Initialize Socket.IO and emit events
    const res = new NextResponse();
    const io = await initSocket(res as any);

    // Emit events for each member leaving
    transactionResult.events.forEach(event => {
      io.to(`club:${clubId}`).emit('club:update', {
        type: 'timeline_event',
        event: {
          id: event.id,
          type: event.type,
          userId: event.userId,
          userEmail: event.user.email,
          userName: event.user.name,
          timestamp: event.timestamp,
        },
      });
    });

    return NextResponse.json({ 
      message: 'Successfully deleted club',
      events: transactionResult.events,
    });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json(
      { error: 'Failed to delete club' },
      { status: 500 }
    );
  }
} 