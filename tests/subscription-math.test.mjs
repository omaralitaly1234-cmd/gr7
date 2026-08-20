// Unit tests for the pure freeze math shared by all three freeze paths.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFreeze, computeRenewal } from '../src/lib/subscription-math.js';

const DAY = 86400000;
const base = { endDateMs: Date.UTC(2026, 0, 1), freezeDaysUsed: 0, maxFreezeDays: 14 };

test('valid freeze extends end date up-front and increments used', () => {
  const r = computeFreeze(base, 7);
  assert.equal(r.ok, true);
  assert.equal(r.newEndDateMs, base.endDateMs + 7 * DAY);
  assert.equal(r.newFreezeDaysUsed, 7);
  assert.equal(r.remaining, 7);
});

test('freeze exactly to the cap is allowed', () => {
  const r = computeFreeze({ ...base, freezeDaysUsed: 10 }, 4);
  assert.equal(r.ok, true);
  assert.equal(r.newFreezeDaysUsed, 14);
  assert.equal(r.remaining, 0);
});

test('freeze past the cap is rejected', () => {
  const r = computeFreeze({ ...base, freezeDaysUsed: 10 }, 5);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'cap_exceeded');
  assert.equal(r.remaining, 4);
});

test('zero / negative / non-numeric days are rejected', () => {
  for (const d of [0, -3, NaN, 'abc', undefined, null]) {
    const r = computeFreeze(base, d);
    assert.equal(r.ok, false, `days=${d} should be invalid`);
    assert.equal(r.error, 'invalid_days');
  }
});

test('fractional days floor to whole days', () => {
  const r = computeFreeze(base, 3.9);
  assert.equal(r.ok, true);
  assert.equal(r.newFreezeDaysUsed, 3);
});

test('missing cap (max 0) rejects any positive freeze', () => {
  const r = computeFreeze({ endDateMs: base.endDateMs }, 1);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'cap_exceeded');
});

// --- computeRenewal -----------------------------------------------------

test('renewing after expiry starts today', () => {
  const now = Date.UTC(2026, 5, 1);
  const r = computeRenewal({ currentEndDateMs: Date.UTC(2026, 4, 1), durationDays: 30, nowMs: now });
  assert.equal(r.ok, true);
  assert.equal(r.startMs, now);
  assert.equal(r.endMs, now + 30 * DAY);
  assert.equal(r.carriedOverDays, 0);
});

test('renewing early carries the remaining days over', () => {
  const now = Date.UTC(2026, 5, 1);
  const end = now + 10 * DAY;
  const r = computeRenewal({ currentEndDateMs: end, durationDays: 30, nowMs: now });
  assert.equal(r.startMs, end);
  assert.equal(r.endMs, end + 30 * DAY);
  assert.equal(r.carriedOverDays, 10);
});

test('renewing a member with no prior subscription starts today', () => {
  const now = Date.UTC(2026, 5, 1);
  const r = computeRenewal({ currentEndDateMs: null, durationDays: 90, nowMs: now });
  assert.equal(r.startMs, now);
  assert.equal(r.endMs, now + 90 * DAY);
});

test('a plan with no duration is rejected', () => {
  assert.equal(computeRenewal({ durationDays: 0 }).ok, false);
  assert.equal(computeRenewal({ durationDays: undefined }).error, 'invalid_duration');
});
