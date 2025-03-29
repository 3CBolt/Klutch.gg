'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  displayName: string | null;
  bio: string | null;
  kills: number;
  deaths: number;
  wins: number;
  gamesPlayed: number;
}

interface EditProfileFormProps {
  profile: Profile;
}

export default function EditProfileForm({ profile }: EditProfileFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      displayName: formData.get('displayName'),
      bio: formData.get('bio'),
      kills: parseInt(formData.get('kills') as string) || 0,
      deaths: parseInt(formData.get('deaths') as string) || 0,
      wins: parseInt(formData.get('wins') as string) || 0,
      gamesPlayed: parseInt(formData.get('gamesPlayed') as string) || 0,
    };

    try {
      const response = await fetch(`/api/profile/${profile.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      router.push(`/profile/${profile.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Display Name */}
      <div className="mb-6">
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
          Display Name
        </label>
        <input
          type="text"
          name="displayName"
          id="displayName"
          defaultValue={profile.displayName || ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Bio */}
      <div className="mb-6">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile.bio || ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Gaming Stats */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Gaming Stats</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="kills" className="block text-sm font-medium text-gray-700">
              Kills
            </label>
            <input
              type="number"
              name="kills"
              id="kills"
              min="0"
              defaultValue={profile.kills}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="deaths" className="block text-sm font-medium text-gray-700">
              Deaths
            </label>
            <input
              type="number"
              name="deaths"
              id="deaths"
              min="0"
              defaultValue={profile.deaths}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="wins" className="block text-sm font-medium text-gray-700">
              Wins
            </label>
            <input
              type="number"
              name="wins"
              id="wins"
              min="0"
              defaultValue={profile.wins}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="gamesPlayed" className="block text-sm font-medium text-gray-700">
              Games Played
            </label>
            <input
              type="number"
              name="gamesPlayed"
              id="gamesPlayed"
              min="0"
              defaultValue={profile.gamesPlayed}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href={`/profile/${profile.id}`}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
} 