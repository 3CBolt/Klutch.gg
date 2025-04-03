import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Suspense } from "react";

// Loading component
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 animate-pulse">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        createdAt: true,
        updatedAt: true,
      },
    });

    return profile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
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
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow sm:rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Profile Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The profile you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/" className="text-indigo-600 hover:text-indigo-500">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default values for stats
  const stats = {
    kills: profile.kills ?? 0,
    deaths: profile.deaths ?? 0,
    wins: profile.wins ?? 0,
    gamesPlayed: profile.gamesPlayed ?? 0,
    kdRatio: profile.kdRatio ?? 0,
    winRate: profile.winRate ?? 0,
  };

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Gaming Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  K/D Ratio
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.kdRatio.toFixed(2)}
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Win Rate
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.winRate.toFixed(1)}%
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Games
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.gamesPlayed}
                </dd>
              </div>
            </div>
          </div>

          {/* Profile Details Card */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.displayName || profile.name || "Anonymous User"}
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
                          No bio yet.{" "}
                          <Link
                            href={`/profile/${params.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
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
                <h2 className="text-lg font-medium text-gray-900">
                  Detailed Stats
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="rounded-md bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">Kills</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {stats.kills}
                    </p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">Deaths</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {stats.deaths}
                    </p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">Wins</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {stats.wins}
                    </p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">Losses</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {stats.gamesPlayed - stats.wins}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated {new Date(profile.updatedAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {profile.bio || "No bio provided"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
