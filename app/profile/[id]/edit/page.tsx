import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EditProfileForm from '@/app/components/EditProfileForm';

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

export default async function EditProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.id !== params.id) {
    redirect('/');
  }

  const profile = await getProfile(params.id);

  if (!profile) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>
            <EditProfileForm profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
} 