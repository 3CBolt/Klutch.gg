import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '../api/auth/[...nextauth]/auth';
import { getAllChallenges } from '@/app/lib/actions/challenges';
import { formatCurrency } from '@/app/lib/utils';
import { ChallengeStatus } from '@prisma/client';
import { Suspense } from 'react';

function formatStatus(status: ChallengeStatus): string {
  const statusMap = {
    [ChallengeStatus.OPEN]: 'Open',
    [ChallengeStatus.IN_PROGRESS]: 'In Progress',
    [ChallengeStatus.COMPLETED]: 'Completed',
    [ChallengeStatus.DISPUTED]: 'Disputed'
  };
  return statusMap[status] || status;
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="rounded-lg border-2 border-gray-100 p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading challenges...</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12">
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
        <h3 className="mt-4 text-lg font-medium text-gray-900">No active challenges</h3>
        <p className="mt-2 text-sm text-gray-500">
          Get started by creating a new challenge or join an existing one.
        </p>
        <div className="mt-6">
          <Link
            href="/challenges/create"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Challenge
          </Link>
        </div>
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
            <h3 className="text-sm font-medium text-red-800">Error loading challenges</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Link
                href="/challenges"
                className="text-sm font-medium text-red-800 hover:text-red-700"
              >
                Try again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengeList({ challenges }: { challenges: Awaited<ReturnType<typeof getAllChallenges>> }) {
  if (!Array.isArray(challenges) || challenges.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Creator
            </th>
            <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Opponent
            </th>
            <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Type
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Stake
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Winner
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {challenges.map((challenge) => (
            <tr key={challenge.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div className="font-medium text-gray-900">
                  {challenge.creator?.name || challenge.creator?.email || 'Unknown'}
                </div>
                <div className="sm:hidden text-gray-500">
                  {challenge.opponent ? (challenge.opponent.name || challenge.opponent.email) : '-'}
                </div>
              </td>
              <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {challenge.opponent ? (challenge.opponent.name || challenge.opponent.email) : '-'}
              </td>
              <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {challenge.type}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                {formatCurrency(challenge.stake)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  challenge.status === ChallengeStatus.OPEN ? 'bg-green-100 text-green-800' :
                  challenge.status === ChallengeStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                  challenge.status === ChallengeStatus.COMPLETED ? 'bg-purple-100 text-purple-800' :
                  challenge.status === ChallengeStatus.DISPUTED ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {formatStatus(challenge.status)}
                </span>
              </td>
              <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {challenge.winner ? (challenge.winner.name || challenge.winner.email || 'Unknown') : '-'}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <Link
                  href={`/challenges/${challenge.id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  View<span className="sr-only">, {challenge.id}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ChallengePage() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      redirect('/login');
    }

    const challenges = await getAllChallenges();

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Active Challenges</h1>
              <p className="mt-2 text-sm text-gray-700">
                Browse open challenges or create your own. Completed and disputed challenges can be found in Challenge History.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Link
                href="/challenges/create"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
              >
                Create Challenge
              </Link>
            </div>
          </div>
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <Suspense fallback={<LoadingState />}>
                    <ChallengeList challenges={challenges} />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ChallengePage:', error);
    return <ErrorState error="An unexpected error occurred. Please try again later." />;
  }
} 