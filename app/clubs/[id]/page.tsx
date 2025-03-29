import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ClubDetails from './ClubDetails';

export default async function ClubPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Please log in to view club details</h3>
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
    const club = await prisma.club.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!club) {
      notFound();
    }

    // Transform the data to include isOwner flag for members
    const membersWithRole = club.members.map(member => ({
      ...member,
      isOwner: member.email === club.owner.email,
    }));

    const clubData = {
      ...club,
      members: membersWithRole,
    };

    return <ClubDetails club={clubData} userEmail={session.user.email} />;
  } catch (error) {
    console.error('Error loading club:', error);
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-semibold text-red-600">Error loading club</h3>
        <p className="mt-1 text-sm text-gray-500">Failed to load club details. Please try again later.</p>
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
} 