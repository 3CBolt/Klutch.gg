import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Users, Plus, AlertCircle, ArrowRight } from 'lucide-react';

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[300px]" />
              </div>
              <Skeleton className="h-8 w-[100px] rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto h-12 w-12 text-muted-foreground">
        <Users className="h-12 w-12" />
      </div>
      <h3 className="mt-4 text-lg font-medium">No clubs found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Get started by creating a new club to connect with other players.
      </p>
      <div className="mt-6">
        <Link href="/clubs/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Club
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto h-12 w-12 text-destructive">
        <AlertCircle className="h-12 w-12" />
      </div>
      <h3 className="mt-4 text-lg font-medium">Error loading clubs</h3>
      <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      <div className="mt-6">
        <Link href="/clubs">
          <Button variant="outline">Try again</Button>
        </Link>
      </div>
    </Card>
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
    <div className="space-y-4">
      {clubs.map((club) => (
        <Link key={club.id} href={`/clubs/${club.id}`} className="block">
          <Card className="group overflow-hidden transition-all duration-200 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium group-hover:text-primary transition-colors">
                      {club.name}
                    </h3>
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                  <p className="text-sm text-muted-foreground">Created by {club.owner.email}</p>
                  {club.description && (
                    <p className="text-sm text-muted-foreground/80 line-clamp-2">
                      {club.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0 border-t">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                {club._count.members} {club._count.members === 1 ? 'member' : 'members'}
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default async function ClubsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-medium">Please log in to view clubs</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to access your clubs and create new ones.
        </p>
        <div className="mt-6">
          <Link href="/api/auth/signin">
            <Button>Sign in</Button>
          </Link>
        </div>
      </Card>
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
            <div>
              <h1 className="text-2xl font-semibold">Clubs</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect with other players and organize challenges together.
              </p>
            </div>
            <Link href="/clubs/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Club
              </Button>
            </Link>
          </div>
          <div className="mt-8">
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