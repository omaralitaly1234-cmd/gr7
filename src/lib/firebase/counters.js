// ============================================
// Atomic sequential counters (client SDK transactions)
// One counter doc per (tenant, key) at tenants/{tid}/counters/{key}.
// The atomic increment guarantees each caller gets a distinct, monotonic
// sequence number — fixes duplicate invoice numbers and duplicate membership
// numbers that arose from the old `collection.length + 1` pattern (which races
// under concurrency and reuses numbers after a delete).
// ============================================

import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

/**
 * Atomically get the next sequence number for a counter and return it formatted
 * as `${prefix}-${year}-NNNN`.
 *
 * @param {string} tenantId
 * @param {string} key    - counter name (e.g. 'members', 'invoices', 'spa_invoices')
 * @param {string} prefix - human prefix (e.g. 'PT', 'INV', 'SPA')
 * @param {number} floor  - initial value to seed the counter with the FIRST time
 *                          it is created (use the existing collection count so new
 *                          numbers don't collide with pre-counter data). Ignored
 *                          once the counter exists.
 * @returns {Promise<string>} formatted number
 */
export async function nextSequentialNumber(tenantId, key, prefix, floor = 0) {
  const year = new Date().getFullYear();
  const counterRef = doc(db, `tenants/${tenantId}/counters/${key}`);
  const seq = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef);
    const current = snap.exists() ? (snap.data().seq || 0) : floor;
    const next = current + 1;
    t.set(counterRef, { seq: next, updatedAt: serverTimestamp() }, { merge: true });
    return next;
  });
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}
