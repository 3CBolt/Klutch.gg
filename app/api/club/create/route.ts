import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Input validation schema
const createClubSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to create a club' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = createClubSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { name, description } = result.data;

    // Check if club name is already taken
    const existingClub = await prisma.club.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingClub) {
      return NextResponse.json(
        { error: 'A club with this name already exists' },
        { status: 400 }
      );
    }

    // Get or create user
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        email: session.user.email,
        balance: 100, // Default balance for new users
      },
    });

    // Create club
    const club = await prisma.club.create({
      data: {
        name,
        description,
        ownerId: user.id,
        members: {
          connect: { id: user.id },
        },
      },
      include: {
        owner: {
          select: {
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(club);
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json(
      { error: 'Failed to create club' },
      { status: 500 }
    );
  }
} 