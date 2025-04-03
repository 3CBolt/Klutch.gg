'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { Loader2 } from 'lucide-react';
import { showToast } from '@/app/lib/toast';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function DepositForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const status = searchParams?.get('status');
    const sessionId = searchParams?.get('session_id');

    const checkSession = async () => {
      if (status === 'success' && sessionId) {
        try {
          const response = await fetch(`/api/wallet/verify-session?session_id=${sessionId}`);
          const data = await response.json();

          if (response.ok && data.success) {
            toast.success('Payment successful! Your wallet has been updated.');
          } else {
            toast.error('Failed to verify payment. Please contact support if funds were deducted.');
          }
        } catch (err) {
          toast.error('Failed to verify payment status.');
        }

        // Remove the query parameters after handling
        const timer = setTimeout(() => {
          router.replace('/wallet');
        }, 3000);
        return () => clearTimeout(timer);
      } else if (status === 'canceled') {
        toast.error('Payment canceled. Please try again.');
        // Remove the query parameters after a short delay
        const timer = setTimeout(() => {
          router.replace('/wallet');
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    checkSession();
  }, [searchParams, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const amount = Number(formData.get('amount'));

    if (amount <= 0) {
      showToast.error('Please enter a valid amount');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to process deposit');
      }

      showToast.success('Deposit successful');
      router.refresh();
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      showToast.error('Failed to process deposit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter amount to deposit"
            required
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Deposit'
          )}
        </Button>
      </form>
    </Card>
  );
} 