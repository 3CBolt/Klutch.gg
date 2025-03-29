import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { ChallengeStatus } from '@prisma/client';
import EditChallengeForm from './EditChallengeForm';

export default async function EditChallengePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id: params.id },
    include: {
      creator: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  if (!challenge) {
    redirect('/challenges');
  }

  // Only allow editing if user is the creator and challenge is still open
  if (challenge.creator.email !== session.user.email || challenge.status !== ChallengeStatus.OPEN) {
    redirect(`/challenges/${params.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Challenge</h1>
          <EditChallengeForm challenge={challenge} />
        </div>
      </div>
    </div>
  );
} 