import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const joinClubSchema = z.object({
  clubId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to join a club' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = joinClubSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { clubId } = result.data;

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
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const isMember = club.members.some(member => member.id === user.id);
    if (isMember) {
      return NextResponse.json(
        { error: 'You are already a member of this club' },
        { status: 400 }
      );
    }

    // Add user to club
    await prisma.club.update({
      where: { id: clubId },
      data: {
        members: {
          connect: { id: user.id },
        },
      },
    });

    return NextResponse.json({ message: 'Successfully joined club' });
  } catch (error) {
    console.error('Error joining club:', error);
    return NextResponse.json(
      { error: 'Failed to join club' },
      { status: 500 }
    );
  }
} 