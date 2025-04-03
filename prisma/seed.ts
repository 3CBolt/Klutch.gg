import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create test user
    const hashedPassword = await hash('password123', 12);
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        displayName: 'Tester',
        email: 'test@example.com',
        password: hashedPassword,
      },
    });

    logger.info('Created test user:', { id: testUser.id, email: testUser.email });
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 