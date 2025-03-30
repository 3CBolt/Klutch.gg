'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function DepositForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams?.get('status');
    const sessionId = searchParams?.get('session_id');

    const checkSession = async () => {
      if (status === 'success' && sessionId) {
        try {
          // Verify the session status with your backend
          const response = await fetch(`/api/wallet/verify-session?session_id=${sessionId}`);
          const data = await response.json();

          if (response.ok && data.success) {
            setSuccessMessage('Payment successful! Your wallet has been updated.');
          } else {
            setError('Failed to verify payment. Please contact support if funds were deducted.');
          }
        } catch (err) {
          setError('Failed to verify payment status.');
        }

        // Remove the query parameters after handling
        const timer = setTimeout(() => {
          router.replace('/wallet');
        }, 5000);
        return () => clearTimeout(timer);
      } else if (status === 'canceled') {
        setError('Payment canceled. Please try again.');
        // Remove the query parameters after a short delay
        const timer = setTimeout(() => {
          router.replace('/wallet');
          setError(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    checkSession();
  }, [searchParams, router]);

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 1) {
      setError('Please enter a valid amount (minimum $1)');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: depositAmount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create deposit session');
      }

      // Redirect to the Stripe Checkout URL directly
      window.location.href = data.url;
    } catch (error) {
      console.error('Deposit error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process deposit');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="p-4 bg-green-50 text-green-800 rounded-md">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount (USD)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            name="amount"
            id="amount"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="0.00"
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        onClick={handleDeposit}
        disabled={isLoading || !amount || parseFloat(amount) < 1}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : 'Deposit'}
      </button>
    </div>
  );
} 