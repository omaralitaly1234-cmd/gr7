// Gym Owner Registration API — Server-Side (Admin SDK)
// This route handles the onboarding flow securely
import { NextResponse } from 'next/server';

// Server-side plan definitions (avoid importing 'use client' module)
const SERVER_PLAN_DEFS = {
  trial: { durationDays: 90, maxMembers: 100, maxTrainers: 3, features: { ai_nutrition: false, ai_workout: false, ai_churn: false, ai_sentiment: false, ai_pricing: false, ai_chatbot: false, ai_body_analysis: false, ai_social: false, advanced_analytics: true, spa_module: true, inventory_module: true, hr_module: true, sms_notifications: true } },
  monthly: { durationDays: 30, maxMembers: 300, maxTrainers: 5, features: { ai_nutrition: true, ai_workout: true, ai_churn: true, ai_sentiment: true, ai_pricing: true, ai_chatbot: true, ai_body_analysis: true, ai_social: true, advanced_analytics: true, spa_module: true, inventory_module: true, hr_module: true, sms_notifications: true } },
  quarterly: { durationDays: 90, maxMembers: 500, maxTrainers: 10, features: { ai_nutrition: true, ai_workout: true, ai_churn: true, ai_sentiment: true, ai_pricing: true, ai_chatbot: true, ai_body_analysis: true, ai_social: true, advanced_analytics: true, spa_module: true, inventory_module: true, hr_module: true, sms_notifications: true } },
  semi_annual: { durationDays: 180, maxMembers: 1000, maxTrainers: 20, features: { ai_nutrition: true, ai_workout: true, ai_churn: true, ai_sentiment: true, ai_pricing: true, ai_chatbot: true, ai_body_analysis: true, ai_social: true, advanced_analytics: true, spa_module: true, inventory_module: true, hr_module: true, sms_notifications: true } },
  annual: { durationDays: 365, maxMembers: -1, maxTrainers: -1, features: { ai_nutrition: true, ai_workout: true, ai_churn: true, ai_sentiment: true, ai_pricing: true, ai_chatbot: true, ai_body_analysis: true, ai_social: true, advanced_analytics: true, spa_module: true, inventory_module: true, hr_module: true, sms_notifications: true } },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, displayName, phone, lang, gymName, gymNameAr, gymNameEn, addressAr, addressEn, selectedPlan } = body;

    console.log('[Onboarding API] Request received:', { email, gymName, selectedPlan });

    // Validate required fields
    if (!email || !password || !gymName) {
      console.log('[Onboarding API] Missing fields:', { email: !!email, password: !!password, gymName: !!gymName });
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

    // Resolve plan — default to trial
    const planKey = selectedPlan && SERVER_PLAN_DEFS[selectedPlan] ? selectedPlan : 'trial';
    const plan = SERVER_PLAN_DEFS[planKey];
    const isTrial = planKey === 'trial';

    console.log('[Onboarding API] Plan resolved:', planKey);

    // Use Admin SDK for server-side user creation
    const { createUserServerSide, getAdminDb } = await import('@/lib/firebase/admin');

    // 1. Create user in Firebase Auth via Admin SDK
    console.log('[Onboarding API] Creating user...');
    const { uid, error: authError } = await createUserServerSide(email, password, displayName || gymName);
    if (authError) {
      console.error('[Onboarding API] Auth error:', authError);
      return NextResponse.json({ error: 'auth_error', message: authError }, { status: 400 });
    }
    console.log('[Onboarding API] User created:', uid);

    // 2. Create user document with owner privileges via Admin SDK
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error('[Onboarding API] Admin DB not initialized');
      return NextResponse.json({ error: 'server_error', message: 'Database not available' }, { status: 500 });
    }

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
      tenantId: null,
      superAdmin: false,
      tenantRole: 'owner',
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
      fcmTokens: [],
    });
    console.log('[Onboarding API] User doc created');

    // 3. Create tenant document
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const tenantRef = await adminDb.collection('tenants').add({
      name: gymName || '',
      nameAr: gymNameAr || gymName || '',
      nameEn: gymNameEn || gymName || '',
      ownerEmail: email,
      ownerUid: uid,
      phone: phone || '',
      address: { ar: addressAr || '', en: addressEn || '' },
      logo: '',
      status: isTrial ? 'trial' : 'pending_payment',
      createdAt: Timestamp.now(),
      subscription: {
        plan: planKey,
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endDate),
        trialStartDate: isTrial ? Timestamp.fromDate(now) : null,
        trialEndDate: isTrial ? Timestamp.fromDate(endDate) : null,
        autoRenew: !isTrial,
        lastPaymentDate: null,
        nextPaymentDate: isTrial ? null : Timestamp.fromDate(endDate),
      },
      features: { ...plan.features },
      limits: { maxMembers: plan.maxMembers, maxTrainers: plan.maxTrainers },
    });
    console.log('[Onboarding API] Tenant created:', tenantRef.id);

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
    console.log('[Onboarding API] Custom claims set, registration complete');

    return NextResponse.json({
      success: true,
      uid,
      tenantId: tenantRef.id,
      message: 'Gym registered successfully',
    });
  } catch (error) {
    console.error('[Onboarding API] Unhandled error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'server_error', message: error.message },
      { status: 500 }
    );
  }
}

