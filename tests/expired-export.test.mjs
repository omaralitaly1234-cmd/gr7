// The expired-subscription export is the file the gym chases renewals from, so
// the columns it produces are worth pinning down.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExpiredRows, daysSinceExpiry, expiredExportFileName,
  EXPIRED_EXPORT_HEADERS, EXPIRED_EXPORT_WIDTHS,
} from '../src/lib/expired-export.js';
import { parseDateInput, toDateInputValue } from '../src/lib/format.js';

const AR = EXPIRED_EXPORT_HEADERS.ar;

const sub = {
  memberId: 'm1',
  planId: 'gold-monthly',
  planSnapshot: { name: { ar: 'ذهبي — شهري', en: 'Gold — Monthly' }, type: 'gold' },
  startDate: new Date(2026, 5, 1),
  endDate: new Date(2026, 6, 1),
  amountPaid: 900,
  balanceDue: 100,
};

const members = new Map([['m1', {
  id: 'm1',
  membershipNumber: '7470',
  fullName: { ar: 'أحمد محمد', en: 'Ahmed Mohamed' },
  phone: '01012345678',
  assignedTrainerName: { ar: 'كابتن علي', en: 'Coach Ali' },
}]]);

test('a row carries the member details the sheet is chased from', () => {
  const [row] = buildExpiredRows([sub], members, { locale: 'ar', nowMs: new Date(2026, 6, 11).getTime() });
  assert.equal(row[AR.index], 1);
  assert.equal(row[AR.code], '7470');
  assert.equal(row[AR.name], 'أحمد محمد');
  assert.equal(row[AR.phone], '01012345678');
  assert.equal(row[AR.plan], 'ذهبي — شهري');
  assert.equal(row[AR.type], 'ذهبي');
  assert.equal(row[AR.daysSince], 10);
  assert.equal(row[AR.paid], 900);
  assert.equal(row[AR.due], 100);
  assert.equal(row[AR.trainer], 'كابتن علي');
});

test('the phone stays a string so Excel keeps the leading zero', () => {
  const [row] = buildExpiredRows([sub], members);
  assert.equal(typeof row[AR.phone], 'string');
});

test('a subscription whose member was deleted still exports a row', () => {
  const [row] = buildExpiredRows([{ ...sub, memberId: 'gone' }], members);
  assert.equal(row[AR.name], '');
  assert.equal(row[AR.code], '');
  assert.equal(row[AR.plan], 'ذهبي — شهري');
});

test('every column has a width, and column count matches the header set', () => {
  const [row] = buildExpiredRows([sub], members);
  assert.equal(Object.keys(row).length, EXPIRED_EXPORT_WIDTHS.length);
  assert.equal(Object.keys(row).length, Object.keys(AR).length);
});

test('English export uses the English headers and plan name', () => {
  const en = EXPIRED_EXPORT_HEADERS.en;
  const [row] = buildExpiredRows([sub], members, { locale: 'en' });
  assert.equal(row[en.name], 'Ahmed Mohamed');
  assert.equal(row[en.plan], 'Gold — Monthly');
  assert.equal(row[en.type], 'Gold');
  assert.equal(row[en.trainer], 'Coach Ali');
});

test('daysSinceExpiry never goes negative and tolerates a missing date', () => {
  const now = new Date(2026, 6, 1).getTime();
  assert.equal(daysSinceExpiry(new Date(2026, 7, 1), now), 0, 'not expired yet');
  assert.equal(daysSinceExpiry(null, now), 0);
  assert.equal(daysSinceExpiry({ seconds: new Date(2026, 5, 1).getTime() / 1000 }, now), 30);
});

test('the file name is date-stamped and ends in .xlsx', () => {
  assert.equal(expiredExportFileName(new Date(2026, 7, 24), 'ar'), 'الاشتراكات-المنتهية-2026-08-24.xlsx');
  assert.equal(expiredExportFileName(new Date(2026, 7, 24), 'en'), 'expired-subscriptions-2026-08-24.xlsx');
});

// ── The date-input helpers the manual subscription start date relies on ──

test('parseDateInput reads a date input as LOCAL midnight, not UTC', () => {
  const d = parseDateInput('2026-08-24');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 7);
  assert.equal(d.getDate(), 24, 'must not slip a day in timezones behind UTC');
  assert.equal(d.getHours(), 0);
});

test('parseDateInput rejects junk and impossible dates', () => {
  assert.equal(parseDateInput(''), null);
  assert.equal(parseDateInput('24/08/2026'), null);
  assert.equal(parseDateInput('2026-02-31'), null);
  assert.equal(parseDateInput(undefined), null);
});

test('toDateInputValue round-trips through parseDateInput', () => {
  assert.equal(toDateInputValue(parseDateInput('2026-01-05')), '2026-01-05');
  assert.equal(toDateInputValue(null), '');
});

test('a term starting on a chosen date ends duration days later', () => {
  const start = parseDateInput('2026-08-24');
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  assert.equal(toDateInputValue(end), '2026-09-23');
});
