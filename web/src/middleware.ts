import { NextResponse } from 'next/server.js';
import type { NextRequest } from 'next/server.js';
import { jwtVerify } from 'jose';

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required in production');
  }
  return new TextEncoder().encode(secret || 'dev-only-auth-secret');
}

const SECRET = getAuthSecret();

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && url.trim().length > 0 && !url.includes('mock-supabase'));
}

// Routes that require authentication
export const protectedRoutes = [
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
  '/workspaces',
  '/coach',
];

// Routes that only unauthenticated users can access
export const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, favicon, etc.
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

  // Check legacy session token
  const token = request.cookies.get('session')?.value;
  let validSession = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      validSession = true;
    } catch {
      validSession = false;
    }
  }

  // Check Supabase session cookies
  const allCookies = request.cookies.getAll();
  const hasSupabaseCookie = allCookies.some(
    c => (c.name.startsWith('sb-') && c.name.endsWith('-auth-token')) ||
         c.name === 'sb-access-token' ||
         c.name === 'sb-mock-auth',
  );

  const isAuthenticated = validSession || hasSupabaseCookie;

  // Offline bypass if Supabase is unconfigured:
  // Allow seamless developer iteration, unit testing, and SSR
  if (!isSupabaseConfigured()) {
    if (isAuthenticated && isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuth && isAuthenticated) {
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
