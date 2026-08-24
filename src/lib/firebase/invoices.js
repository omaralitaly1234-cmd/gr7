'use client';

// ============================================
// One place to allocate an invoice number.
//
// Every screen that records money must call this, otherwise the payment lands
// in admin/finance/invoices with a blank serial — which is what used to happen
// for new subscriptions and renewals (only the payments desk and the spa
// numbered their rows).
// ============================================

import { getTenantCollectionCount } from './firestore';
import { nextSequentialNumber } from './counters';
import { INVOICE_COUNTER_KEY, INVOICE_PREFIX } from '@/lib/invoice-number';

/**
 * Reserve the next invoice serial for a tenant, atomically.
 *
 * The counter is seeded from the real payments count the first time it is
 * created — NOT from whatever short page of payments the calling screen happens
 * to have in memory, which is what the two existing call sites did and which
 * would have restarted the serial at 101 on a gym with 3,000 payments.
 *
 * Never throws: an invoice number is not worth losing a recorded payment over.
 * Returns null if the counter cannot be reached, and the caller stores that as
 * "no number yet" — the backfill on the invoices page picks it up later.
 */
export async function nextInvoiceNumber(tenantId) {
  if (!tenantId) return null;
  try {
    const { count } = await getTenantCollectionCount(tenantId, 'payments');
    return await nextSequentialNumber(tenantId, INVOICE_COUNTER_KEY, INVOICE_PREFIX, count || 0);
  } catch (err) {
    console.error('[invoices] could not allocate an invoice number:', err);
    return null;
  }
}
