'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Member {
  id: string;
  email: string;
  isOwner: boolean;
}

interface Club {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  owner: {
    email: string;
  };
  members: Member[];
}

interface ClubDetailsProps {
  club: Club;
  userEmail: string;
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="text-center py-12">
      <h3 className="mt-2 text-sm font-semibold text-red-600">Error loading club</h3>
      <p className="mt-1 text-sm text-gray-500">{error}</p>
      <div className="mt-6">
        <Link
          href="/clubs"
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to Clubs
        </Link>
      </div>
    </div>
  );
}

function MemberList({ members }: { members: Member[] }) {
  return (
    <div className="mt-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">Members</h2>
          <p className="mt-2 text-sm text-gray-700">
            A list of all members in this club.
          </p>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {member.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {member.isOwner ? 'Owner' : 'Member'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClubDetails({ club, userEmail }: ClubDetailsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = club.owner.email === userEmail;
  const isMember = club.members.some(member => member.email === userEmail);

  const handleJoinClub = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/club/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubId: club.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join club');
      }

      toast.success('Successfully joined club');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join club');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/club/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubId: club.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete club');
      }

      toast.success('Successfully deleted club');
      router.push('/clubs');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete club');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {club.name}
            </h2>
            {club.description && (
              <p className="mt-2 text-sm text-gray-500">
                {club.description}
              </p>
            )}
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Link
              href="/clubs"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Clubs
            </Link>
            {!isMember && (
              <button
                type="button"
                onClick={handleJoinClub}
                disabled={isLoading}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Joining...' : 'Join Club'}
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={handleDeleteClub}
                disabled={isLoading}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete Club'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Owner</dt>
              <dd className="mt-1 text-sm text-gray-900">{club.owner.email}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(club.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <MemberList members={club.members} />
      </div>
    </div>
  );
} 