// Database Seed API — Protected (Super Admin Only)
import { verifyApiAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Verify authentication
    const auth = await verifyApiAuth(request);
    if (auth.error) {
      return auth.errorResponse;
    }

    // Seeding is a one-time bootstrap. Disabled unless explicitly enabled via
    // env flag, so it can never be triggered by an HTTP call in a normal
    // production deployment (defense against accidental data overwrite).
    if (process.env.ALLOW_SEED !== 'true') {
      return NextResponse.json(
        { error: 'seed_disabled', message: 'Seeding is disabled. Set ALLOW_SEED=true to enable.' },
        { status: 403 }
      );
    }

    // Only allow Super Admin UID or env-configured UID
    const superAdminUids = process.env.SUPER_ADMIN_UID ? process.env.SUPER_ADMIN_UID.split(',') : [];
    if (!superAdminUids.includes(auth.uid)) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Only Super Admin can seed the database' },
        { status: 403 }
      );
    }

    // Dynamic import to avoid client-side bundling issues
    const { seedDatabase } = await import('@/lib/firebase/seed');
    const results = await seedDatabase(auth.uid);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      results,
    });
  } catch (error) {
    console.error('[Seed API] Error:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
