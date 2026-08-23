// Trainer Registration API — Server-Side (Admin SDK)
// Creates a Firebase Auth account + user doc + tenant trainer doc.
//
// This is the ONLY path that creates a trainer. The admin page used to do the
// same three writes from the browser through a secondary Firebase app, which
// left the trainer half-created whenever one of the writes was refused: the
// auth account existed but the /users doc or the tenant trainer doc did not, so
// nothing showed up in the list and a retry failed with "email already in use".
// Doing it here also sets the custom claims a trainer needs in order to log in.
import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limiter';

export async function POST(request) {
  try {
    // The caller identity comes from the verified ID token, never from the
    // body — a body field would let anyone pass an owner's uid.
    const auth = await verifyApiAuth(request);
    if (auth.error) return auth.errorResponse;
    const callerUid = auth.uid;

    // Rate limit by caller — prevents bulk-abuse of user creation
    const rl = checkRateLimit(`trainers:${callerUid}`, 10, 60000);
    if (rl.limited) return rateLimitResponse(rl.retryAfter);

    const body = await request.json();
    const {
      email, password, tenantId,
      name, phone, specialization, commission, gender,
    } = body;

    console.log('[Trainer API] Request received:', { email, tenantId });

    // Validate required fields
    if (!email || !password || !tenantId) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Email, password and tenantId are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'weak_password', message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (!name?.ar) {
      return NextResponse.json(
        { error: 'missing_name', message: 'Trainer Arabic name is required' },
        { status: 400 }
      );
    }

    // Clamp commission to a sane percentage range (was unbounded — could be
    // negative or 1000%).
    const commissionPct = Math.min(100, Math.max(0, Number(commission) || 10));

    // Import Admin SDK
    const { createUserServerSide, getAdminDb, getAdminAuth, setCustomClaims, logAuditServer } = await import('@/lib/firebase/admin');
    const adminDb = getAdminDb();

    if (!adminDb) {
      return NextResponse.json(
        { error: 'server_error', message: 'Database not available' },
        { status: 500 }
      );
    }

    // Verify caller is a tenant admin/owner
    const callerDoc = await adminDb.doc(`users/${callerUid}`).get();
    if (!callerDoc.exists) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Caller user not found' },
        { status: 403 }
      );
    }

    const callerData = callerDoc.data();
    if (callerData.tenantId !== tenantId || !['owner', 'admin'].includes(callerData.tenantRole)) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'You do not have permission to add trainers' },
        { status: 403 }
      );
    }

    // Check tenant exists and is active
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get();
    if (!tenantDoc.exists) {
      return NextResponse.json(
        { error: 'tenant_not_found', message: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenantData = tenantDoc.data();
    if (!['active', 'trial'].includes(tenantData.status)) {
      return NextResponse.json(
        { error: 'tenant_inactive', message: 'Tenant subscription is not active' },
        { status: 403 }
      );
    }

    const { Timestamp } = await import('firebase-admin/firestore');

    // 1. Create Firebase Auth account for the trainer
    console.log('[Trainer API] Creating auth account...');
    const displayName = name.ar || name.en || '';
    let { uid, error: authError } = await createUserServerSide(email, password, displayName);

    if (authError && authError.includes('email-already-exists')) {
      // An auth account with this email already exists. That is usually the
      // wreckage of an earlier attempt that created the account and then failed
      // to write the Firestore documents — the admin sees "not saved", retries,
      // and is blocked forever. Adopt the orphan instead, but ONLY when it is
      // genuinely unclaimed: no user doc, or a trainer doc of THIS tenant with
      // no matching entry in the trainers list.
      const orphan = await getAdminAuth().getUserByEmail(email).catch(() => null);
      if (orphan) {
        const orphanUserDoc = await adminDb.doc(`users/${orphan.uid}`).get();
        const orphanUser = orphanUserDoc.exists ? orphanUserDoc.data() : null;
        const unclaimed = !orphanUser ||
          (orphanUser.tenantId === tenantId && orphanUser.role === 'trainer');
        const alreadyListed = unclaimed
          ? !(await adminDb.collection(`tenants/${tenantId}/trainers`)
              .where('uid', '==', orphan.uid).limit(1).get()).empty
          : true;

        if (unclaimed && !alreadyListed) {
          console.log('[Trainer API] Adopting orphaned auth account:', orphan.uid);
          await getAdminAuth().updateUser(orphan.uid, { password, displayName });
          uid = orphan.uid;
          authError = null;
        }
      }
    }

    if (authError) {
      console.error('[Trainer API] Auth error:', authError);
      // Map common errors to user-friendly messages
      let userMessage = authError;
      if (authError.includes('email-already-exists')) {
        userMessage = 'البريد الإلكتروني مستخدم بالفعل / Email already in use';
      }
      return NextResponse.json(
        { error: 'auth_error', message: userMessage },
        { status: 400 }
      );
    }
    console.log('[Trainer API] Auth account ready:', uid);

    // Steps 2-4 must all land or none of them: a trainer whose auth account
    // exists but whose trainer doc does not is invisible in the admin list AND
    // blocks the retry with "email already in use". If any step throws, the
    // auth account is removed again so the admin can simply press save again.
    let trainerDocRef;
    try {
      // 2. Create user document in /users collection
      await adminDb.doc(`users/${uid}`).set({
        uid,
        email,
        phone: phone || '',
        displayName,
        role: 'trainer',
        lang: 'ar',
        avatar: '',
        isActive: true,
        tenantId,
        superAdmin: false,
        tenantRole: 'trainer',
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        fcmTokens: [],
      });
      console.log('[Trainer API] User doc created');

      // 3. Set custom claims
      await setCustomClaims(uid, {
        tenantId,
        role: 'trainer',
        tenantRole: 'trainer',
        superAdmin: false,
      });
      console.log('[Trainer API] Custom claims set');

      // 4. Add trainer to tenant's trainers sub-collection
      trainerDocRef = await adminDb.collection(`tenants/${tenantId}/trainers`).add({
        uid,
        name: name || { ar: '', en: '' },
        phone: phone || '',
        email,
        specialization: specialization || '',
        commission: commissionPct,
        gender: gender || 'male',
        status: 'active',
        rating: 0,
        totalSessions: 0,
        monthlyEarnings: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log('[Trainer API] Trainer doc created:', trainerDocRef.id);
    } catch (writeError) {
      console.error('[Trainer API] Write failed, rolling back:', writeError.message);
      const { getAdminAuth } = await import('@/lib/firebase/admin');
      try { await adminDb.doc(`users/${uid}`).delete(); } catch {}
      try { await getAdminAuth()?.deleteUser(uid); } catch {}
      return NextResponse.json(
        { error: 'write_failed', message: writeError.message },
        { status: 500 }
      );
    }

    // 5. Audit trail
    await logAuditServer({
      action: 'create',
      entity: 'trainer',
      entityId: trainerDocRef.id,
      tenantId,
      userId: callerUid,
      userEmail: callerData.email || '',
      userRole: callerData.tenantRole || '',
      details: { description: { en: `Created trainer ${email}`, ar: `إنشاء مدرب ${email}` } },
    });

    return NextResponse.json({
      success: true,
      uid,
      trainerId: trainerDocRef.id,
      message: 'Trainer account created successfully',
    });

  } catch (error) {
    console.error('[Trainer API] Unhandled error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'server_error', message: error.message },
      { status: 500 }
    );
  }
}
