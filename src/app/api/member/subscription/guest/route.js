// POST /api/member/subscription/guest — member invites a guest.
// Transactional: enforces the maxInvitations cap and increments the counter
// atomically alongside creating the guest-invitations doc (fixes the two-write
// drift where the counter and the invite list could disagree).
import { resolveMemberContext, ok, fail } from '@/lib/api-member';

export async function POST(request) {
  const ctx = await resolveMemberContext(request);
  if (ctx.error) return ctx.errorResponse;

  let body;
  try { body = await request.json(); } catch { return fail(400, 'bad_json', 'Invalid JSON body'); }

  const guestName = typeof body.guestName === 'string' ? body.guestName.trim().slice(0, 120) : '';
  const guestPhone = typeof body.guestPhone === 'string' ? body.guestPhone.trim().slice(0, 30) : '';
  if (!guestName) return fail(400, 'empty', 'Guest name is required');

  const { adminDb, tenantId, memberId, memberData } = ctx;
  const { Timestamp } = await import('firebase-admin/firestore');
  const subsRef = adminDb.collection(`tenants/${tenantId}/subscriptions`);
  const guestsRef = adminDb.collection(`tenants/${tenantId}/guest-invitations`);

  try {
    const result = await adminDb.runTransaction(async (t) => {
      const q = subsRef.where('memberId', '==', memberId).where('status', '==', 'active').limit(1);
      const snap = await t.get(q);
      if (snap.empty) throw new Error('no_active_subscription');
      const doc = snap.docs[0];
      const sub = doc.data();

      const used = sub.invitationsUsed || 0;
      const max = sub.maxInvitations || 0;
      if (used >= max) throw new Error('cap_exceeded');

      const guestRef = guestsRef.doc();
      t.set(guestRef, {
        memberId,
        memberName: memberData.fullName || '',
        subscriptionId: doc.id,
        guestName,
        guestPhone,
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      t.update(doc.ref, { invitationsUsed: used + 1, updatedAt: Timestamp.now() });
      return { invitationsUsed: used + 1, guestId: guestRef.id };
    });
    return ok(result);
  } catch (e) {
    if (e.message === 'no_active_subscription') return fail(404, 'no_active_subscription', 'No active subscription found');
    if (e.message === 'cap_exceeded') return fail(409, 'cap_exceeded', 'No guest invitations remaining');
    return fail(500, 'server_error', e.message);
  }
}
