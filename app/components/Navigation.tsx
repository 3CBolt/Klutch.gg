'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import LogoutButton from './auth/LogoutButton';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchBalance();
      checkAdminStatus();
    }
  }, [session]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/wallet/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const checkAdminStatus = async () => {
    if (session?.user?.id) {
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const userData = await response.json();
          setIsAdmin(userData.isAdmin || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
  };

  const links = [
    { href: '/', label: 'Home' },
    { href: '/challenges', label: 'Challenges' },
    { href: '/challenges/history', label: 'Challenge History' },
    { href: '/clubs', label: 'Clubs' },
    { href: '/wallet', label: 'Wallet' },
    ...(session?.user ? [
      { href: `/profile/${session.user.id}`, label: 'Profile' },
      ...(isAdmin ? [
        { href: '/admin/disputes', label: 'Admin Disputes' },
        { href: '/admin/balance', label: 'Balance Management' },
      ] : []),
    ] : [
      { href: '/login', label: 'Login' },
      { href: '/register', label: 'Register' },
    ]),
  ];

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-white font-bold text-xl">
                Klutch.gg
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {links.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      } rounded-md px-3 py-2 text-sm font-medium`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {status === 'loading' ? (
                <div className="animate-pulse bg-gray-700 rounded-md px-3 py-2 w-20"></div>
              ) : session ? (
                <div className="flex items-center space-x-4">
                  {balance !== null && (
                    <Link
                      href="/wallet"
                      className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Balance: ${balance.toFixed(2)}
                    </Link>
                  )}
                  <span className="text-gray-300 text-sm">
                    {session.user?.name || session.user?.email}
                  </span>
                  <LogoutButton />
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="text-white bg-indigo-600 hover:bg-indigo-500 rounded-md px-3 py-2 text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {links.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } block rounded-md px-3 py-2 text-base font-medium`}
              >
                {item.label}
              </Link>
            );
          })}
          {balance !== null && session && (
            <Link
              href="/wallet"
              className="block text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-base font-medium"
            >
              Balance: ${balance.toFixed(2)}
            </Link>
          )}
          {status === 'loading' ? (
            <div className="animate-pulse bg-gray-700 rounded-md px-3 py-2 w-20 my-2"></div>
          ) : !session ? (
            <>
              <Link
                href="/login"
                className="block text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-base font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block text-white bg-indigo-600 hover:bg-indigo-500 rounded-md px-3 py-2 text-base font-medium mt-2"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <LogoutButton />
          )}
        </div>
      </div>
    </nav>
  );
} 