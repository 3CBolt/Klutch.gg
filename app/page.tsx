import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/auth";
import { prisma } from "./lib/prisma";
import Link from "next/link";
import { ChallengeStatus } from "@prisma/client";
import { formatCurrency } from "./lib/utils";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Fetch recent challenges
  const recentChallenges = session?.user?.email
    ? await prisma.challenge.findMany({
        where: {
          OR: [{ creatorId: session.user.id }, { opponentId: session.user.id }],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          creator: {
            select: { name: true, email: true },
          },
          opponent: {
            select: { name: true, email: true },
          },
        },
      })
    : [];

  // Fetch open challenges
  const openChallenges = await prisma.challenge.findMany({
    where: {
      status: ChallengeStatus.OPEN,
      NOT: {
        creatorId: session?.user?.id,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      creator: {
        select: { name: true, email: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to Klutch.gg
          </h1>
          {session?.user?.email && (
            <p className="mt-2 text-lg text-gray-600">
              Logged in as: {session.user.email}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/challenges/create"
              className="flex items-center justify-center rounded-md bg-indigo-600 px-3 py-4 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Create Challenge
            </Link>
            <Link
              href="/clubs"
              className="flex items-center justify-center rounded-md bg-green-600 px-3 py-4 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500"
            >
              Join Club
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Your Recent Challenges */}
          {session?.user?.email && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Your Recent Challenges
                </h2>
                {recentChallenges.length > 0 ? (
                  <div className="space-y-4">
                    {recentChallenges.map((challenge) => (
                      <Link
                        key={challenge.id}
                        href={`/challenges/${challenge.id}`}
                        className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {challenge.creator.name ||
                                challenge.creator.email}{" "}
                              vs{" "}
                              {challenge.opponent
                                ? challenge.opponent.name ||
                                  challenge.opponent.email
                                : "Waiting for opponent"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Stake: {formatCurrency(challenge.stake)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              challenge.status === ChallengeStatus.OPEN
                                ? "bg-green-100 text-green-800"
                                : challenge.status ===
                                    ChallengeStatus.IN_PROGRESS
                                  ? "bg-blue-100 text-blue-800"
                                  : challenge.status ===
                                      ChallengeStatus.COMPLETED
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {challenge.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No recent challenges</p>
                )}
              </div>
            </div>
          )}

          {/* Open Challenges */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Open Challenges
              </h2>
              {openChallenges.length > 0 ? (
                <div className="space-y-4">
                  {openChallenges.map((challenge) => (
                    <Link
                      key={challenge.id}
                      href={`/challenges/${challenge.id}`}
                      className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Created by:{" "}
                            {challenge.creator.name || challenge.creator.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            Stake: {formatCurrency(challenge.stake)}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Open
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No open challenges available</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/challenges"
              className="rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              View All Challenges
            </Link>
            <Link
              href={
                session?.user?.id ? `/profile/${session.user.id}` : "/login"
              }
              className="rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Manage Profile
            </Link>
            <Link
              href="/clubs"
              className="rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Browse Clubs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
