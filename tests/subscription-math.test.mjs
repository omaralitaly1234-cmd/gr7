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

// --- computeRenewal: hand-picked start date -----------------------------
// The desk can place the start itself (the member travels, or pays today and
// begins next week). Whatever that costs the member must be reported, not
// silently absorbed.

test('a manual start date overrides the automatic one', () => {
  const now = Date.UTC(2026, 5, 1);
  const chosen = Date.UTC(2026, 5, 15);
  const r = computeRenewal({ currentEndDateMs: null, durationDays: 30, nowMs: now, startOverrideMs: chosen });
  assert.equal(r.startOverridden, true);
  assert.equal(r.startMs, chosen);
  assert.equal(r.endMs, chosen + 30 * DAY);
});

test('leaving the start blank keeps the automatic behaviour exactly', () => {
  const now = Date.UTC(2026, 5, 1);
  const end = now + 10 * DAY;
  const auto = computeRenewal({ currentEndDateMs: end, durationDays: 30, nowMs: now });
  const blank = computeRenewal({ currentEndDateMs: end, durationDays: 30, nowMs: now, startOverrideMs: null });
  assert.equal(blank.startMs, auto.startMs);
  assert.equal(blank.endMs, auto.endMs);
  assert.equal(blank.carriedOverDays, auto.carriedOverDays);
  assert.equal(blank.startOverridden, false);
});

test('starting BEFORE the current term ends forfeits the overlap', () => {
  const now = Date.UTC(2026, 5, 1);
  const end = now + 10 * DAY;          // 10 days still on the clock
  const chosen = now + 4 * DAY;        // start 6 days early
  const r = computeRenewal({ currentEndDateMs: end, durationDays: 30, nowMs: now, startOverrideMs: chosen });
  assert.equal(r.startMs, chosen);
  assert.equal(r.forfeitedDays, 6, 'the overlapped days are lost');
  assert.equal(r.carriedOverDays, 4, 'only the days up to the new start survive');
  assert.equal(r.gapDays, 0);
});

test('starting AFTER the current term ends leaves an uncovered gap', () => {
  const now = Date.UTC(2026, 5, 1);
  const end = now + 10 * DAY;
  const chosen = end + 5 * DAY;
  const r = computeRenewal({ currentEndDateMs: end, durationDays: 30, nowMs: now, startOverrideMs: chosen });
  assert.equal(r.gapDays, 5);
  assert.equal(r.forfeitedDays, 0);
  assert.equal(r.carriedOverDays, 10, 'the current term still runs out naturally');
});

test('a manual start equal to the automatic one costs nothing', () => {
  const now = Date.UTC(2026, 5, 1);
  const end = now + 10 * DAY;
  const r = computeRenewal({ currentEndDateMs: end, durationDays: 30, nowMs: now, startOverrideMs: end });
  assert.equal(r.forfeitedDays, 0);
  assert.equal(r.gapDays, 0);
  assert.equal(r.carriedOverDays, 10);
});

test('a future start on an EXPIRED subscription is a gap, not a forfeit', () => {
  const now = Date.UTC(2026, 5, 1);
  const r = computeRenewal({
    currentEndDateMs: Date.UTC(2026, 4, 1), durationDays: 30, nowMs: now,
    startOverrideMs: now + 7 * DAY,
  });
  assert.equal(r.gapDays, 7);
  assert.equal(r.forfeitedDays, 0);
  assert.equal(r.carriedOverDays, 0);
});

test('backdating the start before today never reports negative days', () => {
  const now = Date.UTC(2026, 5, 1);
  const r = computeRenewal({
    currentEndDateMs: now + 10 * DAY, durationDays: 30, nowMs: now,
    startOverrideMs: now - 5 * DAY,
  });
  assert.equal(r.startMs, now - 5 * DAY);
  assert.equal(r.gapDays, 0, 'a start in the past is not a gap');
  assert.ok(r.carriedOverDays >= 0);
  assert.equal(r.forfeitedDays, 15);
});

test('an unparseable start override falls back to automatic', () => {
  const now = Date.UTC(2026, 5, 1);
  const r = computeRenewal({ currentEndDateMs: null, durationDays: 30, nowMs: now, startOverrideMs: NaN });
  assert.equal(r.startOverridden, false);
  assert.equal(r.startMs, now);
});
