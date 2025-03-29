import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestAdmin() {
  try {
    const hashedPassword = await hash('admin123', 12);

    const admin = await prisma.user.upsert({
      where: { email: 'test.creator@example.com' },
      update: {
        name: 'Test Admin',
        password: hashedPassword,
        balance: 1000 // Give admin a good balance for testing
      },
      create: {
        email: 'test.creator@example.com',
        name: 'Test Admin',
        password: hashedPassword,
        balance: 1000
      }
    });

    console.log('Created test admin user:', {
      id: admin.id,
      email: admin.email,
      name: admin.name
    });
  } catch (error) {
    console.error('Error creating test admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin(); 