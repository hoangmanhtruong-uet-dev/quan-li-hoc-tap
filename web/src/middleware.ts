import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required in production');
  }
  return new TextEncoder().encode(secret || 'dev-only-auth-secret');
}

const SECRET = getAuthSecret();

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/calendar',
  '/tasks',
  '/study',
  '/roadmaps',
  '/skills',
  '/clubs',
  '/living',
  '/notifications',
  '/profile',
  '/settings',
  '/onboarding',
];

// Routes that only unauthenticated users can access
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value;

  // Skip middleware for API routes, static files, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuth = authRoutes.some(route => pathname.startsWith(route));

  // Verify token
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      valid = true;
    } catch {
      valid = false;
    }
  }

  // Redirect unauthenticated away from protected routes
  if (isProtected && !valid) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuth && valid) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
