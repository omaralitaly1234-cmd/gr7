// Unit tests for the check-in "subscription ending soon" warning.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeExpiryWarning, toExpiryWarningSettings, expiryWarningText, expiryNotificationId,
  DEFAULT_EXPIRY_WARNING,
} from '../src/lib/expiry-warning.js';

const DAY = 86400000;
const now = Date.UTC(2026, 9, 27, 10);
const far = now + 20 * DAY;

test('12-class plan warns at 2, 1 and 0 classes left, not at 3', () => {
  const at = (left) => computeExpiryWarning({ totalSessions: 12, remainingSessions: left, endDateMs: far, nowMs: now });
  assert.equal(at(3), null);
  assert.deepEqual(at(2), { kind: 'sessions', left: 2 });
  assert.deepEqual(at(1), { kind: 'sessions', left: 1 });
  assert.deepEqual(at(0), { kind: 'sessions', left: 0 });
});

test('month plan warns at 2 and 1 days left, not at 3', () => {
  const at = (endDateMs) => computeExpiryWarning({ totalSessions: null, endDateMs, nowMs: now });
  assert.equal(at(now + 3 * DAY), null);
  assert.deepEqual(at(now + 2 * DAY), { kind: 'days', left: 2 });
  assert.deepEqual(at(now + 1.5 * DAY), { kind: 'days', left: 2 });
  assert.deepEqual(at(now + 1 * DAY), { kind: 'days', left: 1 });
  assert.deepEqual(at(now + 2 * 3600000), { kind: 'days', left: 1 });
});

test('a session plan still warns on its end date when classes are plentiful', () => {
  const w = computeExpiryWarning({ totalSessions: 12, remainingSessions: 7, endDateMs: now + DAY, nowMs: now });
  assert.deepEqual(w, { kind: 'days', left: 1 });
});

test('classes win over days when both are close', () => {
  const w = computeExpiryWarning({ totalSessions: 12, remainingSessions: 1, endDateMs: now + DAY, nowMs: now });
  assert.equal(w.kind, 'sessions');
});

test('disabled or missing end date means no warning', () => {
  const off = { ...DEFAULT_EXPIRY_WARNING, enabled: false };
  assert.equal(computeExpiryWarning({ totalSessions: 12, remainingSessions: 1, nowMs: now, settings: off }), null);
  assert.equal(computeExpiryWarning({ totalSessions: null, endDateMs: null, nowMs: now }), null);
});

test('settings: defaults on, thresholds clamp to whole numbers 1..30', () => {
  assert.deepEqual(toExpiryWarningSettings({}), DEFAULT_EXPIRY_WARNING);
  assert.equal(toExpiryWarningSettings({ expiryWarningEnabled: false }).enabled, false);
  assert.equal(toExpiryWarningSettings({ expiryWarningSessions: 3.7 }).sessionsBefore, 3);
  assert.equal(toExpiryWarningSettings({ expiryWarningDays: 0 }).daysBefore, 2);
  assert.equal(toExpiryWarningSettings({ expiryWarningDays: 'x' }).daysBefore, 2);
  assert.equal(toExpiryWarningSettings({ expiryWarningDays: 99 }).daysBefore, 30);
});

test('custom thresholds are honoured', () => {
  const s = toExpiryWarningSettings({ expiryWarningSessions: 3, expiryWarningDays: 5 });
  assert.deepEqual(computeExpiryWarning({ totalSessions: 12, remainingSessions: 3, endDateMs: far, nowMs: now, settings: s }), { kind: 'sessions', left: 3 });
  assert.deepEqual(computeExpiryWarning({ endDateMs: now + 5 * DAY, nowMs: now, settings: s }), { kind: 'days', left: 5 });
});

test('text uses the Arabic dual and a last-class wording', () => {
  assert.match(expiryWarningText({ kind: 'sessions', left: 2 }).body.ar, /حصتين/);
  assert.match(expiryWarningText({ kind: 'days', left: 2 }).body.ar, /يومين/);
  assert.match(expiryWarningText({ kind: 'days', left: 1 }).body.en, /1 day left/);
  assert.match(expiryWarningText({ kind: 'sessions', left: 0 }).title.ar, /آخر حصة/);
});

test('notification id is stable per subscription and step', () => {
  assert.equal(expiryNotificationId('abc', { kind: 'sessions', left: 2 }), 'expiry_abc_s2');
  assert.equal(expiryNotificationId('abc', { kind: 'days', left: 1 }), 'expiry_abc_d1');
  assert.notEqual(expiryNotificationId('abc', { kind: 'days', left: 1 }), expiryNotificationId('abc', { kind: 'days', left: 2 }));
});
