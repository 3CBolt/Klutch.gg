import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { formatCurrency } from '@/app/lib/utils';
import { ChallengeStatus } from '@prisma/client';
import ChallengeActions from './ChallengeActions';
import Link from 'next/link';

function formatStatus(status: ChallengeStatus): string {
  const statusMap = {
    [ChallengeStatus.OPEN]: 'Open',
    [ChallengeStatus.IN_PROGRESS]: 'In Progress',
    [ChallengeStatus.COMPLETED]: 'Completed',
    [ChallengeStatus.DISPUTED]: 'Disputed',
    [ChallengeStatus.PAID]: 'Paid',
    [ChallengeStatus.CANCELED]: 'Canceled',
    [ChallengeStatus.PENDING]: 'Pending'
  };
  return statusMap[status] || status;
}

export default async function ChallengePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id: params.id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          displayName: true
        }
      },
      opponent: {
        select: {
          id: true,
          name: true,
          email: true,
          displayName: true
        }
      },
      winner: {
        select: {
          id: true,
          name: true,
          email: true,
          displayName: true
        }
      }
    }
  });

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h1 className="text-2xl font-semibold text-gray-900">Challenge not found</h1>
          </div>
        </div>
      </div>
    );
  }

  const isCreator = session.user.email === challenge.creator.email;
  const isOpponent = challenge.opponent?.email === session.user.email;
  const canEdit = isCreator && challenge.status === ChallengeStatus.OPEN;
  const canDelete = isCreator && challenge.status === ChallengeStatus.OPEN;
  const canJoin = !isCreator && !isOpponent && challenge.status === ChallengeStatus.OPEN;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Challenge Details</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Creator</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link 
                    href={`/profile/${challenge.creator.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {challenge.creator.displayName || challenge.creator.name || challenge.creator.email}
                  </Link>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Opponent</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {challenge.opponent ? (
                    <Link 
                      href={`/profile/${challenge.opponent.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {challenge.opponent.displayName || challenge.opponent.name || challenge.opponent.email}
                    </Link>
                  ) : 'Not joined yet'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{challenge.type}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Stake</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(challenge.stake)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    challenge.status === ChallengeStatus.OPEN ? 'bg-green-100 text-green-800' :
                    challenge.status === ChallengeStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                    challenge.status === ChallengeStatus.COMPLETED ? 'bg-purple-100 text-purple-800' :
                    challenge.status === ChallengeStatus.DISPUTED ? 'bg-red-100 text-red-800' :
                    challenge.status === ChallengeStatus.PAID ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {formatStatus(challenge.status)}
                  </span>
                </dd>
              </div>
              {challenge.winner && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Winner</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link 
                      href={`/profile/${challenge.winner.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {challenge.winner.displayName || challenge.winner.name || challenge.winner.email}
                    </Link>
                  </dd>
                </div>
              )}
              {challenge.disputeReason && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Dispute Reason</dt>
                  <dd className="mt-1 text-sm text-gray-900">{challenge.disputeReason}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <ChallengeActions
              challengeId={challenge.id}
              canEdit={canEdit}
              canDelete={canDelete}
              canJoin={canJoin}
              status={challenge.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 