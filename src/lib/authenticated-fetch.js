// ============================================
// Authenticated Fetch — Includes Firebase ID Token
// Use this for ALL API calls that require authentication
// ============================================

import { auth } from '@/lib/firebase/config';

/**
 * Make an authenticated fetch request with Firebase ID token
 * Automatically includes Authorization: Bearer <idToken> header
 * 
 * @param {string} url - API endpoint
 * @param {Object} options - fetch options (method, body, etc.)
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get fresh ID token from Firebase
  const idToken = await user.getIdToken(/* forceRefresh */ false);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Authenticated GET request
 */
export async function authGet(url) {
  return authenticatedFetch(url, { method: 'GET' });
}

/**
 * Authenticated POST request with JSON body
 */
export async function authPost(url, body) {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
