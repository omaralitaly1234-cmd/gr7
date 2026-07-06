// POST /api/member/checkin — member submits a daily mood/energy/sleep check-in.
import { resolveMemberContext, ok, fail, num } from '@/lib/api-member';

const SLEEP_ALLOWED = ['8+', '7', '6', '5', '<5'];

export async function POST(request) {
  const ctx = await resolveMemberContext(request);
  if (ctx.error) return ctx.errorResponse;

  let body;
  try { body = await request.json(); } catch { return fail(400, 'bad_json', 'Invalid JSON body'); }

  const mood = num(body.mood, 1, 5);
  const energy = num(body.energy, 1, 5);
  const soreness = num(body.soreness, 0, 3);
  const sleep = SLEEP_ALLOWED.includes(body.sleep) ? body.sleep : null;
  if (mood === null || energy === null || soreness === null || sleep === null) {
    return fail(400, 'invalid', 'mood/energy (1-5), soreness (0-3) and sleep are required');
  }

  const { adminDb, tenantId, memberId } = ctx;
  const { FieldValue } = await import('firebase-admin/firestore');
  const date = new Date().toISOString().split('T')[0];
  const ref = await adminDb.collection(`tenants/${tenantId}/checkins`).add({
    memberId, mood, energy, sleep, soreness, date,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ok({ id: ref.id });
}
