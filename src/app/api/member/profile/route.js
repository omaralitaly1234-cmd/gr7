// POST /api/member/profile — member updates their own profile.
// Whitelisted fields only — prevents mass-assignment of status, membershipNumber,
// assignedTrainer, currentPlan, uid, totalSpent, etc.
import { resolveMemberContext, ok, fail, num } from '@/lib/api-member';

export async function POST(request) {
  const ctx = await resolveMemberContext(request);
  if (ctx.error) return ctx.errorResponse;

  let body;
  try { body = await request.json(); } catch { return fail(400, 'bad_json', 'Invalid JSON body'); }

  const str = (v, max = 500) => (typeof v === 'string' ? v.slice(0, max) : undefined);
  const update = {};
  if (body.fullName && typeof body.fullName === 'object') {
    update.fullName = { ar: str(body.fullName.ar) || '', en: str(body.fullName.en) || '' };
  }
  if (str(body.phone) !== undefined) update.phone = str(body.phone, 30);
  if (str(body.address) !== undefined) update.address = str(body.address);
  if (str(body.dateOfBirth) !== undefined) update.dateOfBirth = str(body.dateOfBirth, 30);
  if (str(body.bloodType) !== undefined) update.bloodType = str(body.bloodType, 10);
  if (str(body.fitnessGoal) !== undefined) update.fitnessGoal = str(body.fitnessGoal, 50);
  if (str(body.medicalNotes) !== undefined) update.medicalNotes = str(body.medicalNotes, 2000);
  if ('height' in body) update.height = num(body.height, 0, 300);
  if ('weight' in body) update.weight = num(body.weight, 0, 500);
  if (body.emergencyContact && typeof body.emergencyContact === 'object') {
    update.emergencyContact = {
      name: str(body.emergencyContact.name) || '',
      phone: str(body.emergencyContact.phone, 30) || '',
    };
  }

  if (Object.keys(update).length === 0) return fail(400, 'empty', 'No updatable fields provided');

  const { FieldValue } = await import('firebase-admin/firestore');
  update.updatedAt = FieldValue.serverTimestamp();
  await ctx.memberRef.update(update);
  return ok();
}
