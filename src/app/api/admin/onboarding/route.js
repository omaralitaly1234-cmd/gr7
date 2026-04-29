// Gym Owner Registration API — Server-Side (Admin SDK)
// This route handles the onboarding flow securely
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, displayName, phone, lang, gymName, gymNameAr, gymNameEn, addressAr, addressEn } = body;

    // Validate required fields
    if (!email || !password || !gymName) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Email, password, and gym name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'weak_password', message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Use Admin SDK for server-side user creation
    const { createUserServerSide, getAdminDb } = await import('@/lib/firebase/admin');

    // 1. Create user in Firebase Auth via Admin SDK
    const { uid, error: authError } = await createUserServerSide(email, password, displayName || gymName);
    if (authError) {
      return NextResponse.json({ error: 'auth_error', message: authError }, { status: 400 });
    }

    // 2. Create user document with owner privileges via Admin SDK (bypasses Firestore rules)
    const adminDb = getAdminDb();
    const { Timestamp } = await import('firebase-admin/firestore');

    await adminDb.doc(`users/${uid}`).set({
      uid,
      email,
      phone: phone || '',
      displayName: displayName || '',
      role: 'admin',
      lang: lang || 'ar',
      avatar: '',
      isActive: true,
      tenantId: null, // Will be updated after tenant creation
      superAdmin: false,
      tenantRole: 'owner',
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
      fcmTokens: [],
    });

    // 3. Create tenant document
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 90);

    const tenantRef = await adminDb.collection('tenants').add({
      name: gymName || '',
      nameAr: gymNameAr || gymName || '',
      nameEn: gymNameEn || gymName || '',
      ownerEmail: email,
      ownerUid: uid,
      phone: phone || '',
      address: { ar: addressAr || '', en: addressEn || '' },
      logo: '',
      status: 'trial',
      createdAt: Timestamp.now(),
      subscription: {
        plan: 'trial',
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(trialEnd),
        trialStartDate: Timestamp.fromDate(now),
        trialEndDate: Timestamp.fromDate(trialEnd),
        autoRenew: false,
        lastPaymentDate: null,
        nextPaymentDate: null,
      },
      features: {
        ai_nutrition: false, ai_workout: false, ai_churn: false, ai_sentiment: false,
        ai_pricing: false, ai_chatbot: false, ai_body_analysis: false, ai_social: false,
        advanced_analytics: true, spa_module: true, inventory_module: true,
        hr_module: true, sms_notifications: true,
      },
      limits: { maxMembers: 100, maxTrainers: 3 },
    });

    // 4. Link user to tenant
    await adminDb.doc(`users/${uid}`).update({ tenantId: tenantRef.id });

    // 5. Set custom claims for Storage rules & auth token
    const { setCustomClaims } = await import('@/lib/firebase/admin');
    await setCustomClaims(uid, {
      tenantId: tenantRef.id,
      role: 'admin',
      tenantRole: 'owner',
      superAdmin: false,
    });

    return NextResponse.json({
      success: true,
      uid,
      tenantId: tenantRef.id,
      message: 'Gym registered successfully',
    });
  } catch (error) {
    console.error('[Onboarding API] Error:', error.message);
    return NextResponse.json(
      { error: 'server_error', message: error.message },
      { status: 500 }
    );
  }
}
