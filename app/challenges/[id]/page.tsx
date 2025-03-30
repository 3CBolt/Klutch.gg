import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/app/lib/prisma';
import { formatCurrency } from '@/app/lib/utils';
import { ChallengeStatus } from '@prisma/client';
import ChallengeActions from './ChallengeActions';
import Link from 'next/link';
import { MarkWinnerSection } from './MarkWinnerSection';

function formatStatus(status: ChallengeStatus): string {
  const statusMap = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    DISPUTED: 'Disputed'
  } as const;
  return statusMap[status as keyof typeof statusMap] || status;
}

async function getChallengeDetails(id: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          email: true,
        },
      },
      opponent: {
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          email: true,
        },
      },
      winner: {
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          email: true,
        },
      },
    },
  });

  if (!challenge) {
    notFound();
  }

  return challenge;
}

export default async function ChallengePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const challenge = await getChallengeDetails(params.id);

  const isCreator = session.user.email === challenge.creator.email;
  const isOpponent = challenge.opponent?.email === session.user.email;
  const canEdit = isCreator && challenge.status === ChallengeStatus.OPEN;
  const canDelete = isCreator && challenge.status === ChallengeStatus.OPEN;
  const canJoin = !isCreator && !isOpponent && challenge.status === ChallengeStatus.OPEN;

  const isParticipant =
    session?.user?.email &&
    (challenge.creatorId === session.user.id ||
      challenge.opponentId === session.user.id);

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

        <MarkWinnerSection 
          challenge={challenge}
          isParticipant={isParticipant}
        />

        {challenge.status === ChallengeStatus.COMPLETED && challenge.winner && (
          <div className="mt-8 p-4 bg-green-50 rounded-md">
            <h2 className="text-lg font-semibold text-green-800">Winner</h2>
            <p className="text-green-700">
              {challenge.winner.displayName || challenge.winner.name}
            </p>
          </div>
        )}

        {challenge.status === ChallengeStatus.DISPUTED && (
          <div className="mt-8 p-4 bg-red-50 rounded-md">
            <h2 className="text-lg font-semibold text-red-800">Challenge Disputed</h2>
            <p className="text-red-700">
              This challenge is currently under dispute. Both players have submitted different winners.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}