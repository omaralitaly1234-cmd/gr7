// ============================================
// Installment / partial-payment math — pure functions, no Firebase imports,
// so they can be unit-tested and reused from both the client pages and the
// API routes. Money is handled in whole piastres internally to avoid the
// floating-point drift you get from summing 1/3-style splits.
// ============================================

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Split a total into "paid now" and "still owed", clamping the paid amount to
 * the range [0, total] so a typo can never produce a negative balance or a
 * credit the gym did not receive.
 */
export function splitPayment(total, paidNow) {
  const t = Number.isFinite(Number(total)) ? Math.max(0, Number(total)) : 0;
  const raw = Number.isFinite(Number(paidNow)) ? Number(paidNow) : 0;
  const paid = Math.min(Math.max(0, raw), t);
  return {
    total: round2(t),
    paid: round2(paid),
    remaining: round2(t - paid),
    isFullyPaid: round2(t - paid) === 0,
  };
}

/**
 * Build a dated installment schedule for the outstanding balance.
 *
 * The remainder is spread evenly, with any leftover piastres added to the LAST
 * instalment so the schedule always sums back to exactly `remaining`.
 *
 * @param remaining  amount still owed after the up-front payment
 * @param count      number of instalments to generate (>= 1)
 * @param firstDueMs epoch ms of the first due date
 * @param everyDays  spacing between instalments in days (default 30)
 */
export function buildInstallmentSchedule(remaining, count, firstDueMs, everyDays = 30) {
  const rem = Number.isFinite(Number(remaining)) ? Math.max(0, Number(remaining)) : 0;
  const n = Math.max(1, Math.floor(Number(count) || 1));
  if (rem === 0) return [];

  const totalPiastres = Math.round(rem * 100);
  const base = Math.floor(totalPiastres / n);
  const leftover = totalPiastres - base * n;

  const schedule = [];
  for (let i = 0; i < n; i++) {
    const piastres = i === n - 1 ? base + leftover : base;
    const due = new Date(firstDueMs);
    due.setDate(due.getDate() + i * everyDays);
    schedule.push({
      number: i + 1,
      amount: round2(piastres / 100),
      dueDate: due.getTime(),
      status: 'pending', // pending | paid
      paidAt: null,
      paidAmount: 0,
    });
  }
  return schedule;
}

/**
 * Apply a payment against a schedule, oldest instalment first. Returns a NEW
 * schedule plus whatever could not be allocated (overpayment).
 */
export function applyPaymentToSchedule(schedule, amount, paidAtMs) {
  let left = Math.round((Number(amount) || 0) * 100);
  const next = (schedule || []).map((inst) => {
    if (left <= 0 || inst.status === 'paid') return { ...inst };
    const owed = Math.round((inst.amount - (inst.paidAmount || 0)) * 100);
    const applied = Math.min(owed, left);
    left -= applied;
    const paidAmount = round2(((inst.paidAmount || 0) * 100 + applied) / 100);
    const fullyPaid = Math.round(paidAmount * 100) >= Math.round(inst.amount * 100);
    return {
      ...inst,
      paidAmount,
      status: fullyPaid ? 'paid' : 'pending',
      paidAt: fullyPaid ? paidAtMs : inst.paidAt,
    };
  });
  return { schedule: next, unallocated: round2(left / 100) };
}

/** Instalments that are due and not yet paid, as of `nowMs`. */
export function overdueInstallments(schedule, nowMs) {
  return (schedule || []).filter((i) => i.status !== 'paid' && i.dueDate <= nowMs);
}

/** Total still owed across a schedule. */
export function scheduleBalance(schedule) {
  const piastres = (schedule || []).reduce(
    (sum, i) => sum + Math.round((i.amount - (i.paidAmount || 0)) * 100),
    0
  );
  return round2(Math.max(0, piastres) / 100);
}
