// ============================================
// Member check-in code — the number the member gives at the door, prints on
// their card, and that the QR scanner reads.
//
// In the live data `membershipNumber` and `qrCode` are always the same value
// (short numeric strings like "7470", and "0634" — leading zeros are
// significant, so codes are strings, never numbers). This module keeps that
// single-value model: setting a member's code writes both fields.
//
// Pure — no Firebase imports — so the rules can be unit-tested.
// ============================================

export const CODE_MIN = 2;
export const CODE_MAX = 20;

/**
 * Clean up a code as typed or scanned: trim, drop inner whitespace, upper-case.
 *
 * Upper-casing is a no-op for the numeric codes this gym uses, and it stops a
 * letter-bearing code from failing to scan just because it was entered in a
 * different case. Lookups normalise the same way, so the two always agree.
 */
export function normalizeCode(raw) {
  if (raw === null || raw === undefined) return '';
  return String(raw).replace(/\s+/g, '').toUpperCase();
}

/**
 * Validate a code the admin typed.
 *
 * @returns {{ ok: boolean, code?: string, error?: 'empty'|'too_short'|'too_long'|'bad_chars' }}
 */
export function validateCode(raw) {
  const code = normalizeCode(raw);
  if (!code) return { ok: false, error: 'empty' };
  if (code.length < CODE_MIN) return { ok: false, error: 'too_short' };
  if (code.length > CODE_MAX) return { ok: false, error: 'too_long' };
  // Letters, digits, dash and underscore. Anything else (slashes, Arabic
  // digits, punctuation) would be ambiguous to read out or type at the door.
  if (!/^[A-Z0-9_-]+$/.test(code)) return { ok: false, error: 'bad_chars' };
  return { ok: true, code };
}

/** Human-readable reason, for toasts. */
export function codeErrorMessage(error, isAr) {
  switch (error) {
    case 'empty':
      return isAr ? 'اكتب الكود' : 'Enter a code';
    case 'too_short':
      return isAr ? `الكود لازم يكون ${CODE_MIN} خانات على الأقل` : `Code must be at least ${CODE_MIN} characters`;
    case 'too_long':
      return isAr ? `الكود مش أطول من ${CODE_MAX} خانة` : `Code must be at most ${CODE_MAX} characters`;
    case 'bad_chars':
      return isAr ? 'الكود يقبل أرقام وحروف إنجليزية و - و _ بس' : 'Code may contain letters, digits, - and _ only';
    case 'taken':
      return isAr ? 'الكود ده مستخدم لعضو تاني' : 'That code is already used by another member';
    default:
      return isAr ? 'كود غير صالح' : 'Invalid code';
  }
}

/**
 * Which member documents conflict with `code`, ignoring the member being
 * edited. Takes already-fetched candidates so the caller owns the querying.
 *
 * @param {Array<{id: string, membershipNumber?: string, qrCode?: string}>} candidates
 * @param {string} code       normalised code
 * @param {string} [selfId]   member being edited, allowed to keep its own code
 */
export function findCodeConflict(candidates, code, selfId = null) {
  return (candidates || []).find(m =>
    m.id !== selfId &&
    (normalizeCode(m.membershipNumber) === code || normalizeCode(m.qrCode) === code)
  ) || null;
}
