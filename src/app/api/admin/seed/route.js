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

    // Only allow Super Admin UID or env-configured UID
    const superAdminUid = process.env.SUPER_ADMIN_UID;
    if (auth.uid !== superAdminUid) {
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
