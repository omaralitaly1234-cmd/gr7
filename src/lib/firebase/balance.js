'use client';

import { doc, runTransaction, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { applyPaymentToSchedule, scheduleBalance } from '@/lib/installments';

/**
 * Apply a received payment against a member's outstanding subscription balance.
 *
 * Runs in a transaction so two receptionists taking money at the same time
 * cannot both read the same balance and each write it down by their own amount
 * (which would forgive part of the debt).
 *
 * Returns the new balance, or null if the member has no subscription with a
 * balance to settle.
 */
export async function applyPaymentToMemberBalance(tenantId, memberId, amount) {
  const paid = Number(amount) || 0;
  if (!tenantId || !memberId || paid <= 0) return null;

  // Find the subscription carrying the debt (query outside the transaction;
  // the transaction re-reads the doc by id for a consistent update).
  const subsQ = query(
    collection(db, `tenants/${tenantId}/subscriptions`),
    where('memberId', '==', memberId),
    where('status', '==', 'active'),
  );
  const snap = await getDocs(subsQ);
  const target = snap.docs.find((d) => (d.data().balanceDue || 0) > 0);
  if (!target) return null;

  const subRef = doc(db, `tenants/${tenantId}/subscriptions/${target.id}`);
  const memberRef = doc(db, `tenants/${tenantId}/members/${memberId}`);

  return runTransaction(db, async (tx) => {
    const subSnap = await tx.get(subRef);
    if (!subSnap.exists()) return null;
    const sub = subSnap.data();

    const currentBalance = Number(sub.balanceDue) || 0;
    if (currentBalance <= 0) return 0;

    const applied = Math.min(paid, currentBalance);
    const newBalance = Math.round((currentBalance - applied) * 100) / 100;

    // Tick off instalments oldest-first. dueDate is a Timestamp on the stored
    // doc, so convert to millis for the pure helper and back again after.
    let installments = sub.installments || [];
    if (installments.length > 0) {
      const asMillis = installments.map((i) => ({
        ...i,
        dueDate: i.dueDate?.toMillis ? i.dueDate.toMillis() : Number(i.dueDate) || Date.now(),
      }));
      const { schedule } = applyPaymentToSchedule(asMillis, applied, Date.now());
      installments = schedule.map((i) => ({
        ...i,
        dueDate: Timestamp.fromMillis(i.dueDate),
        paidAt: i.paidAt ? Timestamp.fromMillis(i.paidAt) : null,
      }));
    }

    tx.update(subRef, {
      amountPaid: Math.round(((Number(sub.amountPaid) || 0) + applied) * 100) / 100,
      balanceDue: newBalance,
      paymentStatus: newBalance === 0 ? 'paid' : 'partial',
      installments,
    });
    tx.update(memberRef, { balanceDue: newBalance });

    return newBalance;
  });
}

/** Recompute a subscription's balance from its schedule (repair helper). */
export function balanceFromSchedule(sub) {
  return scheduleBalance(sub?.installments || []);
}
