'use client';

// ============================================
// Reading and writing a member's check-in code against Firestore.
// The rules themselves live in src/lib/member-code.js (pure, tested).
// ============================================

import { getTenantDocuments, updateTenantDocument } from './firestore';
import { normalizeCode, validateCode, findCodeConflict } from '@/lib/member-code';

/**
 * Find the member a scanned/typed code belongs to.
 *
 * Tries the code as given first, then normalised, because historical documents
 * were written before normalisation existed and a QR image may carry either.
 * Both `membershipNumber` and `qrCode` are checked — they are the same value in
 * practice, but a hand-edited record could disagree and the door should still
 * open.
 */
export async function findMemberByCode(tenantId, rawCode) {
  const attempts = [...new Set([String(rawCode || '').trim(), normalizeCode(rawCode)])].filter(Boolean);

  for (const candidate of attempts) {
    for (const field of ['membershipNumber', 'qrCode']) {
      const { data } = await getTenantDocuments(tenantId, 'members',
        [{ field, operator: '==', value: candidate }], null, 1);
      if (data && data.length > 0) return data[0];
    }
  }
  return null;
}

/**
 * Is `code` free for this member to take?
 *
 * @returns {{ ok: boolean, code?: string, error?: string, conflictWith?: object }}
 */
export async function checkCodeAvailable(tenantId, rawCode, selfMemberId = null) {
  const v = validateCode(rawCode);
  if (!v.ok) return v;

  // One query per field rather than fetching a range: an equality match on a
  // single field is index-free and returns at most a handful of rows.
  const found = [];
  for (const field of ['membershipNumber', 'qrCode']) {
    const { data } = await getTenantDocuments(tenantId, 'members',
      [{ field, operator: '==', value: v.code }], null, 5);
    found.push(...(data || []));
  }

  const conflict = findCodeConflict(found, v.code, selfMemberId);
  if (conflict) return { ok: false, error: 'taken', conflictWith: conflict };
  return { ok: true, code: v.code };
}

/**
 * Change a member's code. Writes both fields so the door lookup, the printed
 * card and the admin table never disagree.
 */
export async function setMemberCode(tenantId, memberId, rawCode) {
  const available = await checkCodeAvailable(tenantId, rawCode, memberId);
  if (!available.ok) return available;

  const { error } = await updateTenantDocument(tenantId, 'members', memberId, {
    membershipNumber: available.code,
    qrCode: available.code,
  });
  if (error) return { ok: false, error: 'write_failed', message: error };

  return { ok: true, code: available.code };
}
