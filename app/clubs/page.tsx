import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No clubs found</h3>
      <p className="mt-1 text-sm text-gray-500">Get started by creating a new club.</p>
      <div className="mt-6">
        <Link
          href="/clubs/create"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Club
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="text-center py-12">
      <h3 className="mt-2 text-sm font-semibold text-red-600">Error loading clubs</h3>
      <p className="mt-1 text-sm text-gray-500">{error}</p>
      <div className="mt-6">
        <Link
          href="/clubs"
          className="text-indigo-600 hover:text-indigo-500"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}

interface Club {
  id: string;
  name: string;
  description: string | null;
  owner: {
    email: string | null;
  };
  _count: {
    members: number;
  };
}

function ClubList({ clubs }: { clubs: Club[] }) {
  if (!clubs || clubs.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {clubs.map((club) => (
          <li key={club.id}>
            <Link href={`/clubs/${club.id}`} className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <div className="flex text-sm">
                      <p className="font-medium text-indigo-600 truncate">{club.name}</p>
                    </div>
                    <div className="mt-2 flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <p>Created by {club.owner.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-2 flex flex-shrink-0">
                    <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                      {club._count.members} members
                    </p>
                  </div>
                </div>
                {club.description && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 line-clamp-2">{club.description}</p>
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ClubsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Please log in to view clubs</h3>
        <div className="mt-6">
          <Link
            href="/api/auth/signin"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  try {
    const clubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        owner: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return (
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Clubs</h1>
            <Link
              href="/clubs/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Club
            </Link>
          </div>
          <div className="mt-4">
            <ClubList clubs={clubs} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading clubs:', error);
    return <ErrorState error="Failed to load clubs. Please try again later." />;
  }
} 