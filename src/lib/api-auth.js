// ============================================
// API Auth Helper — Server-Side Token Verification
// Used in all API Routes to verify Firebase Auth tokens
// ============================================

import { verifyIdToken } from '@/lib/firebase/admin';

/**
 * Verify the Authorization header from an API request
 * Returns { uid, email, error }
 * 
 * Usage in API routes:
 *   const auth = await verifyApiAuth(request);
 *   if (auth.error) return auth.errorResponse;
 */
export async function verifyApiAuth(request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      uid: null,
      email: null,
      error: 'missing_token',
      errorResponse: new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Missing or invalid Authorization header. Use: Bearer <idToken>',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  const idToken = authHeader.replace('Bearer ', '');

  try {
    const { uid, email, error } = await verifyIdToken(idToken);

    if (error || !uid) {
      return {
        uid: null,
        email: null,
        error: error || 'invalid_token',
        errorResponse: new Response(
          JSON.stringify({
            error: 'unauthorized',
            message: error || 'Invalid or expired token',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }

    return { uid, email, error: null, errorResponse: null };
  } catch (err) {
    return {
      uid: null,
      email: null,
      error: err.message,
      errorResponse: new Response(
        JSON.stringify({
          error: 'auth_error',
          message: 'Authentication verification failed',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}

/**
 * Quick helper: Extract userId from request (with auth verification)
 * SECURITY: Always requires valid Firebase ID token. No fallback.
 */
export async function getAuthenticatedUserId(request) {
  const auth = await verifyApiAuth(request);
  if (!auth.error) {
    return { userId: auth.uid, email: auth.email, error: null, errorResponse: null };
  }

  // No valid auth — return the error
  return auth;
}
