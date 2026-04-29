// AI Usage Tracking API — with Auth Verification
import { getMonthlyUsage, upgradeToPremium, downgradeToFree } from '@/lib/ai/token-tracker';
import { getAuthenticatedUserId } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Verify authentication
    const auth = await getAuthenticatedUserId(request);
    if (auth.error && auth.errorResponse) {
      return auth.errorResponse;
    }

    const usage = await getMonthlyUsage(auth.userId);
    return NextResponse.json(usage);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Verify authentication
    const auth = await getAuthenticatedUserId(request);
    if (auth.error && auth.errorResponse) {
      return auth.errorResponse;
    }
    const userId = auth.userId;

    // SECURITY: Verify user role for upgrade/downgrade actions
    if (action === 'upgrade' || action === 'downgrade') {
      try {
        const adminDb = getAdminDb();
        const userDoc = await adminDb.doc(`users/${userId}`).get();
        const userData = userDoc.data();

        // Only allow admin/owner roles or super admin to change AI plans
        const allowedRoles = ['admin', 'superadmin'];
        const allowedTenantRoles = ['owner', 'admin'];

        const isAuthorized = userData?.superAdmin === true ||
          allowedRoles.includes(userData?.role) ||
          allowedTenantRoles.includes(userData?.tenantRole);

        if (!isAuthorized) {
          return NextResponse.json(
            { error: 'forbidden', message: 'Only admins can change AI plans' },
            { status: 403 }
          );
        }
      } catch (err) {
        console.error('[Usage API] Role verification failed:', err.message);
        return NextResponse.json(
          { error: 'verification_failed', message: 'Could not verify user role' },
          { status: 500 }
        );
      }
    }

    if (action === 'upgrade') {
      const result = await upgradeToPremium(userId);
      return NextResponse.json(result);
    }

    if (action === 'downgrade') {
      const result = await downgradeToFree(userId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
