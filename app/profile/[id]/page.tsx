import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

async function getProfile(id: string) {
  try {
    const profile = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        email: true,
        image: true,
        kills: true,
        deaths: true,
        wins: true,
        gamesPlayed: true,
        kdRatio: true,
        winRate: true,
      },
    });

    if (!profile) {
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw new Error('Failed to fetch profile');
  }
}

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const profile = await getProfile(params.id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Gaming Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">K/D Ratio</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{profile.kdRatio.toFixed(2)}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Win Rate</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{profile.winRate.toFixed(1)}%</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Games</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{profile.gamesPlayed}</dd>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.displayName || profile.name || 'Anonymous User'}
              </h1>
              {session?.user?.id === params.id && (
                <Link
                  href={`/profile/${params.id}/edit`}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            {/* Bio */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">Bio</h2>
              {profile.bio ? (
                <p className="mt-2 text-gray-600">{profile.bio}</p>
              ) : (
                <div className="mt-2 rounded-md bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    {session?.user?.id === params.id ? (
                      <>
                        No bio yet.{' '}
                        <Link href={`/profile/${params.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                          Add one now
                        </Link>
                      </>
                    ) : (
                      "This user hasn't added a bio yet."
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Detailed Stats */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Detailed Stats</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-md bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-500">Kills</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{profile.kills}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-500">Deaths</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{profile.deaths}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-500">Wins</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{profile.wins}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-500">Losses</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{profile.gamesPlayed - profile.wins}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 