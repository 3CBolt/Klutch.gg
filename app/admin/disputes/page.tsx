import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { ChallengeStatus } from '@prisma/client';
import DisputedChallengeList from './DisputedChallengeList';

// List of admin emails that have access to this page
const ADMIN_EMAILS = ['test.creator@example.com']; // Replace with your admin emails

export default async function AdminDisputesPage() {
  const session = await getServerSession(authOptions);

  // Check authentication and admin status
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/');
  }

  // Fetch all disputed challenges
  const disputedChallenges = await prisma.challenge.findMany({
    where: {
      status: ChallengeStatus.DISPUTED
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
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Disputed Challenges Admin
          </h1>
          <DisputedChallengeList challenges={disputedChallenges} />
        </div>
      </div>
    </div>
  );
} 