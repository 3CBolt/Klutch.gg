import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create a test user with a hashed password
  const hashedPassword = await bcryptjs.hash('password123', 12);
  
  const testUser = await prisma.user.create({
    data: {
      name: 'Test User',
      displayName: 'TestGamer123',
      email: 'test@example.com',
      password: hashedPassword,
      bio: 'I love gaming and competing!',
      kills: 54,
      deaths: 12,
      wins: 10,
      gamesPlayed: 15,
      kdRatio: 4.5,
      winRate: 66.7,
    },
  });

  console.log('Created test user:', testUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 