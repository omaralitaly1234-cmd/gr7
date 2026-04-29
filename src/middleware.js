import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

export const locales = ['ar', 'en'];
export const defaultLocale = 'ar';

// Protected route patterns that require authentication
const PROTECTED_PATTERNS = [
  '/admin/',
  '/trainer/',
  '/client/',
  '/super-admin/',
];

// Public routes that don't need auth
const PUBLIC_PATTERNS = [
  '/login',
  '/register',
  '/forgot-password',
  '/onboarding',
];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: false,
});

export default function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Apply i18n middleware first
  const response = intlMiddleware(request);

  // Check if this is a protected route
  const isProtected = PROTECTED_PATTERNS.some(pattern =>
    pathname.includes(pattern)
  );

  const isPublic = PUBLIC_PATTERNS.some(pattern =>
    pathname.includes(pattern)
  );

  if (isProtected && !isPublic) {
    // Check for session cookie/token
    // Note: Firebase Auth state is client-side, so we check for a session cookie
    // The actual auth verification happens client-side in layout.js AuthProvider
    // This middleware adds a security header to flag protected routes
    const authCookie = request.cookies.get('__session') || request.cookies.get('firebase-auth-token');

    if (!authCookie) {
      // Set a header to signal client-side that auth check is needed
      // The layout.js will handle the actual redirect if user is not authenticated
      if (response) {
        response.headers.set('x-requires-auth', 'true');
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/(ar|en)/:path*'],
};
