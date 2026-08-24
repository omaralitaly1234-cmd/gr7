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

const DAY_MS = 86400000;

/**
 * Compute the dates for a renewal.
 *
 * By default, renewing while the current term still has days left must NOT
 * throw those days away — the new term starts the moment the old one runs out.
 * Renewing after expiry starts from today.
 *
 * `startOverrideMs` lets the admin place the start by hand (the member is
 * travelling, or pays today but begins next week). The consequences are
 * reported rather than hidden:
 *   - `forfeitedDays` — days of the CURRENT term given up by starting before it
 *     ends. Starting early overlaps the old term, and those days are lost.
 *   - `gapDays`       — days later than the natural start, i.e. days the member
 *     is covered by nothing.
 *
 * @param {{ currentEndDateMs?: number|null, durationDays: number, nowMs?: number,
 *           startOverrideMs?: number|null }} input
 * @returns {{ ok: boolean, error?: 'invalid_duration',
 *             startMs?: number, endMs?: number, carriedOverDays?: number,
 *             startOverridden?: boolean, forfeitedDays?: number, gapDays?: number }}
 */
export function computeRenewal({
  currentEndDateMs = null,
  durationDays,
  nowMs = Date.now(),
  startOverrideMs = null,
}) {
  const duration = Math.floor(Number(durationDays));
  if (!Number.isFinite(duration) || duration < 1) {
    return { ok: false, error: 'invalid_duration' };
  }

  const now = Number(nowMs);
  const currentEnd = Number(currentEndDateMs);
  const hasRemaining = Number.isFinite(currentEnd) && currentEnd > now;
  const autoStart = hasRemaining ? currentEnd : now;

  const override = Number(startOverrideMs);
  const startOverridden = startOverrideMs !== null && startOverrideMs !== undefined
    && Number.isFinite(override);
  const startMs = startOverridden ? override : autoStart;

  return {
    ok: true,
    startMs,
    endMs: startMs + duration * DAY_MS,
    // Only the part of the current term that survives: starting before the old
    // term ends preserves days up to the chosen start, not past it.
    carriedOverDays: hasRemaining
      ? Math.max(0, Math.ceil((Math.min(currentEnd, startMs) - now) / DAY_MS))
      : 0,
    startOverridden,
    forfeitedDays: hasRemaining && startMs < currentEnd
      ? Math.ceil((currentEnd - startMs) / DAY_MS)
      : 0,
    gapDays: Math.max(0, Math.ceil((startMs - autoStart) / DAY_MS)),
  };
}
