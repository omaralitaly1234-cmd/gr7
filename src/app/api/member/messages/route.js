// POST /api/member/messages — member sends a message to their assigned trainer.
import { resolveMemberContext, ok, fail } from '@/lib/api-member';

export async function POST(request) {
  const ctx = await resolveMemberContext(request);
  if (ctx.error) return ctx.errorResponse;

  let body;
  try { body = await request.json(); } catch { return fail(400, 'bad_json', 'Invalid JSON body'); }

  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2000) : '';
  if (!text) return fail(400, 'empty', 'Message text is required');

  const { adminDb, tenantId, memberId, memberData, uid } = ctx;
  const trainerId = memberData.assignedTrainer || null;

  const { FieldValue } = await import('firebase-admin/firestore');
  const msg = {
    senderId: uid,
    senderName: memberData.fullName || '',
    receiverId: trainerId,
    memberId,
    text,
    from: 'member',
    participants: [uid, trainerId].filter(Boolean),
    read: false,
    sentAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = await adminDb.collection(`tenants/${tenantId}/messages`).add(msg);
  return ok({ id: ref.id });
}
