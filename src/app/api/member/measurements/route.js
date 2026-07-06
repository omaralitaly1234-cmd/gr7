// POST /api/member/measurements — member logs a body measurement.
// memberId is taken from the authenticated caller's member doc (not the body).
import { resolveMemberContext, ok, fail, num } from '@/lib/api-member';

const FIELDS = ['weight', 'chest', 'waist', 'hips', 'arms', 'thighs', 'shoulders', 'bodyFat'];

export async function POST(request) {
  const ctx = await resolveMemberContext(request);
  if (ctx.error) return ctx.errorResponse;

  let body;
  try { body = await request.json(); } catch { return fail(400, 'bad_json', 'Invalid JSON body'); }

  const entry = {};
  for (const f of FIELDS) entry[f] = num(body[f], 0, 1000);
  if (FIELDS.every((f) => entry[f] === null)) {
    return fail(400, 'empty', 'At least one measurement value is required');
  }

  const { adminDb, tenantId, memberId } = ctx;
  const { FieldValue } = await import('firebase-admin/firestore');
  const ref = await adminDb.collection(`tenants/${tenantId}/measurements`).add({
    ...entry,
    memberId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ok({ id: ref.id });
}
