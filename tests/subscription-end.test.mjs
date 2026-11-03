// Unit tests for "the member keeps the whole of their last day".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  accessEndMs, isWithinTerm, daysLeftInTerm, startOfGymDayMs,
} from '../src/lib/subscription-end.js';

const HOUR = 3600000;
// Cairo is UTC+2 in November and UTC+3 in July.
const cairo = (y, m, d, h = 0, min = 0) => Date.UTC(y, m - 1, d, h, min) - (m >= 5 && m <= 10 ? 3 : 2) * HOUR;
const nov2Midnight = cairo(2026, 11, 2);

test('an end date on the 1st expires at midnight starting the 2nd, whatever hour it is stored at', () => {
  assert.equal(accessEndMs(cairo(2026, 11, 1, 18)), nov2Midnight, 'hour of sale');
  assert.equal(accessEndMs(cairo(2026, 11, 1, 23, 59)), nov2Midnight, 'imported 23:59');
  assert.equal(accessEndMs(cairo(2026, 11, 1)), nov2Midnight, 'hand-edited midnight');
});

test('the member is still in on the evening of the last day, and out the next morning', () => {
  const end = cairo(2026, 11, 1, 18);
  assert.equal(isWithinTerm(end, cairo(2026, 11, 1, 20)), true);
  assert.equal(isWithinTerm(end, cairo(2026, 11, 1, 23, 59)), true);
  assert.equal(isWithinTerm(end, nov2Midnight), false);
  assert.equal(isWithinTerm(end, cairo(2026, 11, 2, 9)), false);
});

test('no end date means no term', () => {
  assert.equal(accessEndMs(null), null);
  assert.equal(isWithinTerm(null), false);
  assert.equal(isWithinTerm(undefined), false);
  assert.equal(daysLeftInTerm(null), 0);
});

test('days left counts the end date as the last day', () => {
  const end = cairo(2026, 11, 1, 18);
  assert.equal(daysLeftInTerm(end, cairo(2026, 11, 1, 20)), 1);
  assert.equal(daysLeftInTerm(end, cairo(2026, 10, 31, 8)), 2);
  assert.equal(daysLeftInTerm(end, cairo(2026, 11, 2, 9)), 0);
});

test('accepts Firestore timestamps and Dates', () => {
  const ms = cairo(2026, 11, 1, 18);
  assert.equal(accessEndMs({ toMillis: () => ms }), nov2Midnight);
  assert.equal(accessEndMs(new Date(ms)), nov2Midnight);
});

test('summer time: midnight is still Cairo midnight', () => {
  assert.equal(accessEndMs(cairo(2026, 7, 1, 23, 59)), cairo(2026, 7, 2));
  assert.equal(startOfGymDayMs(cairo(2026, 7, 1, 0, 30)), cairo(2026, 7, 1));
});

test('across the clock changes every day still ends at the next midnight', () => {
  for (const [y, m, d] of [[2026, 10, 29], [2026, 10, 30], [2026, 10, 31], [2027, 4, 29], [2027, 4, 30], [2027, 5, 1]]) {
    const until = accessEndMs(Date.UTC(y, m - 1, d, 10));
    const wall = new Date(until).toLocaleString('en-GB', { timeZone: 'Africa/Cairo', hourCycle: 'h23' });
    const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10).split('-').reverse().join('/');
    assert.match(wall, new RegExp(`^${next}, 0[01]:00:00$`), `${y}-${m}-${d} → ${wall}`);
  }
});
