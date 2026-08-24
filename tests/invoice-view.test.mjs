// The invoice is a financial document: the total it prints must be the cash
// that actually changed hands, and the gym's own details must reach it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInvoiceView, invoiceLineDescription, paymentTypeLabel, paymentMethodLabel, money,
} from '../src/lib/invoice-view.js';
import {
  toGymProfile, normalizeInvoicePrefix, clampTaxRate, splitTaxInclusive,
  gymName, gymAddress, DEFAULT_GYM_PROFILE,
} from '../src/lib/gym-profile.js';

const profile = toGymProfile({
  gymName: { ar: 'جيم النصر', en: 'Nasr Gym' },
  gymPhone: '01000000000',
  gymAddress: { ar: 'مدينة نصر، القاهرة', en: 'Nasr City, Cairo' },
  gymEmail: 'info@nasr.gym',
  taxRate: 0,
  invoicePrefix: 'ntg',
});

const member = {
  id: 'm1', membershipNumber: '7470',
  fullName: { ar: 'أحمد محمد', en: 'Ahmed Mohamed' },
  phone: '01012345678', email: 'a@b.com',
};

const payment = {
  memberId: 'm1', memberName: 'أحمد محمد',
  invoiceNumber: 'NTG-2026-0042',
  type: 'subscription',
  method: 'cash',
  amount: 1000,
  discount: 100,
  netAmount: 900,
  createdAt: new Date(2026, 7, 24),
  notes: 'اشتراك جديد',
};

// ── Gym profile ──────────────────────────────────────────────────────────────

test('the gym profile comes from the settings the admin actually typed', () => {
  assert.equal(gymName(profile, 'ar'), 'جيم النصر');
  assert.equal(gymName(profile, 'en'), 'Nasr Gym');
  assert.equal(gymAddress(profile, 'ar'), 'مدينة نصر، القاهرة');
  assert.equal(profile.phone, '01000000000');
});

test('a gym that never opened the settings page still gets a printable profile', () => {
  const p = toGymProfile({});
  assert.equal(gymName(p, 'ar'), DEFAULT_GYM_PROFILE.name.ar);
  assert.equal(p.invoicePrefix, 'INV');
  assert.equal(p.taxRate, 0);
});

test('a plain-string gymName/gymAddress from an older settings doc still works', () => {
  const p = toGymProfile({ gymName: 'Power Time', gymAddress: 'المعادي' });
  assert.equal(gymName(p, 'ar'), 'Power Time');
  assert.equal(gymName(p, 'en'), 'Power Time');
  assert.equal(gymAddress(p, 'en'), 'المعادي');
});

test('the invoice prefix is normalised so the serial can be parsed back', () => {
  assert.equal(normalizeInvoicePrefix('ntg'), 'NTG');
  assert.equal(normalizeInvoicePrefix('  inv-2  '), 'INV');
  assert.equal(normalizeInvoicePrefix(''), 'INV');
  assert.equal(normalizeInvoicePrefix(null), 'INV');
  assert.equal(normalizeInvoicePrefix('١٢٣'), 'INV', 'digits alone cannot be a prefix');
  assert.equal(normalizeInvoicePrefix('ABCDEFGHIJ'), 'ABCDEF', 'capped at six letters');
});

test('the tax rate can never be NaN or out of range — it multiplies money', () => {
  assert.equal(clampTaxRate('14'), 14);
  assert.equal(clampTaxRate(-5), 0);
  assert.equal(clampTaxRate('abc'), 0);
  assert.equal(clampTaxRate(500), 100);
  assert.equal(clampTaxRate(undefined), 0);
});

test('tax is broken OUT of the collected amount, never added on top', () => {
  const r = splitTaxInclusive(1140, 14);
  assert.equal(r.total, 1140, 'the total is untouched — it is what was paid');
  assert.equal(r.base, 1000);
  assert.equal(r.tax, 140);
  assert.equal(r.base + r.tax, r.total);
});

test('with no tax rate the whole amount is the base', () => {
  const r = splitTaxInclusive(900, 0);
  assert.deepEqual(r, { base: 900, tax: 0, rate: 0, total: 900 });
});

// ── Invoice view ─────────────────────────────────────────────────────────────

test('the invoice carries the real payment, member and serial', () => {
  const v = buildInvoiceView(payment, member, profile, { locale: 'ar' });
  assert.equal(v.number, 'NTG-2026-0042');
  assert.equal(v.hasNumber, true);
  assert.equal(v.member.name, 'أحمد محمد');
  assert.equal(v.member.code, '7470');
  assert.equal(v.member.missing, false);
  assert.equal(v.typeLabel, 'اشتراك');
  assert.equal(v.date.getFullYear(), 2026);
});

test('the printed total equals the cash collected, not gross minus discount guesswork', () => {
  const v = buildInvoiceView(payment, member, profile);
  assert.equal(v.totals.subtotal, 1000);
  assert.equal(v.totals.discount, 100);
  assert.equal(v.totals.net, 900, 'netAmount is authoritative');
});

test('an older payment with no netAmount falls back to gross minus discount', () => {
  const v = buildInvoiceView({ amount: 500, discount: 50 }, member, profile);
  assert.equal(v.totals.net, 450);
});

test('a partial payment is not marked as settled', () => {
  const v = buildInvoiceView({ ...payment, netAmount: 400, totalDue: 900, balanceAfter: 500 }, member, profile);
  assert.equal(v.isSettled, false);
  assert.equal(v.totals.balanceAfter, 500);
  assert.equal(v.totals.net, 400, 'the invoice shows what was handed over, not the full price');
});

test('a fully-paid invoice is settled', () => {
  assert.equal(buildInvoiceView(payment, member, profile).isSettled, true);
});

test('a deleted member still yields a usable invoice', () => {
  const v = buildInvoiceView(payment, null, profile, { locale: 'ar' });
  assert.equal(v.member.missing, true);
  assert.equal(v.member.name, 'أحمد محمد', 'falls back to the name stored on the payment');
  assert.equal(v.member.code, '');
});

test('an unnumbered invoice says so instead of inventing a serial', () => {
  const v = buildInvoiceView({ ...payment, invoiceNumber: '' }, member, profile);
  assert.equal(v.hasNumber, false);
  assert.equal(v.number, '');
});

test('tax appears on the invoice only when the gym set a rate', () => {
  const taxed = toGymProfile({ taxRate: 14 });
  const v = buildInvoiceView({ ...payment, netAmount: 1140 }, member, taxed);
  assert.equal(v.totals.taxRate, 14);
  assert.equal(v.totals.tax, 140);
  assert.equal(v.totals.net, 1140, 'the amount paid is unchanged by the tax breakdown');

  const untaxed = buildInvoiceView(payment, member, profile);
  assert.equal(untaxed.totals.taxRate, 0);
  assert.equal(untaxed.totals.tax, 0);
});

test('the line description prefers the note the recording screen wrote', () => {
  assert.equal(invoiceLineDescription({ notes: 'تجديد اشتراك', type: 'subscription' }, 'ar'), 'تجديد اشتراك');
  assert.equal(invoiceLineDescription({ notes: '   ', type: 'spa' }, 'ar'), 'سبا');
  assert.equal(invoiceLineDescription({ type: 'spa' }, 'en'), 'Spa');
});

test('type and method labels are bilingual and never blank', () => {
  assert.equal(paymentTypeLabel('installment', 'ar'), 'قسط');
  assert.equal(paymentTypeLabel('installment', 'en'), 'Instalment');
  assert.equal(paymentTypeLabel('something_new', 'ar'), 'something_new', 'unknown types pass through');
  assert.equal(paymentTypeLabel(undefined, 'ar'), '—');
  assert.ok(paymentMethodLabel('cash', 'ar').includes('كاش'));
  assert.equal(paymentMethodLabel('crypto', 'ar'), 'crypto');
});

test('money renders the currency from the gym settings', () => {
  assert.equal(money(1200, 'EGP', 'en'), '1,200 EGP');
  assert.equal(money(0, 'SAR', 'en'), '0 SAR');
});
