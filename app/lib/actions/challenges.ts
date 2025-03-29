import { prisma } from '../prisma';
import { Challenge, ChallengeStatus } from '@prisma/client';

export type ChallengeWithRelations = Challenge & {
  creator: {
    name: string | null;
    email: string | null;
  };
  opponent: {
    name: string | null;
    email: string | null;
  } | null;
  winner: {
    name: string | null;
    email: string | null;
  } | null;
};

export async function getOpenChallenges(): Promise<ChallengeWithRelations[]> {
  try {
    const challenges = await prisma.challenge.findMany({
      where: {
        status: ChallengeStatus.OPEN
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        opponent: {
          select: {
            name: true,
            email: true
          }
        },
        winner: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return challenges || [];
  } catch (error) {
    console.error('Error fetching open challenges:', error);
    return [];
  }
}

export async function getAllChallenges(): Promise<ChallengeWithRelations[]> {
  try {
    const challenges = await prisma.challenge.findMany({
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        opponent: {
          select: {
            name: true,
            email: true
          }
        },
        winner: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return challenges || [];
  } catch (error) {
    console.error('Error fetching all challenges:', error);
    return [];
  }
}

export async function getUserChallenges(userId: string): Promise<ChallengeWithRelations[]> {
  try {
    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { opponentId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        opponent: {
          select: {
            name: true,
            email: true
          }
        },
        winner: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return challenges || [];
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    return [];
  }
} 