import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
    const result = deleteClubSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { clubId } = result.data;

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

    // Delete club
    await prisma.club.delete({
      where: { id: clubId },
    });

    return NextResponse.json({ message: 'Successfully deleted club' });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json(
      { error: 'Failed to delete club' },
      { status: 500 }
    );
  }
} 