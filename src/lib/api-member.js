// ============================================
// Member API context resolver — Server-Side
// Resolves the authenticated member from their Firebase ID token and locates
// their member document server-side, so member-scoped writes can force
// memberId / tenantId to the caller's own identity (no client spoofing).
// Used by src/app/api/member/* routes.
// ============================================

import { getAuthenticatedUserId } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase/admin';

function jsonError(status, error, message) {
  return {
    error,
    errorResponse: new Response(JSON.stringify({ error, message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  };
}

/**
 * Resolve { uid, tenantId, memberId, memberRef, memberData, adminDb } for the
 * authenticated caller. On failure returns { error, errorResponse } — the route
 * should `if (ctx.error) return ctx.errorResponse;`.
 */
export async function resolveMemberContext(request) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.error) return { error: auth.error, errorResponse: auth.errorResponse };

  const uid = auth.userId;
  const adminDb = getAdminDb();
  if (!adminDb) return jsonError(500, 'server_error', 'Database not available');

  const userSnap = await adminDb.doc(`users/${uid}`).get();
  if (!userSnap.exists) return jsonError(403, 'no_user', 'User record not found');

  const tenantId = userSnap.data().tenantId;
  if (!tenantId) return jsonError(403, 'no_tenant', 'Account is not linked to a gym');

  const membersRef = adminDb.collection(`tenants/${tenantId}/members`);
  let snap = await membersRef.where('uid', '==', uid).limit(1).get();
  if (snap.empty) snap = await membersRef.where('userId', '==', uid).limit(1).get();
  if (snap.empty) return jsonError(403, 'no_member', 'No member profile linked to this account');

  const memberDoc = snap.docs[0];
  return {
    uid,
    tenantId,
    memberId: memberDoc.id,
    memberRef: memberDoc.ref,
    memberData: memberDoc.data(),
    adminDb,
    error: null,
  };
}

/** JSON success helper. */
export function ok(data = {}) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** JSON error helper for use inside route bodies. */
export function fail(status, error, message) {
  return new Response(JSON.stringify({ error, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Coerce to a finite number within [min,max], or null if blank/invalid. */
export function num(value, min, max) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (min !== undefined && n < min) return null;
  if (max !== undefined && n > max) return null;
  return n;
}
