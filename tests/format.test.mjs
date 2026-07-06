// Unit tests for lib/format.js — the shared date/number coercion that replaced
// ~20 divergent inline versions. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toDate, formatDate, formatNumber } from '../src/lib/format.js';

test('toDate: Firestore Timestamp (has toDate)', () => {
  const d = new Date('2026-06-18T00:00:00Z');
  const ts = { toDate: () => d };
  assert.equal(toDate(ts).getTime(), d.getTime());
});

test('toDate: { seconds } shape', () => {
  const secs = Math.floor(Date.UTC(2026, 5, 18) / 1000);
  assert.equal(toDate({ seconds: secs }).getTime(), secs * 1000);
});

test('toDate: ISO string', () => {
  assert.equal(toDate('2026-06-18T00:00:00Z').getTime(), Date.parse('2026-06-18T00:00:00Z'));
});

test('toDate: millis number', () => {
  assert.equal(toDate(1750000000000).getTime(), 1750000000000);
});

test('toDate: Date passthrough', () => {
  const d = new Date('2026-01-01');
  assert.equal(toDate(d), d);
});

test('toDate: null / undefined / empty → null', () => {
  assert.equal(toDate(null), null);
  assert.equal(toDate(undefined), null);
  assert.equal(toDate(''), null);
});

test('toDate: invalid string → null (not Invalid Date)', () => {
  assert.equal(toDate('not-a-date'), null);
});

test('toDate: invalid Date object → null', () => {
  assert.equal(toDate(new Date('nonsense')), null);
});

test('formatDate: null → "-"', () => {
  assert.equal(formatDate(null), '-');
});

test('formatDate: valid value returns a non-dash string', () => {
  const out = formatDate('2026-06-18T00:00:00Z', 'en');
  assert.notEqual(out, '-');
  assert.equal(typeof out, 'string');
});

test('formatNumber: coerces junk to zero (en locale)', () => {
  assert.equal(formatNumber(null, 'en'), '0');
  assert.equal(formatNumber('abc', 'en'), '0');
  assert.equal(typeof formatNumber(1234.5, 'en'), 'string');
});

test('formatNumber: default (ar) locale uses Arabic-Indic digits', () => {
  assert.equal(formatNumber(0), '٠'); // proves locale defaulting works
});
