import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/api/auth',
  '/_next',
  '/images',
  '/favicon.ico'
];

export default async function middleware(req: NextRequestWithAuth) {
  const path = req.nextUrl.pathname;
  
  // Check if the path starts with any of the public paths
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next();
  }

  const session = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to login if no session and trying to access protected route
  if (!session) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', encodeURI(path));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api/auth routes (for authentication)
     * 2. /_next (Next.js internals)
     * 3. /images (inside public directory)
     * 4. All files in public (e.g. favicon.ico, robots.txt)
     */
    '/((?!api/auth|_next|images|.*\\..*|).*)',
  ],
}; 