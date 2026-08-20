// POST /api/member/account — member changes their own login email / password.
//
// Runs server-side because the member cannot write their own member document
// (firestore.rules restricts member writes to admins), and because the Admin SDK
// can change an email without the verify-before-update round trip the client SDK
// requires.
//
// The caller must have re-authenticated moments ago: we check `auth_time` on the
// ID token rather than trusting the client to have done it, so a stolen but
// still-valid token cannot be used to take over the account.
import { resolveMemberContext, fail, ok } from '@/lib/api-member';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limiter';

const REAUTH_MAX_AGE_SECONDS = 5 * 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const ctx = await resolveMemberContext(request);
  if (ctx.error) return ctx.errorResponse;

  const rl = checkRateLimit(`member-account:${ctx.uid}`, 5, 60000);
  if (rl.limited) return rateLimitResponse(rl.retryAfter);

  let body;
  try { body = await request.json(); } catch { return fail(400, 'bad_json', 'Invalid JSON body'); }

  const newEmail = typeof body.newEmail === 'string' ? body.newEmail.trim().toLowerCase() : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!newEmail && !newPassword) {
    return fail(400, 'empty', 'Nothing to change');
  }
  if (newEmail && !EMAIL_RE.test(newEmail)) {
    return fail(400, 'bad_email', 'Invalid email address');
  }
  if (newPassword && newPassword.length < 6) {
    return fail(400, 'weak_password', 'Password must be at least 6 characters');
  }

  const { getAdminAuth, logAuditServer } = await import('@/lib/firebase/admin');
  const adminAuth = getAdminAuth();
  if (!adminAuth) return fail(500, 'server_error', 'Auth not available');

  // Proof of a recent password re-entry. The client re-authenticates and forces
  // a token refresh right before calling; that stamps a new auth_time.
  const idToken = request.headers.get('Authorization')?.replace('Bearer ', '') || '';
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return fail(401, 'unauthorized', 'Invalid token');
  }
  const age = Math.floor(Date.now() / 1000) - (decoded.auth_time || 0);
  if (age > REAUTH_MAX_AGE_SECONDS) {
    return fail(401, 'reauth_required', 'Please re-enter your current password and try again');
  }

  const authUpdate = {};
  if (newEmail) authUpdate.email = newEmail;
  if (newPassword) authUpdate.password = newPassword;

  try {
    await adminAuth.updateUser(ctx.uid, authUpdate);
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      return fail(409, 'email_in_use', 'That email is already used by another account');
    }
    if (err.code === 'auth/invalid-email') {
      return fail(400, 'bad_email', 'Invalid email address');
    }
    console.error('[Member Account API] updateUser failed:', err.code, err.message);
    return fail(500, 'server_error', err.message);
  }

  // Mirror onto the two documents the admin side reads, so the member's profile
  // in the admin panel shows what they actually log in with.
  const { FieldValue } = await import('firebase-admin/firestore');
  const memberUpdate = { updatedAt: FieldValue.serverTimestamp() };
  if (newEmail) {
    memberUpdate.email = newEmail;
    memberUpdate.accountEmail = newEmail;
  }
  // Only kept in sync where it already exists (the bulk-imported members). A
  // stale value here is worse than none — the owner would hand out a password
  // that no longer works — but we do not start storing one for members who
  // never had it.
  if (newPassword && ctx.memberData?.accountPassword !== undefined) {
    memberUpdate.accountPassword = newPassword;
  }

  await ctx.memberRef.update(memberUpdate);
  if (newEmail) {
    await ctx.adminDb.doc(`users/${ctx.uid}`).update({ email: newEmail });
  }

  await logAuditServer({
    action: 'update',
    entity: 'member_account',
    entityId: ctx.memberId,
    tenantId: ctx.tenantId,
    userId: ctx.uid,
    userEmail: decoded.email || '',
    userRole: 'member',
    severity: 'warning',
    details: {
      description: {
        en: `Member changed their ${[newEmail && 'email', newPassword && 'password'].filter(Boolean).join(' and ')}`,
        ar: `العضو غيّر ${[newEmail && 'البريد', newPassword && 'كلمة السر'].filter(Boolean).join(' و')}`,
      },
    },
  });

  return ok({ email: newEmail || undefined });
}
