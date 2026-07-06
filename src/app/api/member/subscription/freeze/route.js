// POST /api/member/subscription/freeze — member freezes their active subscription.
// Transactional: re-resolves the active subscription server-side, enforces the
// maxFreezeDays cap, and extends endDate atomically (fixes the client-side
// check-then-write race and the missing server-side cap).
import { resolveMemberContext, ok, fail, num } from '@/lib/api-member';
import { computeFreeze } from '@/lib/subscription-math';

export async function POST(request) {
  const ctx = await resolveMemberContext(request);
  if (ctx.error) return ctx.errorResponse;

  let body;
  try { body = await request.json(); } catch { return fail(400, 'bad_json', 'Invalid JSON body'); }

  const days = num(body.days, 1, 365);
  if (days === null) return fail(400, 'invalid_days', 'days must be between 1 and 365');

  const { adminDb, tenantId, memberId } = ctx;
  const { Timestamp } = await import('firebase-admin/firestore');
  const subsRef = adminDb.collection(`tenants/${tenantId}/subscriptions`);

  try {
    const result = await adminDb.runTransaction(async (t) => {
      const q = subsRef.where('memberId', '==', memberId).where('status', '==', 'active').limit(1);
      const snap = await t.get(q);
      if (snap.empty) throw new Error('no_active_subscription');
      const doc = snap.docs[0];
      const sub = doc.data();

      const currentEnd = sub.endDate?.toDate ? sub.endDate.toDate() : new Date(sub.endDate);
      const r = computeFreeze(
        { endDateMs: currentEnd.getTime(), freezeDaysUsed: sub.freezeDaysUsed, maxFreezeDays: sub.maxFreezeDays },
        days,
      );
      if (!r.ok) throw new Error(r.error === 'cap_exceeded' ? `cap_exceeded:${r.remaining}` : 'invalid_days');

      t.update(doc.ref, {
        freezeDaysUsed: r.newFreezeDaysUsed,
        endDate: Timestamp.fromDate(new Date(r.newEndDateMs)),
        lastFreezeDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { freezeDaysUsed: r.newFreezeDaysUsed, endDate: new Date(r.newEndDateMs).toISOString() };
    });
    return ok(result);
  } catch (e) {
    if (e.message === 'no_active_subscription') return fail(404, 'no_active_subscription', 'No active subscription found');
    if (e.message.startsWith('cap_exceeded')) {
      return fail(409, 'cap_exceeded', `Freeze limit reached. Remaining days: ${e.message.split(':')[1]}`);
    }
    return fail(500, 'server_error', e.message);
  }
}
