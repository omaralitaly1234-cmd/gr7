// Invoice serials are accounting records — a duplicate or a reused number is
// the one bug that matters here, so the block-allocation planning is pinned
// down hard.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatInvoiceNumber, parseInvoiceNumber, highestInvoiceSeq,
  needsInvoiceNumber, planInvoiceBackfill, INVOICE_PREFIX,
} from '../src/lib/invoice-number.js';

test('formats a padded, year-stamped serial', () => {
  assert.equal(formatInvoiceNumber(42, 2026), 'INV-2026-0042');
  assert.equal(formatInvoiceNumber(1, 2026), 'INV-2026-0001');
  assert.equal(formatInvoiceNumber(12345, 2026), 'INV-2026-12345', 'past 9999 it grows, never truncates');
});

test('refuses to format a non-number as a serial', () => {
  assert.equal(formatInvoiceNumber(0, 2026), '');
  assert.equal(formatInvoiceNumber(-3, 2026), '');
  assert.equal(formatInvoiceNumber('abc', 2026), '');
});

test('parses its own output', () => {
  assert.deepEqual(parseInvoiceNumber(formatInvoiceNumber(7, 2025)),
    { prefix: INVOICE_PREFIX, year: 2025, seq: 7 });
});

test('parses the historical SPA-prefixed numbers too', () => {
  assert.deepEqual(parseInvoiceNumber('SPA-2026-0007'), { prefix: 'SPA', year: 2026, seq: 7 });
});

test('rejects anything that is not a serial', () => {
  for (const v of ['', '-', 'INV-2026', 'INV--0001', '2026-0001', null, undefined, 42, {}]) {
    assert.equal(parseInvoiceNumber(v), null, `should reject ${JSON.stringify(v)}`);
  }
});

test('needsInvoiceNumber spots the blanks the old screens left behind', () => {
  assert.equal(needsInvoiceNumber({ invoiceNumber: 'INV-2026-0001' }), false);
  assert.equal(needsInvoiceNumber({ invoiceNumber: 'SPA-2026-0001' }), false);
  assert.equal(needsInvoiceNumber({ invoiceNumber: '' }), true);
  assert.equal(needsInvoiceNumber({ invoiceNumber: '-' }), true);
  assert.equal(needsInvoiceNumber({}), true);
  assert.equal(needsInvoiceNumber(null), true);
});

test('highestInvoiceSeq spans both prefixes and ignores the blanks', () => {
  assert.equal(highestInvoiceSeq([
    { invoiceNumber: 'INV-2026-0003' },
    { invoiceNumber: 'SPA-2026-0011' },
    { invoiceNumber: '' },
    {},
  ]), 11);
  assert.equal(highestInvoiceSeq([]), 0);
});

test('backfill starts after the counter when the counter is ahead', () => {
  const plan = planInvoiceBackfill({ counterSeq: 50, highestStoredSeq: 12, missingCount: 4 });
  assert.equal(plan.base, 50);
  assert.equal(plan.next, 51, 'first assigned');
  assert.equal(plan.base + plan.count, 54, 'where the counter must end up');
});

test('backfill starts after the stored numbers when the counter was reset', () => {
  // The counter doc is easy to lose (a restore, a manual delete). Trusting it
  // alone here would re-issue numbers that are already printed on receipts.
  const plan = planInvoiceBackfill({ counterSeq: 0, highestStoredSeq: 120, missingCount: 3 });
  assert.equal(plan.next, 121);
  assert.equal(plan.base + plan.count, 123);
});

test('a backfill with nothing missing does not move the counter', () => {
  const plan = planInvoiceBackfill({ counterSeq: 50, highestStoredSeq: 50, missingCount: 0 });
  assert.equal(plan.count, 0);
  assert.equal(plan.base + plan.count, 50);
});

test('the assigned block never overlaps what already exists', () => {
  const existing = [{ invoiceNumber: 'INV-2026-0009' }, { invoiceNumber: 'SPA-2026-0015' }];
  const plan = planInvoiceBackfill({
    counterSeq: 9, highestStoredSeq: highestInvoiceSeq(existing), missingCount: 3,
  });
  const assigned = [0, 1, 2].map(i => formatInvoiceNumber(plan.next + i, 2026));
  assert.deepEqual(assigned, ['INV-2026-0016', 'INV-2026-0017', 'INV-2026-0018']);
  for (const a of assigned) {
    assert.ok(!existing.some(e => e.invoiceNumber === a), `${a} collides with an existing invoice`);
  }
});
