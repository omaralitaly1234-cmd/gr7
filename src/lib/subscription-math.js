// ============================================
// Pure subscription/freeze math — NO Firebase imports, fully unit-testable.
// Used by the member freeze API and both admin freeze paths so the up-front
// model and the maxFreezeDays cap are computed identically everywhere.
// ============================================

/**
 * Compute the result of freezing a subscription for `days`, using the up-front
 * model (end date extended immediately by N days).
 *
 * @param {{ endDateMs: number, freezeDaysUsed?: number, maxFreezeDays?: number }} sub
 * @param {number|string} days
 * @returns {{ ok: boolean, error?: 'invalid_days'|'cap_exceeded',
 *             remaining: number, newEndDateMs?: number, newFreezeDaysUsed?: number }}
 */
export function computeFreeze({ endDateMs, freezeDaysUsed = 0, maxFreezeDays = 0 }, days) {
  const used = Number(freezeDaysUsed) || 0;
  const max = Number(maxFreezeDays) || 0;
  const remainingBefore = Math.max(0, max - used);

  const n = Math.floor(Number(days));
  if (!Number.isFinite(n) || n < 1) {
    return { ok: false, error: 'invalid_days', remaining: remainingBefore };
  }
  if (used + n > max) {
    return { ok: false, error: 'cap_exceeded', remaining: remainingBefore };
  }
  return {
    ok: true,
    remaining: remainingBefore - n,
    newEndDateMs: Number(endDateMs) + n * 86400000,
    newFreezeDaysUsed: used + n,
  };
}

/**
 * Compute the dates for a renewal.
 *
 * Renewing while the current term still has days left must NOT throw those days
 * away — the new term starts the moment the old one runs out. Renewing after
 * expiry starts from today.
 *
 * @param {{ currentEndDateMs?: number|null, durationDays: number, nowMs?: number }} input
 * @returns {{ ok: boolean, error?: 'invalid_duration',
 *             startMs?: number, endMs?: number, carriedOverDays?: number }}
 */
export function computeRenewal({ currentEndDateMs = null, durationDays, nowMs = Date.now() }) {
  const duration = Math.floor(Number(durationDays));
  if (!Number.isFinite(duration) || duration < 1) {
    return { ok: false, error: 'invalid_duration' };
  }

  const now = Number(nowMs);
  const currentEnd = Number(currentEndDateMs);
  const hasRemaining = Number.isFinite(currentEnd) && currentEnd > now;
  const startMs = hasRemaining ? currentEnd : now;

  return {
    ok: true,
    startMs,
    endMs: startMs + duration * 86400000,
    carriedOverDays: hasRemaining ? Math.ceil((currentEnd - now) / 86400000) : 0,
  };
}
