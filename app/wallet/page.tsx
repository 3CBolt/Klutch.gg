import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';
import DepositForm from './DepositForm';
import TransactionHistory from './TransactionHistory';
import { prisma } from '@/app/lib/prisma';

function LoadingState() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-32" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function WalletPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const balance = session.user?.balance || 0;
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Balance</p>
                <p className="mt-2 text-4xl font-bold text-gray-900 tabular-nums">
                  {formattedBalance}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deposit Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <DepositForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionHistory transactions={transactions} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 