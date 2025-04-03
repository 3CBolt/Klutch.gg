import './globals.css'
import { Inter } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'
import AuthProvider from './components/providers/AuthProvider'
import Navigation from './components/Navigation'
import { Toaster } from './components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Klutch.gg',
  description: 'A platform for gaming challenges and tournaments',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`h-full ${inter.className}`}>
        <AuthProvider>
          <Navigation />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
} 