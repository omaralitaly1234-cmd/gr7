import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  splitPayment,
  buildInstallmentSchedule,
  applyPaymentToSchedule,
  overdueInstallments,
  scheduleBalance,
} from '../src/lib/installments.js';

const DAY = 24 * 60 * 60 * 1000;

// ---------- splitPayment ----------

test('full payment leaves nothing owed', () => {
  const r = splitPayment(750, 750);
  assert.equal(r.remaining, 0);
  assert.equal(r.isFullyPaid, true);
});

test('down payment leaves the remainder owed', () => {
  const r = splitPayment(750, 300);
  assert.equal(r.paid, 300);
  assert.equal(r.remaining, 450);
  assert.equal(r.isFullyPaid, false);
});

test('overpayment is clamped to the total, never a credit', () => {
  const r = splitPayment(750, 900);
  assert.equal(r.paid, 750);
  assert.equal(r.remaining, 0);
});

test('negative paid amount is clamped to zero', () => {
  const r = splitPayment(750, -100);
  assert.equal(r.paid, 0);
  assert.equal(r.remaining, 750);
});

test('non-numeric input does not produce NaN', () => {
  const r = splitPayment('abc', 'xyz');
  assert.equal(r.total, 0);
  assert.equal(r.paid, 0);
  assert.equal(r.remaining, 0);
});

// ---------- buildInstallmentSchedule ----------

test('schedule sums back to exactly the balance', () => {
  const s = buildInstallmentSchedule(100, 3, Date.now());
  const sum = s.reduce((a, i) => a + i.amount, 0);
  assert.equal(Math.round(sum * 100) / 100, 100);
  assert.equal(s.length, 3);
});

test('uneven splits put the leftover piastres on the last instalment', () => {
  const s = buildInstallmentSchedule(100, 3, Date.now());
  assert.equal(s[0].amount, 33.33);
  assert.equal(s[1].amount, 33.33);
  assert.equal(s[2].amount, 33.34);
});

test('instalments are spaced 30 days apart by default', () => {
  const start = Date.now();
  const s = buildInstallmentSchedule(300, 3, start);
  assert.ok(s[1].dueDate - s[0].dueDate >= 27 * DAY);
  assert.ok(s[2].dueDate - s[0].dueDate >= 57 * DAY);
});

test('a zero balance produces no instalments', () => {
  assert.deepEqual(buildInstallmentSchedule(0, 3, Date.now()), []);
});

test('instalment count below one is coerced to one', () => {
  const s = buildInstallmentSchedule(500, 0, Date.now());
  assert.equal(s.length, 1);
  assert.equal(s[0].amount, 500);
});

// ---------- applyPaymentToSchedule ----------

test('a payment settles the oldest instalment first', () => {
  const s = buildInstallmentSchedule(300, 3, Date.now());
  const { schedule } = applyPaymentToSchedule(s, 100, Date.now());
  assert.equal(schedule[0].status, 'paid');
  assert.equal(schedule[1].status, 'pending');
});

test('a partial payment leaves the instalment pending but records the amount', () => {
  const s = buildInstallmentSchedule(300, 3, Date.now());
  const { schedule } = applyPaymentToSchedule(s, 40, Date.now());
  assert.equal(schedule[0].status, 'pending');
  assert.equal(schedule[0].paidAmount, 40);
});

test('a payment spills over into later instalments', () => {
  const s = buildInstallmentSchedule(300, 3, Date.now());
  const { schedule } = applyPaymentToSchedule(s, 250, Date.now());
  assert.equal(schedule[0].status, 'paid');
  assert.equal(schedule[1].status, 'paid');
  assert.equal(schedule[2].paidAmount, 50);
});

test('paying more than the schedule reports the unallocated excess', () => {
  const s = buildInstallmentSchedule(300, 3, Date.now());
  const { schedule, unallocated } = applyPaymentToSchedule(s, 500, Date.now());
  assert.ok(schedule.every((i) => i.status === 'paid'));
  assert.equal(unallocated, 200);
});

// ---------- balance & overdue ----------

test('scheduleBalance tracks what is still owed', () => {
  const s = buildInstallmentSchedule(300, 3, Date.now());
  assert.equal(scheduleBalance(s), 300);
  const { schedule } = applyPaymentToSchedule(s, 100, Date.now());
  assert.equal(scheduleBalance(schedule), 200);
});

test('overdue lists only unpaid instalments whose date has passed', () => {
  const past = Date.now() - 60 * DAY;
  const s = buildInstallmentSchedule(300, 3, past); // due at -60d, -30d, 0d
  const od = overdueInstallments(s, Date.now());
  assert.equal(od.length, 3);

  const { schedule } = applyPaymentToSchedule(s, 100, Date.now());
  assert.equal(overdueInstallments(schedule, Date.now()).length, 2);
});

test('future instalments are not overdue', () => {
  const s = buildInstallmentSchedule(300, 3, Date.now() + 10 * DAY);
  assert.equal(overdueInstallments(s, Date.now()).length, 0);
});
