import { PrismaClient, ChallengeType, ChallengeStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestChallenge() {
  try {
    // First create test users if they don't exist
    const creator = await prisma.user.upsert({
      where: { email: 'test.creator@example.com' },
      update: {},
      create: {
        email: 'test.creator@example.com',
        name: 'Test Creator',
        balance: 100
      }
    });

    const opponent = await prisma.user.upsert({
      where: { email: 'test.opponent@example.com' },
      update: {},
      create: {
        email: 'test.opponent@example.com',
        name: 'Test Opponent',
        balance: 100
      }
    });

    // Create a challenge
    const challenge = await prisma.challenge.create({
      data: {
        creatorId: creator.id,
        opponentId: opponent.id,
        stake: 10,
        type: ChallengeType.KillRace,
        status: ChallengeStatus.IN_PROGRESS,
        lockedFunds: 20 // Both players' stakes
      }
    });

    console.log('Created test users and challenge:');
    console.log('Creator ID:', creator.id);
    console.log('Opponent ID:', opponent.id);
    console.log('Challenge ID:', challenge.id);
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestChallenge(); 