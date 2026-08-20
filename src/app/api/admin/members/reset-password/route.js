// POST /api/admin/members/reset-password — the owner sets a new login password
// for a member who can no longer get in.
//
// This is the path that works for EVERY member. Reading a stored password only
// ever worked for the bulk-imported ones; members created through the admin UI
// have their password in Firebase Auth only, where it cannot be read back.
//
// Owner-only, matching the delete route and firestore.rules, where every
// destructive tenant action is restricted to isTenantOwner().
import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limiter';

export async function POST(request) {
  try {
    const auth = await verifyApiAuth(request);
    if (auth.error) return auth.errorResponse;

    const rl = checkRateLimit(`member-reset-pw:${auth.uid}`, 10, 60000);
    if (rl.limited) return rateLimitResponse(rl.retryAfter);

    const { tenantId, memberId, newPassword } = await request.json();
    if (!tenantId || !memberId || !newPassword) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'tenantId, memberId and newPassword are required' },
        { status: 400 }
      );
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'weak_password', message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const { getAdminDb, getAdminAuth, logAuditServer } = await import('@/lib/firebase/admin');
    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: 'server_error', message: 'Service not available' }, { status: 500 });
    }

    const callerDoc = await adminDb.doc(`users/${auth.uid}`).get();
    if (!callerDoc.exists) {
      return NextResponse.json({ error: 'unauthorized', message: 'Caller user not found' }, { status: 403 });
    }
    const callerData = callerDoc.data();
    const isOwner = callerData.tenantId === tenantId && callerData.tenantRole === 'owner';
    if (!isOwner && !callerData.superAdmin) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Only the gym owner can reset a member password' },
        { status: 403 }
      );
    }

    const memberRef = adminDb.doc(`tenants/${tenantId}/members/${memberId}`);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      return NextResponse.json({ error: 'not_found', message: 'Member not found' }, { status: 404 });
    }
    const member = memberSnap.data();
    if (!member.uid) {
      return NextResponse.json(
        { error: 'no_account', message: 'This member has no login account' },
        { status: 400 }
      );
    }

    try {
      await adminAuth.updateUser(member.uid, { password: newPassword });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'no_account', message: 'The linked login account no longer exists' },
          { status: 404 }
        );
      }
      console.error('[Reset Password API] updateUser failed:', err.code, err.message);
      return NextResponse.json({ error: 'server_error', message: err.message }, { status: 500 });
    }

    // Sign out any session still holding the old credential — the usual reason
    // for a reset is that the account is out of the member's control.
    let sessionsRevoked = true;
    try {
      await adminAuth.revokeRefreshTokens(member.uid);
    } catch (err) {
      sessionsRevoked = false;
      console.error('[Reset Password API] revokeRefreshTokens failed:', err.message);
    }

    // Keep the stored copy honest where one already exists, so the owner is never
    // shown a password that no longer works. We do not create the field for
    // members who never had it — for them this route IS the recovery path.
    if (member.accountPassword !== undefined) {
      const { FieldValue } = await import('firebase-admin/firestore');
      await memberRef.update({ accountPassword: newPassword, updatedAt: FieldValue.serverTimestamp() });
    }

    const memberName = member.fullName?.ar || member.fullName?.en || member.membershipNumber || memberId;
    await logAuditServer({
      action: 'update',
      entity: 'member_account',
      entityId: memberId,
      tenantId,
      userId: auth.uid,
      userEmail: callerData.email || '',
      userRole: callerData.tenantRole || (callerData.superAdmin ? 'superadmin' : ''),
      severity: 'warning',
      details: {
        description: {
          en: `Reset the login password for member ${memberName}`,
          ar: `إعادة تعيين كلمة سر العضو ${memberName}`,
        },
      },
    });

    return NextResponse.json({
      success: true,
      email: member.accountEmail || member.email || '',
      sessionsRevoked,
    });
  } catch (error) {
    console.error('[Reset Password API] Unhandled error:', error.message, error.stack);
    return NextResponse.json({ error: 'server_error', message: error.message }, { status: 500 });
  }
}
