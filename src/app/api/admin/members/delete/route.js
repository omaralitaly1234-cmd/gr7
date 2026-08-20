// Permanent Member Deletion API — Server-Side (Admin SDK)
// Hard-deletes a member together with every record that references them
// (subscriptions, payments, attendance, …), their /users doc and their Firebase
// Auth account. There is no undo — the caller must confirm twice in the UI.
//
// Owner-only, mirroring firestore.rules where `allow delete` on every tenant
// sub-collection is restricted to isTenantOwner(). The Admin SDK bypasses
// rules, so that check is re-implemented here.
import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limiter';

// Collections holding one doc per event/record, keyed by the member's doc id.
const LINKED_COLLECTIONS = [
  ['subscriptions', 'memberId'],
  ['payments', 'memberId'],
  ['attendance', 'memberId'],
  ['checkins', 'memberId'],
  ['measurements', 'memberId'],
  ['messages', 'memberId'],
  ['notifications', 'memberId'],
  ['renewal-requests', 'memberId'],
  ['contracts', 'memberId'],
  ['spa_bookings', 'memberId'],
  ['injuries', 'memberId'],
  ['evaluations', 'memberId'],
  ['assessments', 'memberId'],
  ['session_notes', 'memberId'],
  ['trainer_sessions', 'memberId'],
  ['diet_plans', 'clientId'],
  ['training_programs', 'clientId'],
];

export async function POST(request) {
  try {
    const auth = await verifyApiAuth(request);
    if (auth.error) return auth.errorResponse;

    // Destructive + fans out into many writes — keep it well under the
    // per-minute budget of the create endpoints.
    const rl = checkRateLimit(`member-delete:${auth.uid}`, 5, 60000);
    if (rl.limited) return rateLimitResponse(rl.retryAfter);

    const { tenantId, memberId } = await request.json();
    if (!tenantId || !memberId) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'tenantId and memberId are required' },
        { status: 400 }
      );
    }

    const { getAdminDb, getAdminAuth, logAuditServer } = await import('@/lib/firebase/admin');
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'server_error', message: 'Database not available' },
        { status: 500 }
      );
    }

    // Caller must be the tenant owner (or a super admin)
    const callerDoc = await adminDb.doc(`users/${auth.uid}`).get();
    if (!callerDoc.exists) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Caller user not found' },
        { status: 403 }
      );
    }
    const callerData = callerDoc.data();
    const isOwner = callerData.tenantId === tenantId && callerData.tenantRole === 'owner';
    if (!isOwner && !callerData.superAdmin) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Only the gym owner can permanently delete a member' },
        { status: 403 }
      );
    }

    const memberRef = adminDb.doc(`tenants/${tenantId}/members/${memberId}`);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      return NextResponse.json(
        { error: 'not_found', message: 'Member not found' },
        { status: 404 }
      );
    }
    const member = memberSnap.data();

    // 1. Delete every linked record. Each collection is paged in batches of 300
    //    so a member with thousands of attendance rows can't blow the 500-write
    //    batch limit or hold the whole result set in memory.
    const deletedCounts = {};
    for (const [collectionName, field] of LINKED_COLLECTIONS) {
      let total = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const snap = await adminDb
          .collection(`tenants/${tenantId}/${collectionName}`)
          .where(field, '==', memberId)
          .limit(300)
          .get();
        if (snap.empty) break;
        const batch = adminDb.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        total += snap.size;
        if (snap.size < 300) break;
      }
      if (total > 0) deletedCounts[collectionName] = total;
    }

    // 2. Delete the member doc and anything nested underneath it
    //    (members/{id}/workouts/… etc.)
    await adminDb.recursiveDelete(memberRef);

    // 3. Remove the login: /users doc + Firebase Auth account, if the member
    //    was ever given one. A failure here must not resurrect the member, so
    //    it is logged and reported rather than thrown.
    let authRemoved = false;
    const authWarnings = [];
    if (member.uid) {
      try {
        await adminDb.doc(`users/${member.uid}`).delete();
      } catch (err) {
        authWarnings.push(`user doc: ${err.message}`);
      }
      try {
        await getAdminAuth().deleteUser(member.uid);
        authRemoved = true;
      } catch (err) {
        if (err.code === 'auth/user-not-found') authRemoved = true;
        else authWarnings.push(`auth account: ${err.message}`);
      }
    }

    const memberName = member.fullName?.ar || member.fullName?.en || member.membershipNumber || memberId;
    await logAuditServer({
      action: 'delete',
      entity: 'member',
      entityId: memberId,
      tenantId,
      userId: auth.uid,
      userEmail: callerData.email || '',
      userRole: callerData.tenantRole || (callerData.superAdmin ? 'superadmin' : ''),
      severity: 'warning',
      details: {
        description: {
          en: `Permanently deleted member ${memberName}`,
          ar: `حذف نهائي للعضو ${memberName}`,
        },
        before: {
          membershipNumber: member.membershipNumber || '',
          phone: member.phone || '',
          uid: member.uid || null,
          deletedCounts,
        },
      },
    });

    return NextResponse.json({ success: true, deletedCounts, authRemoved, warnings: authWarnings });
  } catch (error) {
    console.error('[Member Delete API] Unhandled error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'server_error', message: error.message },
      { status: 500 }
    );
  }
}
