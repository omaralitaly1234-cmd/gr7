// Trainer Registration API — Server-Side (Admin SDK)
// Creates a Firebase Auth account + user doc + tenant trainer doc
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email, password, tenantId, callerUid,
      name, phone, specialization, commission, gender,
    } = body;

    console.log('[Trainer API] Request received:', { email, tenantId });

    // Validate required fields
    if (!email || !password || !tenantId || !callerUid) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Email, password, tenantId, and callerUid are required' },
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

    // Import Admin SDK
    const { createUserServerSide, getAdminDb, verifyIdToken, setCustomClaims } = await import('@/lib/firebase/admin');
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
    const { uid, error: authError } = await createUserServerSide(email, password, displayName);

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
    console.log('[Trainer API] Auth account created:', uid);

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
    const trainerDocRef = await adminDb.collection(`tenants/${tenantId}/trainers`).add({
      uid,
      name: name || { ar: '', en: '' },
      phone: phone || '',
      email,
      specialization: specialization || '',
      commission: commission || 10,
      gender: gender || 'male',
      status: 'active',
      rating: 0,
      totalSessions: 0,
      monthlyEarnings: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('[Trainer API] Trainer doc created:', trainerDocRef.id);

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
