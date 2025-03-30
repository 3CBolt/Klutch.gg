import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getChallengeHistory } from '@/app/lib/actions/challenges';
import { formatCurrency } from '@/app/lib/utils';
import { ChallengeStatus } from '@prisma/client';
import { Suspense } from 'react';

function formatStatus(status: ChallengeStatus): string {
  const statusMap = {
    [ChallengeStatus.COMPLETED]: 'Completed',
    [ChallengeStatus.DISPUTED]: 'Disputed'
  };
  return statusMap[status] || status;
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No challenge history found</h3>
      <p className="mt-1 text-sm text-gray-500">Complete some challenges to see them here.</p>
      <div className="mt-6">
        <Link
          href="/challenges"
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <span>View Active Challenges</span>
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="text-center py-12">
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading challenge history</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengeHistoryList({ challenges }: { challenges: Awaited<ReturnType<typeof getChallengeHistory>> }) {
  if (!Array.isArray(challenges) || challenges.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Date
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Creator
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Opponent
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Type
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Stake
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Winner
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {challenges.map((challenge) => (
            <tr key={challenge.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                {new Date(challenge.updatedAt).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                <Link href={`/profile/${challenge.creator.id}`} className="text-indigo-600 hover:text-indigo-900">
                  {challenge.creator.displayName || challenge.creator.name || challenge.creator.email}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {challenge.opponent ? (
                  <Link href={`/profile/${challenge.opponent.id}`} className="text-indigo-600 hover:text-indigo-900">
                    {challenge.opponent.displayName || challenge.opponent.name || challenge.opponent.email}
                  </Link>
                ) : '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {challenge.type}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {formatCurrency(challenge.stake)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  challenge.status === ChallengeStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                  challenge.status === ChallengeStatus.DISPUTED ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {formatStatus(challenge.status)}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {challenge.winner ? (
                  <Link href={`/profile/${challenge.winner.id}`} className="text-indigo-600 hover:text-indigo-900">
                    {challenge.winner.displayName || challenge.winner.name || challenge.winner.email}
                  </Link>
                ) : '-'}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <Link
                  href={`/challenges/${challenge.id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ChallengeHistoryPage({
  searchParams
}: {
  searchParams: { status?: string }
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
    return null;
  }

  try {
    const statusFilter = searchParams.status as ChallengeStatus | undefined;
    const challenges = await getChallengeHistory(statusFilter);

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Challenge History</h1>
              <p className="mt-2 text-sm text-gray-700">
                View your completed and disputed challenges
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
              <Link
                href="/challenges/history"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  !statusFilter ? 'bg-indigo-600 text-white' : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                All
              </Link>
              <Link
                href="/challenges/history?status=COMPLETED"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  statusFilter === ChallengeStatus.COMPLETED ? 'bg-indigo-600 text-white' : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Completed
              </Link>
              <Link
                href="/challenges/history?status=DISPUTED"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  statusFilter === ChallengeStatus.DISPUTED ? 'bg-indigo-600 text-white' : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Disputed
              </Link>
            </div>
          </div>
          <div className="mt-8">
            <Suspense fallback={<LoadingState />}>
              <ChallengeHistoryList challenges={challenges} />
            </Suspense>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ChallengeHistoryPage:', error);
    return <ErrorState error="An unexpected error occurred. Please try again later." />;
  }
} 