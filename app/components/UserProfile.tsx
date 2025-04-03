'use client';

import { useAuth, isAuthenticated } from '@/app/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { User, Settings } from 'lucide-react';
import Link from 'next/link';

function LoadingState() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardContent>
    </Card>
  );
}

function UnauthenticatedState() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <User className="h-12 w-12 text-gray-400 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">Sign in to view your profile</h3>
            <p className="text-sm text-gray-500">
              Access your profile, wallet, and game history
            </p>
          </div>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserProfile() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated(auth)) {
    return <UnauthenticatedState />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Profile</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/edit">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Name</h4>
            <p className="mt-1 text-sm text-gray-900">{auth.user.name || 'Not set'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Email</h4>
            <p className="mt-1 text-sm text-gray-900">{auth.user.email}</p>
          </div>
          {auth.user.balance !== undefined && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Balance</h4>
              <p className="mt-1 text-sm text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(auth.user.balance)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 