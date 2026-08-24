// Invoice serial backfill — Server-Side (Admin SDK)
//
// Only the payments desk and the spa ever numbered their rows, so every invoice
// that came from a new subscription or a renewal sits in
// admin/finance/invoices with a blank serial. New payments are numbered at the
// source now; this route gives the existing ones their place in the same
// sequence, oldest first, so the ledger reads in order.
//
// Runs server-side because it touches every payment document: doing it from the
// browser would download the whole collection and fire thousands of writes
// under the client's rules.
import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limiter';
import {
  formatInvoiceNumber, highestInvoiceSeq, needsInvoiceNumber, planInvoiceBackfill,
  INVOICE_COUNTER_KEY,
} from '@/lib/invoice-number';
import { normalizeInvoicePrefix, SETTINGS_COLLECTION, SETTINGS_DOC_ID } from '@/lib/gym-profile';

// A guard against an unbounded read, not a real expectation. Reported back when
// it bites so a truncated run is never mistaken for a complete one.
const MAX_PAYMENTS = 20000;
const BATCH_SIZE = 400;

export async function POST(request) {
  try {
    const auth = await verifyApiAuth(request);
    if (auth.error) return auth.errorResponse;

    // Rewrites a whole collection — keep it to a couple of runs a minute.
    const rl = checkRateLimit(`invoice-backfill:${auth.uid}`, 3, 60000);
    if (rl.limited) return rateLimitResponse(rl.retryAfter);

    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'tenantId is required' },
        { status: 400 }
      );
    }

    const { getAdminDb, logAuditServer } = await import('@/lib/firebase/admin');
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'server_error', message: 'Database not available' },
        { status: 500 }
      );
    }

    // Same permission bar as every other write on this collection: the rules
    // restrict tenant payments to owner/admin, and the Admin SDK bypasses them.
    const callerDoc = await adminDb.doc(`users/${auth.uid}`).get();
    const caller = callerDoc.exists ? callerDoc.data() : null;
    if (!caller || caller.tenantId !== tenantId || !['owner', 'admin'].includes(caller.tenantRole)) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'You do not have permission to renumber invoices' },
        { status: 403 }
      );
    }

    // The gym's own serial prefix, so a backfilled invoice looks like the ones
    // the desk prints rather than a different series.
    const settingsSnap = await adminDb
      .doc(`tenants/${tenantId}/${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`).get();
    const prefix = normalizeInvoicePrefix(
      settingsSnap.exists ? settingsSnap.data().invoicePrefix : null);

    // Oldest first, so the serials follow the order the money actually came in.
    // `select` keeps this to the two fields that matter instead of pulling
    // every payment document in full.
    const snap = await adminDb.collection(`tenants/${tenantId}/payments`)
      .orderBy('createdAt', 'asc')
      .select('invoiceNumber', 'createdAt')
      .limit(MAX_PAYMENTS)
      .get();

    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const missing = all.filter(needsInvoiceNumber);
    const truncated = all.length >= MAX_PAYMENTS;

    if (missing.length === 0) {
      return NextResponse.json({
        success: true, numbered: 0, alreadyNumbered: all.length, total: all.length, truncated,
      });
    }

    // Reserve the whole block in one transaction so a payment recorded from the
    // desk mid-run cannot be handed a number this backfill is about to use.
    const counterRef = adminDb.doc(`tenants/${tenantId}/counters/${INVOICE_COUNTER_KEY}`);
    const highestStoredSeq = highestInvoiceSeq(all);

    const { next: firstSeq } = await adminDb.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef);
      const plan = planInvoiceBackfill({
        counterSeq: counterSnap.exists ? (counterSnap.data().seq || 0) : 0,
        highestStoredSeq,
        missingCount: missing.length,
      });
      tx.set(counterRef, { seq: plan.base + plan.count, updatedAt: new Date() }, { merge: true });
      return plan;
    });

    // The year comes from the payment itself, so an invoice collected in 2025
    // does not get stamped with this year.
    let written = 0;
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      for (const [j, pay] of missing.slice(i, i + BATCH_SIZE).entries()) {
        const paidAt = pay.createdAt?.toDate ? pay.createdAt.toDate() : new Date();
        batch.update(adminDb.doc(`tenants/${tenantId}/payments/${pay.id}`), {
          invoiceNumber: formatInvoiceNumber(firstSeq + i + j, paidAt.getFullYear(), prefix),
          invoiceNumberBackfilled: true,
        });
        written += 1;
      }
      await batch.commit();
    }

    await logAuditServer({
      action: 'update',
      entity: 'invoice',
      entityId: 'backfill',
      tenantId,
      userId: auth.uid,
      userEmail: caller.email || '',
      userRole: caller.tenantRole || '',
      details: {
        description: {
          en: `Numbered ${written} previously unnumbered invoices`,
          ar: `ترقيم ${written} فاتورة كانت من غير رقم`,
        },
        after: { from: firstSeq, to: firstSeq + written - 1 },
      },
    });

    return NextResponse.json({
      success: true,
      numbered: written,
      alreadyNumbered: all.length - missing.length,
      total: all.length,
      from: formatInvoiceNumber(firstSeq, undefined, prefix),
      to: formatInvoiceNumber(firstSeq + written - 1, undefined, prefix),
      truncated,
    });
  } catch (error) {
    console.error('[Invoice backfill] Unhandled error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'server_error', message: error.message },
      { status: 500 }
    );
  }
}
