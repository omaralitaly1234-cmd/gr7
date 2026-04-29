// Payment Confirmation API — Server-Side (Admin SDK)
// Only Super Admin can confirm/reject payments
import { verifyApiAuth } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Verify authentication
    const auth = await verifyApiAuth(request);
    if (auth.error) {
      return auth.errorResponse;
    }

    // Verify Super Admin role via Admin SDK
    const adminDb = getAdminDb();
    const userDoc = await adminDb.doc(`users/${auth.uid}`).get();

    if (!userDoc.exists || userDoc.data()?.superAdmin !== true) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Only Super Admin can manage payments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId, action } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'missing_field', message: 'paymentId is required' },
        { status: 400 }
      );
    }

    const paymentRef = adminDb.doc(`payments/${paymentId}`);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return NextResponse.json(
        { error: 'not_found', message: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = paymentDoc.data();
    const { Timestamp } = await import('firebase-admin/firestore');

    if (action === 'confirm') {
      // Update payment status
      await paymentRef.update({
        status: 'confirmed',
        confirmedBy: auth.uid,
        confirmedAt: Timestamp.now(),
      });

      // Auto-activate subscription if payment has plan info
      if (payment.planId && payment.tenantId) {
        const { PLAN_DEFINITIONS } = await import('@/lib/firebase/subscription');
        const plan = PLAN_DEFINITIONS[payment.planId];

        if (plan) {
          const now = new Date();
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() + plan.durationDays);

          await adminDb.doc(`tenants/${payment.tenantId}`).update({
            status: 'active',
            'subscription.plan': payment.planId,
            'subscription.startDate': Timestamp.fromDate(now),
            'subscription.endDate': Timestamp.fromDate(endDate),
            'subscription.lastPaymentDate': Timestamp.fromDate(now),
            'subscription.nextPaymentDate': Timestamp.fromDate(endDate),
            'subscription.autoRenew': true,
            features: { ...plan.features },
            'limits.maxMembers': plan.maxMembers,
            'limits.maxTrainers': plan.maxTrainers,
            updatedAt: Timestamp.now(),
          });
        }
      }

      return NextResponse.json({ success: true, message: 'Payment confirmed and subscription activated' });
    }

    if (action === 'reject') {
      await paymentRef.update({
        status: 'rejected',
        rejectedBy: auth.uid,
        rejectedAt: Timestamp.now(),
        rejectionReason: body.reason || '',
      });

      return NextResponse.json({ success: true, message: 'Payment rejected' });
    }

    return NextResponse.json({ error: 'invalid_action', message: 'Use action: confirm or reject' }, { status: 400 });
  } catch (error) {
    console.error('[Payments API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Fetch all payments (Super Admin only)
export async function GET(request) {
  try {
    const auth = await verifyApiAuth(request);
    if (auth.error) return auth.errorResponse;

    const adminDb = getAdminDb();
    const userDoc = await adminDb.doc(`users/${auth.uid}`).get();

    if (!userDoc.exists || userDoc.data()?.superAdmin !== true) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Only Super Admin can view all payments' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let query = adminDb.collection('payments').orderBy('createdAt', 'desc').limit(100);
    if (status) {
      query = adminDb.collection('payments').where('status', '==', status).orderBy('createdAt', 'desc').limit(100);
    }

    const snapshot = await query.get();
    const payments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ data: payments });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
